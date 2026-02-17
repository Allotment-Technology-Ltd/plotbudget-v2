#!/usr/bin/env bash
# Launch Android Studio with PATH set so Gradle can find `node`.
# Use this when opening the android/ project so the build doesn't fail with
# "Cannot run program 'node': error=2, No such file or directory".
# Usage: from apps/native run  pnpm android:studio
# Then in Android Studio: File → Open → android  (or the full path to apps/native/android)

set -e
NODE_DIR="$(dirname "$(command -v node 2>/dev/null || true)")"
if [[ -z "$NODE_DIR" ]]; then
  echo "Error: node not found in PATH. Install Node or run this from a shell where node is available (e.g. after nvm use)."
  exit 1
fi
export PATH="$NODE_DIR:$PATH"
# Run the IDE binary so it inherits PATH (open -a often doesn't pass env to the app)
STUDIO_APP="/Applications/Android Studio.app/Contents/MacOS/studio"
if [[ -x "$STUDIO_APP" ]]; then
  echo "Launching Android Studio (PATH includes node from $NODE_DIR)"
  exec "$STUDIO_APP" "$@"
else
  echo "Android Studio binary not at $STUDIO_APP"
  echo "Run from terminal with node on PATH, then open the project:"
  echo "  export PATH=\"$NODE_DIR:\$PATH\""
  echo "  open -a \"Android Studio\""
  exit 1
fi
