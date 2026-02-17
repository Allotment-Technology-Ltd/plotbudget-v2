#!/usr/bin/env bash
# Forward Metro port (8081) from the emulator to your machine so Expo Go can load the app.
# Run this from a second terminal when the emulator is already running and Metro is (or will be) in another.
# Then press 'a' in the Metro terminal, or in Expo Go on the emulator enter exp://localhost:8081

set -e
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
ADB="$ANDROID_HOME/platform-tools/adb"

if ! "$ADB" devices | grep -q "emulator-.*device$"; then
  echo "No emulator in 'device' state. Start it with: pnpm android:emulator"
  exit 1
fi

echo "Forwarding port 8081 (Metro) to emulator..."
"$ADB" reverse tcp:8081 tcp:8081
echo "Done. In the Metro terminal press 'a', or in Expo Go enter: exp://localhost:8081"
