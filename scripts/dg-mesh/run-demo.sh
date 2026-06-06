#!/usr/bin/env bash
# Run DG-Mesh training on a bundled demo config (GPU required).
set -euo pipefail

DG_ROOT="$(cd "$(dirname "$0")/../../DG-Mesh" && pwd)"
SCENE="${1:-d-nerf}"

PYTHON="${DG_MESH_PYTHON:-python3}"
cd "$DG_ROOT"

case "$SCENE" in
  d-nerf)
    CONFIG="dgmesh/configs/d-nerf/jumpingjacks.yaml"
    NEED="$DG_ROOT/data/d-nerf/jumpingjacks/transforms_train.json"
    ;;
  iphone)
    CONFIG="dgmesh/configs/iphone/tiger.yaml"
    NEED="$DG_ROOT/data/iphone-captured/tiger/dataset.json"
    ;;
  *)
    echo "Usage: $0 [d-nerf|iphone]"
    exit 1
    ;;
esac

if [[ ! -f "$NEED" ]]; then
  echo "Dataset missing for scene '$SCENE'."
  echo "Run: bash scripts/dg-mesh/download-demo-data.sh"
  echo "Or download iPhone data from: https://github.com/Isabella98Liu/DG-Mesh/releases/tag/datasets"
  exit 1
fi

if ! command -v nvidia-smi >/dev/null; then
  echo "ERROR: NVIDIA GPU required. DG-Mesh training uses CUDA."
  exit 1
fi

echo "Training with config: $CONFIG"
echo "Python: $PYTHON"
echo "This runs ~25,000 iterations and may take hours on first run."
echo

"$PYTHON" dgmesh/train.py --config "$CONFIG"

echo
echo "Training finished. Check outputs under DG-Mesh/outputs/"
echo "Meshes: outputs/<scene>/.../dynamic_mesh/frame_0.ply"
echo "Visualize: python dgmesh/render_test.py --config $CONFIG --start_checkpoint <checkpoint_dir>"
