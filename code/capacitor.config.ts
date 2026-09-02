import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor scaffold — wraps the Stackline web build as a native
 * Android/iOS app. See docs/APK.md for the full build procedure.
 *
 * The web build (dist/public) is bundled into the native shell;
 * API calls go to the deployed server URL below (server.url) so the
 * same backend + database serve the app. Publish the site first and
 * set server.url to the public URL (e.g. https://your-app.ok.kimi.link).
 */
const config: CapacitorConfig = {
  appId: "com.stackline.floor",
  appName: "Stackline Floor",
  webDir: "dist/public",
  server: {
    // Set to your published URL before `npx cap sync`.
    // url: "https://your-app.ok.kimi.link",
    androidScheme: "https",
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    // Camera/QR work over getUserMedia in the WebView (Android 5+).
    // For hardware-grade scanning add @capacitor-mlkit/barcode-scanning.
  },
};

export default config;
