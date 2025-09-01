module.exports = {
  expo: {
    name: "MVault - Secure Expense Tracker",
    slug: "mvault-pocket-tracker",
    version: "1.0.1",
    orientation: "portrait",
    icon: "./assets/images/natively-dark.png",
    userInterfaceStyle: "automatic",
    description: "100% offline personal expense tracker with PIN protection.",
    privacy: "public",
    platforms: ["ios", "android", "web"],

    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.mvault.secure",
      buildNumber: "2",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/natively-dark.png",
        backgroundColor: "#667eea"
      },
      package: "com.mvault.secure",
      versionCode: 2,
      permissions: [
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE"
      ]
    },
    web: {
      favicon: "./assets/images/natively-dark.png",
      bundler: "metro"
    },
    plugins: [
      "expo-font",
      "expo-router",
      "expo-splash-screen"
    ],
    scheme: "mvault",
    experiments: {
      typedRoutes: true
    },
    extra: {
      router: {},
      eas: {
        projectId: "9107ed07-340d-4177-8850-6f928acbc8e8"
      }
    }
  }
};