# Marketing site — App showcase video

The "The App" section on the marketing site can show **looping videos** of the real app in each phone frame (light and dark mode). If the video files are missing, it falls back to a static preview.

**Options:**

| Approach | Best for |
|----------|----------|
| **Manual recording** | Easiest: record the app yourself and drop files in. Supports `.webm` or `.mp4`. |
| **Playwright** | Fully automated: E2E run records dashboard in light/dark, then a script copies the videos. |

---

## Option 1: Record the videos yourself (simplest)

1. **Record the app** (one video per theme):
   - **Light:** App in **light mode**, go to Dashboard (optionally scroll or open Blueprint). Record **10–20 seconds**.
   - **Dark:** Switch to **dark mode**, same flow. Record **10–20 seconds**.

2. **Export** (QuickTime, OBS, or browser screen record):
   - Rough size: **~390×780** (or similar 9:19 phone ratio). You can record larger and crop.
   - Keep file size reasonable (e.g. < 2 MB per video).
   - **Format:** `.webm` or `.mp4` — both work. No conversion needed if your tool outputs MP4.

3. **Drop the files** into `apps/marketing/public/videos/`:
   - `dashboard-light.webm` or `dashboard-light.mp4`
   - `dashboard-dark.webm` or `dashboard-dark.mp4`

4. **Deploy.** The showcase uses whichever format you added (webm preferred if both exist). If a file is missing, the static preview is shown.

---

## Option 2: Playwright (automated)

Use the E2E setup to record the dashboard in light and dark theme, then copy the videos.

1. From repo root: `pnpm install`
2. Run the showcase recording (from `apps/web`):
   ```bash
   pnpm exec playwright test tests/specs/showcase-video.spec.ts --project=showcase-video --workers=1
   ```
   `--workers=1` keeps order: first video = light, second = dark.
3. Copy the videos:
   ```bash
   pnpm run copy-showcase-videos
   ```
   This writes `dashboard-light.webm` and `dashboard-dark.webm` to `apps/marketing/public/videos/`.
4. Run or deploy the marketing site.

---

## Recording tips

- **macOS:** QuickTime Player → File → New Screen Recording. Record the browser window with the app. Crop to phone aspect if needed.
- **Chrome DevTools:** Toggle device toolbar (phone size), then use system or extension screen record.
- **OBS / similar:** Capture the browser; crop in post or set canvas to 280×560.

Videos are **muted** so they can autoplay; no need to add audio.
