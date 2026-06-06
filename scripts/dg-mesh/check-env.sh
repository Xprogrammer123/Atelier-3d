#!/usr/bin/env bash
# Check whether this machine can run DG-Mesh training standalone.
set -euo pipefail

DG_ROOT="$(cd "$(dirname "$0")/../../DG-Mesh" && pwd)"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ok() { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}!${NC} $1"; }
fail() { echo -e "${RED}✗${NC} $1"; }

echo "DG-Mesh standalone environment check"
echo "Repo: $DG_ROOT"
echo

if [[ -d "$DG_ROOT/dgmesh" ]]; then ok "DG-Mesh repo present"; else fail "Clone missing at DG-Mesh/"; exit 1; fi

if command -v ffmpeg >/dev/null; then ok "ffmpeg: $(ffmpeg -version 2>&1 | head -1)"; else fail "ffmpeg not installed"; fi

if command -v nvidia-smi >/dev/null; then
  ok "NVIDIA GPU detected"
  nvidia-smi --query-gpu=name,memory.total --format=csv,noheader | sed 's/^/    /'
else
  fail "No NVIDIA GPU (nvidia-smi missing) — DG-Mesh training requires CUDA"
fi

PYTHON="${DG_MESH_PYTHON:-}"
if [[ -z "$PYTHON" && -n "${CONDA_PREFIX:-}" ]]; then PYTHON="$CONDA_PREFIX/bin/python"; fi
if [[ -z "$PYTHON" ]]; then PYTHON="$(command -v python3 || true)"; fi

if [[ -z "$PYTHON" ]]; then
  fail "No Python found"
else
  ok "Python: $PYTHON ($("$PYTHON" --version 2>&1))"
  if "$PYTHON" -c "import torch; print(torch.__version__, 'cuda=', torch.cuda.is_available())" 2>/dev/null; then
    :
  else
    fail "PyTorch not installed in this Python — create the dg-mesh conda env (see DG-Mesh/README.md)"
  fi
fi

echo
echo "Dataset folders (need at least one to train):"
for path in \
  "$DG_ROOT/data/d-nerf/jumpingjacks" \
  "$DG_ROOT/data/iphone-captured/tiger" \
  "$DG_ROOT/data/nerfies/toby-sit"; do
  if [[ -d "$path" ]]; then ok "Found $path"; else warn "Missing $path"; fi
done

echo
echo "How DG-Mesh works (standalone, before Atelier):"
cat <<'EOF'
  1. You provide a PREPROCESSED dataset — not raw phone video alone.
     Each format includes: RGB frames, camera poses (JSON), foreground masks,
     and often points.npy / dataset.json (iPhone/Nerfies layout).

  2. Training: python dgmesh/train.py --config <yaml>
     - Builds deformable 3D Gaussians + mesh (~25k GPU iterations, hours)
     - Requires CUDA (hard-coded in train loop)

  3. Output: outputs/.../dynamic_mesh/frame_*.ply (mesh per time step)
     - render_test.py can visualize a trained checkpoint
     - Atelier still needs PLY→GLB conversion (not built into DG-Mesh by default)

  Atelier today only extracts ffmpeg frames from your scan — it does NOT yet
  build the full iPhone/Nerfies dataset layout DG-Mesh expects.
EOF

echo
if command -v nvidia-smi >/dev/null && [[ -d "$DG_ROOT/data/d-nerf/jumpingjacks" ]]; then
  echo "Ready to try: bash scripts/dg-mesh/run-demo.sh d-nerf"
elif command -v nvidia-smi >/dev/null; then
  echo "Next: bash scripts/dg-mesh/download-demo-data.sh  then  bash scripts/dg-mesh/run-demo.sh"
else
  echo "Next: use a Linux machine with NVIDIA GPU + CUDA, then follow scripts/dg-mesh/README.md"
fi
