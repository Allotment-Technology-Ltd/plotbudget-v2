# Android emulator – reliable workflow

Use a **single, known-good AVD** so the emulator doesn’t block you. PlayScreenshots (and some other profiles) can stay “offline”; this workflow avoids them.

## 1. One-time: create a dev AVD (“PlotDev”)

From `apps/native` run:

```bash
pnpm android:create-avd
```

This creates an AVD named **PlotDev** using a Pixel 5 device profile and your installed system image (e.g. Android 36.1 with Play Store). You only need to do this once. If you already have a working AVD you prefer, skip to step 2 and set `ANDROID_AVD` to that name.

**One-time: install Expo Go on the emulator**

- **Recommended (no keyboard needed):** Open [expo.dev/go](https://expo.dev/go) in your browser → leave SDK 54 selected → under Android click **“Android Emulator” → “Install”** and save the APK. With the emulator running, run: `adb install ~/Downloads/expo-go-*.apk` (or the path where the APK was saved). Then `pnpm android` can open your project in Expo Go.
- **Alternative:** On the emulator, open Play Store, sign in, search for **Expo Go**, and install. (If the emulator keyboard doesn’t work, use the ADB install method above.)

## 2. Start the emulator

**Terminal 1:**

```bash
cd apps/native
pnpm android:emulator
```

The script will use **PlotDev** if it exists, otherwise the first AVD in your list (and will skip relying on PlayScreenshots). When you see “Emulator is ready”, leave that terminal open.

**Terminal 2 – connect emulator to Metro (so Expo Go can load the app):**

```bash
cd apps/native
pnpm android:reverse
```

This runs `adb reverse tcp:8081 tcp:8081` so the emulator can reach your dev server. You only need to run it once per emulator boot (or if you see connection errors in Expo Go).

**Terminal 3 – run the app:**

```bash
cd apps/native
pnpm android
```

Then press **a** to open on Android. Expo will launch Expo Go on the emulator with your project. After code changes, reload with **r** in the Metro terminal; no need to restart the emulator.

**Two terminals only:** In terminal 2 run `pnpm android:reverse` then `pnpm android` (then press **a**). Port reverse only needs to be run once per emulator session.

## Choosing an AVD

- **Default:** If **PlotDev** exists, `pnpm android:emulator` uses it. Otherwise it uses the first AVD from `avdmanager list avd`.
- **Override:** To force a specific AVD:

  ```bash
  ANDROID_AVD=Medium_Phone_API_36.1 pnpm android:emulator
  ```

  To make it permanent, add to `~/.zshrc`:

  ```bash
  export ANDROID_AVD=PlotDev
  ```

- **List AVDs:**

  ```bash
  $ANDROID_HOME/cmdline-tools/latest/bin/avdmanager list avd
  ```

## If the emulator stays “offline”

1. Quit the emulator completely.
2. Reset ADB and wipe that AVD (factory reset for the emulator):

   ```bash
   adb kill-server
   adb start-server
   emulator -avd PlotDev -wipe-data
   ```

   Wait 1–2 minutes for the home screen.

3. Run `adb devices` in another terminal; you want **device**, not **offline**.
4. If it’s still offline, create a fresh AVD and use that:

   ```bash
   pnpm android:create-avd
   # then
   pnpm android:emulator
   ```

## Gradle: “Cannot run program 'node'”

If Android Studio was opened from the Dock/Spotlight, Gradle may not see `node`. Fix it by starting Android Studio from a terminal so it inherits your PATH:

```bash
cd apps/native
pnpm android:studio
```

Then **File → Open** → `android`. If you don’t use the script, in a terminal run `export PATH="$(dirname $(which node)):$PATH"` and then open Android Studio from that same terminal (e.g. `open -a "Android Studio"`).

## Updating ADB (if issues persist)

```bash
$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager "platform-tools"
adb kill-server
adb start-server
```

## Environment

- **ANDROID_HOME** – must point to your Android SDK (e.g. `~/Library/Android/sdk`). Set in `~/.zshrc` if needed.
- **JAVA_HOME** – required only for creating AVDs (`pnpm android:create-avd`), e.g. Android Studio’s JDK. Not needed for `pnpm android:emulator` or `pnpm android`.

## Run the app from Android Studio

You can build and run the app from Android Studio instead of using Expo Go. The app still loads the JavaScript bundle from Metro, so Metro must be running.

### One-time: generate the Android project

From `apps/native`:

```bash
pnpm android:prebuild
```

This creates (or regenerates) the `android/` folder. You only need to run it again if you change native config (e.g. `app.json` plugins, permissions).

### Every time you want to run from Android Studio

1. **Start Metro** (in a terminal, keep it running):
   ```bash
   cd apps/native
   pnpm start
   ```
   Leave this running so the app can load the JS bundle.

2. **Open the project in Android Studio** (Gradle needs `node` on PATH)
   - **Important:** Start Android Studio from a terminal so it can find `node`, otherwise Gradle fails with “Cannot run program 'node'”:
     ```bash
     cd apps/native
     pnpm android:studio
     ```
     Or manually: `export PATH="$(dirname $(which node)):$PATH"` then open Android Studio from that same terminal (e.g. `open -a "Android Studio"` or run the app’s binary if you have it).
   - In Android Studio: **File → Open** → select the **`android`** folder:  
     `…/plotbudget/apps/native/android`
   - Click **Open**. Let Android Studio sync Gradle (first time can take a few minutes).

3. **Start the emulator**
   - In Android Studio: **Tools → Device Manager** (or the device dropdown in the toolbar).
   - Click **Run** (▶) next to an AVD (e.g. PlotDev or any phone).
   - Wait until the emulator is fully booted (home screen visible).
   - (Optional) In a terminal run `pnpm android:reverse` so the emulator can reach Metro. If the app shows a “could not connect” error, run this and reload.

4. **Run the app**
   - In Android Studio, click the green **Run** (▶) in the toolbar, or **Run → Run 'app'**.
   - The app will build, install on the emulator, and launch. It will connect to Metro from step 1 for the bundle.

5. **After code changes**
   - JS/React changes: save the file; the app will reload (or press **R** in the emulator / shake for dev menu and Reload).
   - Native/Android changes: run **Run** again in Android Studio.

**Note:** The `android/` folder is generated and gitignored. Don’t edit it by hand for config; change `app.json` (and plugins) and run `pnpm android:prebuild` again if needed.

---

## Play Store screenshots

Use **PlotDev** (or any working AVD) for daily dev. For Play Store screenshots, capture from the same emulator once it’s running; resolution is fine for store requirements. You can create a separate AVD later (e.g. custom 1080×1920) for screenshots only if you want.
