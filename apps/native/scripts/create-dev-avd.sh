#!/usr/bin/env bash
# Create a single, reliable AVD for daily development ("PlotDev") so you're not
# dependent on PlayScreenshots or other flaky profiles.
# Run once: from apps/native run  pnpm android:create-avd
# Requires: ANDROID_HOME, JAVA_HOME, and a system image (see below).

set -e
AVD_NAME="${ANDROID_AVD_NAME:-PlotDev}"
DEVICE_ID="${ANDROID_AVD_DEVICE:-pixel_5}"
# Use the same image you have (android-36.1 with Play Store); override if needed
SYSTEM_IMAGE="${ANDROID_AVD_IMAGE:-system-images;android-36.1;google_apis_playstore;arm64-v8a}"

export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
AVDMANAGER="$ANDROID_HOME/cmdline-tools/latest/bin/avdmanager"
SDKMANAGER="$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager"

if [[ ! -x "$AVDMANAGER" ]]; then
  echo "Error: avdmanager not found. Set ANDROID_HOME."
  exit 1
fi

# Ensure system image is installed
echo "Checking system image: $SYSTEM_IMAGE"
if ! "$SDKMANAGER" --list_installed 2>/dev/null | grep -q "$SYSTEM_IMAGE"; then
  echo "Installing system image (one-time)..."
  "$SDKMANAGER" "$SYSTEM_IMAGE"
fi

# Create AVD (no custom hardware profile)
echo "Creating AVD: $AVD_NAME (device: $DEVICE_ID)"
"$AVDMANAGER" create avd -n "$AVD_NAME" -k "$SYSTEM_IMAGE" -d "$DEVICE_ID" --force

echo ""
echo "Done. Start it with:"
echo "  pnpm android:emulator"
echo "Or set default:  export ANDROID_AVD=$AVD_NAME"
echo "Then in another terminal:  pnpm android"
echo ""
echo "To make PlotDev the default for this project, add to your shell profile:"
echo "  export ANDROID_AVD=PlotDev"
echo ""
