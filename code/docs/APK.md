# Building the Stackline Floor APK

The floor-management app (`/floor-app`) ships as an **installable PWA** out of the box —
on Android Chrome or iOS Safari, open the published site at `/floor-app` and choose
**Add to Home Screen**. It installs with its own icon, runs fullscreen (standalone),
and queues floor operations offline.

For a **distributable APK** (native wrapper), the project already includes
`capacitor.config.ts`. APK compilation requires the Android SDK, which runs on your
machine (not in the cloud sandbox). Steps:

## Prerequisites
- Node.js 20+
- Android Studio (SDK + build tools) — https://developer.android.com/studio
- JDK 17

## Build

```bash
# 1. Export/download this project (or clone your copy)
npm install

# 2. Add Capacitor (kept out of package.json to keep cloud builds lean)
npm install @capacitor/core @capacitor/android
npm install -D @capacitor/cli

# 3. Build the web bundle
npm run build          # outputs dist/public

# 4. Point the app at your published backend
#    Edit capacitor.config.ts → server.url = "https://<your-app>.ok.kimi.link"

# 5. Create the Android project and bundle the web assets
npx cap add android
npx cap sync android

# 6. Build the APK
npx cap open android   # then: Build → Build APK(s)
# or headless:
cd android && ./gradlew assembleDebug   # → android/app/build/outputs/apk/debug/app-debug.apk
```

For a release APK/AAB, sign via Android Studio (Build → Generate Signed Bundle/APK).

## iOS
`npx cap add ios && npx cap sync ios` then build in Xcode (requires macOS).

## Optional upgrades
- `@capacitor-mlkit/barcode-scanning` — hardware-grade barcode/QR scanning
- `@capacitor-community/nfc` — native NFC tag reads
- `@capacitor/haptics`, `@capacitor/push-notifications` — floor feedback + alerts
