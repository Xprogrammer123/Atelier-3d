#!/usr/bin/env python3
"""
Atelier scan → mesh pipeline worker step.

1. Reads scan video from ATELIER_WORK_DIR/scan.webm
2. Extracts frames with ffmpeg
3. Optionally runs DG-Mesh training (when DG_MESH_ROOT + GPU env configured)
4. Uploads resulting GLB to Supabase listings bucket

Env:
  NEXT_PUBLIC_SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  ATELIER_LISTING_ID
  ATELIER_WORK_DIR
  DG_MESH_ROOT          — path to DG-Mesh repo (optional)
  DG_MESH_PYTHON        — python with dg-mesh deps (optional)
  DG_MESH_CONFIG        — yaml config path (optional)
  MESH_SKIP_DG_TRAIN=1  — skip training, use MESH_DEV_GLB if set (dev only)
  MESH_DEV_GLB          — local glb path for dev/testing without GPU
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path


BUCKET = "listings"


def env(name: str, required: bool = True) -> str | None:
    value = os.environ.get(name, "").strip()
    if required and not value:
        raise RuntimeError(f"Missing environment variable: {name}")
    return value or None


def log(msg: str) -> None:
    print(f"[atelier-mesh] {msg}", flush=True)


def run(cmd: list[str], cwd: str | None = None) -> None:
    log(f"run: {' '.join(cmd)}")
    subprocess.run(cmd, cwd=cwd, check=True)


def supabase_upload(listing_id: str, storage_path: str, file_path: Path, content_type: str) -> None:
    base = env("NEXT_PUBLIC_SUPABASE_URL")
    key = env("SUPABASE_SERVICE_ROLE_KEY")
    url = f"{base}/storage/v1/object/{BUCKET}/{storage_path}"

    with file_path.open("rb") as f:
        data = f.read()

    req = urllib.request.Request(
        url,
        data=data,
        method="POST",
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": content_type,
            "x-upsert": "true",
        },
    )

    try:
        with urllib.request.urlopen(req) as resp:
            if resp.status not in (200, 201):
                raise RuntimeError(f"Upload failed: HTTP {resp.status}")
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Upload failed: HTTP {e.code} {body}") from e


def extract_frames(video_path: Path, frames_dir: Path, fps: int = 2) -> int:
    frames_dir.mkdir(parents=True, exist_ok=True)
    pattern = str(frames_dir / "frame_%04d.jpg")
    run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(video_path),
            "-vf",
            f"fps={fps}",
            "-q:v",
            "2",
            pattern,
        ]
    )
    frames = sorted(frames_dir.glob("frame_*.jpg"))
    if not frames:
        raise RuntimeError("ffmpeg produced no frames — check video format")
    log(f"extracted {len(frames)} frames")
    return len(frames)


def find_output_glb(work_dir: Path) -> Path | None:
    candidates = list(work_dir.rglob("dynamic_glb/frame_0.glb"))
    candidates += list(work_dir.rglob("frame_0.glb"))
    candidates += list(work_dir.rglob("*.glb"))
    for path in candidates:
        if path.is_file() and path.stat().st_size > 100:
            return path
    return None


def run_dg_mesh_training(dataset_dir: Path, work_dir: Path) -> Path:
    dg_root = Path(env("DG_MESH_ROOT"))
    train_py = dg_root / "dgmesh" / "train.py"
    if not train_py.is_file():
        raise RuntimeError(f"DG-Mesh train.py not found at {train_py}")

    config_path = os.environ.get("DG_MESH_CONFIG", "").strip()
    if not config_path:
        config_path = str(dg_root / "dgmesh" / "configs" / "iphone" / "tiger.yaml")
    config_path = Path(config_path)
    if not config_path.is_file():
        raise RuntimeError(f"DG-Mesh config not found: {config_path}")

    python = os.environ.get("DG_MESH_PYTHON", "python3")
    listing_id = env("ATELIER_LISTING_ID")

    custom_config = work_dir / "dg_mesh_config.yaml"
    with config_path.open() as src:
        content = src.read()
    content = content.replace('source_path: "data/iphone-captured/tiger"', f'source_path: "{dataset_dir}"')
    content = content.replace('model_path: "outputs/iphone-captured/tiger"', f'model_path: "{work_dir / "dg_output"}"')
    custom_config.write_text(content)

    log("starting DG-Mesh training (this can take hours on GPU)")
    run([python, str(train_py), "--config", str(custom_config)], cwd=str(dg_root))

    glb = find_output_glb(work_dir / "dg_output")
    if not glb:
        raise RuntimeError("DG-Mesh training finished but no GLB was found in output")
    return glb


def prepare_stub_dataset(frames_dir: Path, dataset_dir: Path) -> None:
    """Minimal folder layout note for future preprocessing automation."""
    manifest = {
        "listing_id": env("ATELIER_LISTING_ID"),
        "frame_count": len(list(frames_dir.glob("frame_*.jpg"))),
        "note": "Full iPhone/Nerfies layout (camera JSON, masks) required before DG-Mesh training.",
    }
    dataset_dir.mkdir(parents=True, exist_ok=True)
    (dataset_dir / "atelier_manifest.json").write_text(json.dumps(manifest, indent=2))


def main() -> int:
    listing_id = sys.argv[1] if len(sys.argv) > 1 else env("ATELIER_LISTING_ID")
    work_dir = Path(env("ATELIER_WORK_DIR"))
    video_path = work_dir / "scan.webm"
    if not video_path.is_file():
        video_path = work_dir / "scan.mp4"
    if not video_path.is_file():
        raise RuntimeError(f"Scan video missing in {work_dir}")

    frames_dir = work_dir / "frames"
    dataset_dir = work_dir / "dataset"
    frame_count = extract_frames(video_path, frames_dir)
    prepare_stub_dataset(frames_dir, dataset_dir)

    glb_path: Path | None = None

    dev_glb = os.environ.get("MESH_DEV_GLB", "").strip()
    if dev_glb and Path(dev_glb).is_file():
        log(f"using MESH_DEV_GLB={dev_glb}")
        glb_path = Path(dev_glb)
    elif os.environ.get("MESH_SKIP_DG_TRAIN") == "1":
        raise RuntimeError(
            "Frames extracted but mesh training skipped. Set DG_MESH_ROOT on a GPU machine "
            "or MESH_DEV_GLB for local testing."
        )
    elif os.environ.get("DG_MESH_ROOT"):
        glb_path = run_dg_mesh_training(dataset_dir, work_dir)
    else:
        raise RuntimeError(
            f"Extracted {frame_count} frames from scan video. "
            "Configure DG_MESH_ROOT (and GPU Python env) on the mesh worker, "
            "or set MESH_DEV_GLB for development."
        )

    assert glb_path is not None
    storage_path = f"{listing_id}/model.glb"
    supabase_upload(listing_id, storage_path, glb_path, "model/gltf-binary")
    log(f"uploaded GLB to {storage_path}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        log(f"ERROR: {exc}")
        raise SystemExit(1)
