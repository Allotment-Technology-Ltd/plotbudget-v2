#!/usr/bin/env bash
# Start the Android emulator and wait until ADB reports it as "device" (ready).
# Usage: from apps/native run: pnpm android:emulator
# Set ANDROID_AVD to use a specific AVD; otherwise uses first available (or PlotDev if present).
# Requires ANDROID_HOME (see apps/native/docs/ANDROID_EMULATOR.md).

set -e
TIMEOUT=120
INTERVAL=5

# Prefer ANDROID_HOME from env; fallback to default macOS SDK path
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
ADB="$ANDROID_HOME/platform-tools/adb"
EMULATOR="$ANDROID_HOME/emulator/emulator"
AVDMANAGER="$ANDROID_HOME/cmdline-tools/latest/bin/avdmanager"

if [[ ! -x "$ADB" ]]; then
  echo "Error: adb not found at $ADB. Set ANDROID_HOME or install Android SDK."
  exit 1
fi
if [[ ! -x "$EMULATOR" ]]; then
  echo "Error: emulator not found at $EMULATOR. Set ANDROID_HOME."
  exit 1
fi

# Resolve AVD: explicit ANDROID_AVD, or first available (prefer PlotDev if it exists)
if [[ -n "$ANDROID_AVD" ]]; then
  AVD="$ANDROID_AVD"
else
  # Prefer PlotDev (created by android:create-avd); else first AVD in list
  if "$AVDMANAGER" list avd 2>/dev/null | grep -q "Name: PlotDev"; then
    AVD="PlotDev"
  else
    AVD=$("$AVDMANAGER" list avd 2>/dev/null | awk -F': ' '/Name:/ {print $2; exit}' | sed 's/^ *//')
  fi
  if [[ -z "$AVD" ]]; then
    echo "Error: No AVD found. Create one with:  pnpm android:create-avd"
    exit 1
  fi
fi
echo "Using AVD: $AVD"

echo "Resetting ADB..."
"$ADB" kill-server 2>/dev/null || true
"$ADB" start-server

echo "Starting emulator: $AVD"
LOG_FILE="/tmp/emulator-$(echo "$AVD" | tr ' ' '_').log"
nohup "$EMULATOR" -avd "$AVD" > "$LOG_FILE" 2>&1 &
EMU_PID=$!
disown $EMU_PID 2>/dev/null || true

echo "Waiting for device (timeout ${TIMEOUT}s)..."
elapsed=0
while [[ $elapsed -lt $TIMEOUT ]]; do
  if "$ADB" devices | grep -q "emulator-.*device$"; then
    echo ""
    echo "Emulator is ready. In another terminal run:"
    echo "  cd $(dirname "$0")/.. && pnpm android"
    echo "Then press 'a' if Metro is already running."
    exit 0
  fi
  sleep "$INTERVAL"
  elapsed=$((elapsed + INTERVAL))
  printf "."
done

echo ""
echo "Timeout: emulator did not become ready. Check $LOG_FILE"
echo "Try: close the emulator, then run: emulator -avd $AVD -wipe-data"
echo "Or start the AVD from Android Studio (Device Manager) for a more reliable boot."
exit 1
