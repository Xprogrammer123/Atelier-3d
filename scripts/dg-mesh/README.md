# Testing DG-Mesh standalone (before Atelier)

DG-Mesh lives in `DG-Mesh/` — a separate research codebase (ECCV 2024). Atelier only wraps it later via `npm run worker`.

## What DG-Mesh expects (not raw scan video)

| Dataset type | Example config | Required on disk |
|--------------|----------------|------------------|
| D-NeRF (synthetic) | `dgmesh/configs/d-nerf/jumpingjacks.yaml` | `transforms_train.json`, images, masks |
| iPhone / Record3D | `dgmesh/configs/iphone/tiger.yaml` | `dataset.json`, `metadata.json`, `camera/*.json`, `rgb/`, masks |
| Nerfies | `dgmesh/configs/nerfies/toby-sit.yaml` | Nerfies folder layout + `dataset.json` |

**A walk-around `.webm` from Atelier is not enough.** You need camera poses + masks + the folder layout above (usually from Record3D + DEVA preprocessing for real captures).

## Pipeline (standalone)

```
Preprocessed dataset  →  train.py (GPU, ~25k iters)  →  dynamic_mesh/frame_*.ply
                                                      →  render_test.py (optional viz)
```

## One-time setup (GPU machine)

Follow `DG-Mesh/README.md`:

```bash
conda create -n dg-mesh python=3.9
conda activate dg-mesh
conda install pytorch torchvision torchaudio pytorch-cuda=11.8 -c pytorch -c nvidia
# + nvdiffrast, pytorch3d, submodules — see DG-Mesh/README.md
pip install -r DG-Mesh/requirements.txt
pip install DG-Mesh/dgmesh/submodules/diff-gaussian-rasterization
pip install DG-Mesh/dgmesh/submodules/simple-knn
```

Set in `.env.local` when using Atelier worker later:

```bash
DG_MESH_ROOT=/home/you/Documents/Atliers-3d/DG-Mesh
DG_MESH_PYTHON=/path/to/conda/envs/dg-mesh/bin/python
```

## Quick test from Atelier repo

```bash
bash scripts/dg-mesh/check-env.sh          # what's missing on this machine
bash scripts/dg-mesh/download-demo-data.sh # D-NeRF jumpingjacks (~200MB zip)
bash scripts/dg-mesh/run-demo.sh d-nerf      # train (hours, GPU only)
```

## This machine right now

Run `check-env.sh` — likely **no CUDA GPU** and **no conda dg-mesh env**, so training cannot run locally. Use a cloud GPU (Lambda, RunPod, etc.) or a desktop with NVIDIA.

## Atelier gap

- Atelier extracts frames from your scan but does **not** build the iPhone dataset layout yet.
- DG-Mesh outputs **PLY**, not GLB — Atelier's worker looks for `dynamic_glb/frame_0.glb` (needs conversion or script update).
- For end-to-end Atelier tests without GPU: `MESH_DEV_GLB=/path/to/model.glb` in `.env.local`.
