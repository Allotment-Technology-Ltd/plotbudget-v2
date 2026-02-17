# Google Play Store assets for PLOT

Use this folder to prepare and store assets for the Play Console store listing.

## Required assets (upload in Play Console → Store presence → Main store listing)

| Asset | Dimensions | Format | Notes |
|-------|------------|--------|--------|
| **App icon** | 512 × 512 px | 32-bit PNG | Full square; Play applies 30% corner radius. No transparency. Max 1024 KB. |
| **Feature graphic** | 1024 × 500 px | JPEG or 24-bit PNG | Banner at top of listing. No alpha. Keep important content in center 70%. |
| **Phone screenshots** | Min 2, max 8 | JPEG or 24-bit PNG | 9:16 or 16:9, e.g. 1080×1920. Min 320px short side, max 3840px long. |
| **Tablet screenshots** (optional) | Min 4 if supporting tablet | Same | Short edge ≥ 1080px. |

## Files in this folder

- **`play-store-icon-512.png`** – App icon at 512×512 for Play Console.
- **`feature-graphic-1024x500.png`** – Feature graphic at 1024×500.
- **`source-icon.png`** / **`source-feature.png`** – Optional: place your high-res sources here and run the script to regenerate the above.

## Resize script (macOS)

If you have source images (e.g. 1024×1024 icon, 1920×1080 feature art), place them as:

- `source-icon.png` → produces `play-store-icon-512.png`
- `source-feature.png` → produces `feature-graphic-1024x500.png` (resized and center-cropped to 1024×500)

Then run:

```bash
./scripts/prepare-play-assets.sh
```

## Screenshots

Capture from a device or emulator (release or debug build). Recommended: 2–4 phone screens (Dashboard, budget view, income, settings). Use 9:16 portrait; 1080×1920 is a common size. Save as JPEG or PNG (no alpha) and upload in Play Console under the same store listing.

## App icon vs adaptive icon (in-app)

The **app** already uses `assets/images/icon.png` and `assets/images/adaptive-icon.png` (referenced in `app.json`). Those are used by the built APK/AAB. The **Play Console** requires a separate **512×512** icon for the store listing; use `play-store-icon-512.png` from this folder.
