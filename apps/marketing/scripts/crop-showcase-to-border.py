#!/usr/bin/env python3
"""
Crop showcase PNGs so the edge is at the white border of the component,
removing the black/dark background outside. Uses the bbox of bright (white)
pixels so we crop "inside" the white border.

Requires: pip install Pillow

Usage (from repo root or apps/marketing):
  python apps/marketing/scripts/crop-showcase-to-border.py
  # or
  cd apps/marketing && python scripts/crop-showcase-to-border.py
"""

from pathlib import Path
from typing import Optional, Tuple

try:
    from PIL import Image
except ImportError:
    raise SystemExit("Install Pillow first: pip install Pillow")

# Directory of showcase images (relative to this script)
SCRIPT_DIR = Path(__file__).resolve().parent
SHOWCASE_DIR = SCRIPT_DIR.parent / "public" / "showcase"

# Crop to white border: pixels at least this bright define the component edge.
# Lower (e.g. 180) includes more; higher (e.g. 240) crops tighter to bright border only.
WHITE_BORDER_THRESHOLD = 200
# Pixels to shrink inward from the white-border bbox (0 = edge at border; 1 = just inside).
PADDING_INSIDE = 0


def get_white_border_bbox(image: Image.Image) -> Optional[Tuple[int, int, int, int]]:
    """Return (left, top, right, bottom) of pixels at least WHITE_BORDER_THRESHOLD bright."""
    if image.mode != "RGB":
        image = image.convert("RGB")
    width, height = image.size
    pixels = image.load()

    min_x, min_y = width, height
    max_x, max_y = -1, -1

    for y in range(height):
        for x in range(width):
            r, g, b = pixels[x, y][:3]
            if max(r, g, b) >= WHITE_BORDER_THRESHOLD:
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)

    if max_x < 0:
        return None
    return (min_x, min_y, max_x + 1, max_y + 1)


def crop_to_border(path: Path) -> bool:
    """Crop image to white-border bbox (trim black outside component). Returns True if cropped."""
    img = Image.open(path)
    img.load()
    if path.suffix.lower() == ".png" and img.mode in ("RGBA", "LA"):
        img = img.convert("RGBA")
    bbox = get_white_border_bbox(img.convert("RGB") if img.mode == "RGBA" else img)
    if not bbox:
        return False
    left, top, right, bottom = bbox
    width, height = img.size
    # Optionally shrink inward so we're just inside the white border
    left = min(left + PADDING_INSIDE, width - 1)
    top = min(top + PADDING_INSIDE, height - 1)
    right = max(right - PADDING_INSIDE, left + 1)
    bottom = max(bottom - PADDING_INSIDE, top + 1)
    if (left, top, right, bottom) == (0, 0, width, height):
        return False
    cropped = img.crop((left, top, right, bottom))
    cropped.save(path, "PNG", optimize=True)
    return True


def main() -> None:
    if not SHOWCASE_DIR.is_dir():
        raise SystemExit(f"Showcase dir not found: {SHOWCASE_DIR}")

    for path in sorted(SHOWCASE_DIR.glob("*.png")):
        try:
            if crop_to_border(path):
                print(f"Cropped: {path.name}")
            else:
                print(f"Unchanged (no trim): {path.name}")
        except Exception as e:
            print(f"Error {path.name}: {e}")


if __name__ == "__main__":
    main()
