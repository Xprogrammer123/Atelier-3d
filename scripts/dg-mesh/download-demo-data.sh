#!/usr/bin/env bash
# Download a small DG-Mesh demo dataset (D-NeRF jumpingjacks).
# This is ~200MB+; run on a machine with disk space and stable network.
set -euo pipefail

DG_ROOT="$(cd "$(dirname "$0")/../../DG-Mesh" && pwd)"
DATA_ZIP="$DG_ROOT/data/d-nerf-data.zip"
TARGET="$DG_ROOT/data/d-nerf/jumpingjacks"

mkdir -p "$DG_ROOT/data/d-nerf"

if [[ -f "$TARGET/transforms_train.json" ]]; then
  echo "Already have D-NeRF jumpingjacks at $TARGET"
  exit 0
fi

echo "Downloading D-NeRF dataset zip (official link from DG-Mesh README)..."
echo "This can take several minutes."

# Official D-NeRF bundle (multiple scenes). We only need jumpingjacks/.
curl -L --fail --progress-bar \
  "https://www.dropbox.com/scl/fi/cdcmkufncwcikk1dzbgb4/data.zip?rlkey=n5m21i84v2b2xk6h7qgiu8nkg&dl=1" \
  -o "$DATA_ZIP"

echo "Extracting jumpingjacks scene..."
unzip -q "$DATA_ZIP" "jumpingjacks/*" -d "$DG_ROOT/data/d-nerf" || {
  # Some zips nest as data/jumpingjacks
  unzip -q "$DATA_ZIP" -d "$DG_ROOT/data/d-nerf-extract"
  if [[ -d "$DG_ROOT/data/d-nerf-extract/jumpingjacks" ]]; then
    mv "$DG_ROOT/data/d-nerf-extract/jumpingjacks" "$TARGET"
  elif [[ -d "$DG_ROOT/data/d-nerf-extract/data/jumpingjacks" ]]; then
    mv "$DG_ROOT/data/d-nerf-extract/data/jumpingjacks" "$TARGET"
  else
    echo "Could not find jumpingjacks/ in zip — inspect $DG_ROOT/data/d-nerf-extract"
    exit 1
  fi
}

rm -f "$DATA_ZIP"
echo "Done: $TARGET"
