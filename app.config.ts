import type { ExpoConfig } from "expo/config";
const appVariant = process.env.APP_VARIANT ?? "development";
if (appVariant === "production") {
  for (const name of [
    "EXPO_PUBLIC_API_URL",
    "EXPO_PUBLIC_PRIVACY_URL",
    "EXPO_PUBLIC_TERMS_URL",
  ])
    if (!process.env[name]?.startsWith("https://"))
      throw new Error(`${name} must be an HTTPS URL for production.`);
  if (!process.env.EAS_PROJECT_ID)
    throw new Error("Set EAS_PROJECT_ID after running eas init.");
}
const config: ExpoConfig = {
  name: appVariant === "development" ? "Movo Dev" : "Movo",
  slug: "movo",
  scheme: "movo",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "light",
  icon: "./assets/icon.png",
  ios: {
    supportsTablet: false,
    bundleIdentifier: process.env.IOS_BUNDLE_IDENTIFIER ?? "com.movo.app",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSMotionUsageDescription:
        "Movo optionally measures your steps during a walk or run.",
    },
  },
  android: {
    package: process.env.ANDROID_APPLICATION_ID ?? "com.movo.app",
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#155C45",
    },
    blockedPermissions: [
      "android.permission.RECORD_AUDIO",
      "android.permission.CAMERA",
      "android.permission.READ_CONTACTS",
      "android.permission.WRITE_CONTACTS",
      "android.permission.READ_EXTERNAL_STORAGE",
      "android.permission.WRITE_EXTERNAL_STORAGE",
      "android.permission.READ_MEDIA_IMAGES",
      "android.permission.READ_MEDIA_VIDEO",
    ],
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-sqlite",
    [
      "expo-sensors",
      {
        motionPermission:
          "Movo optionally measures your steps during a walk or run.",
      },
    ],
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "Movo uses your location while you walk or run to measure distance and verify your activity.",
        locationAlwaysAndWhenInUsePermission:
          "Movo continues recording an activity you started when your screen is locked or you switch apps. Recording stops when you pause or finish.",
        isAndroidBackgroundLocationEnabled: true,
        isAndroidForegroundServiceEnabled: true,
        isIosBackgroundLocationEnabled: true,
      },
    ],
    ["expo-notifications", { defaultChannel: "helpful-reminders" }],
    [
      "expo-splash-screen",
      {
        backgroundColor: "#155C45",
        image: "./assets/splash.png",
        imageWidth: 190,
      },
    ],
  ],
  experiments: { typedRoutes: true },
  extra: process.env.EAS_PROJECT_ID
    ? { eas: { projectId: process.env.EAS_PROJECT_ID } }
    : {},
};
export default config;
