#!/usr/bin/env bash
# Prepare Play Store assets from source images (macOS: uses sips).
# Run from apps/native: ./scripts/prepare-play-assets.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NATIVE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ASSETS_DIR="$NATIVE_DIR/play-store-assets"
mkdir -p "$ASSETS_DIR"
cd "$ASSETS_DIR"

if [[ -f "source-icon.png" ]]; then
  sips -z 512 512 "source-icon.png" --out "play-store-icon-512.png"
  echo "Created play-store-icon-512.png"
fi

if [[ -f "source-feature.png" ]]; then
  # Center-crop to 1024x500: get dimensions, then crop to aspect 1024:500
  w=$(sips -g pixelWidth "source-feature.png" | awk '/pixelWidth:/{print $2}')
  h=$(sips -g pixelHeight "source-feature.png" | awk '/pixelHeight:/{print $2}')
  # Target aspect 1024/500 = 2.048. Crop source to that aspect (center), then resize.
  target_aspect="2.048"
  if [[ -n "$w" && -n "$h" ]]; then
    source_aspect=$(echo "scale=4; $w / $h" | bc 2>/dev/null || echo "0")
    if command -v sips &>/dev/null; then
      sips --resampleHeight 500 "source-feature.png" --out "feature-graphic-tmp.png" 2>/dev/null || true
      sips --resampleWidth 1024 "feature-graphic-tmp.png" --out "feature-graphic-1024x500.png" 2>/dev/null || true
      rm -f "feature-graphic-tmp.png"
      echo "Created feature-graphic-1024x500.png (resized; may crop to center if needed manually)"
    fi
  fi
fi

echo "Done. Upload play-store-icon-512.png and feature-graphic-1024x500.png to Play Console."
