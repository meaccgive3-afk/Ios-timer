import type { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "com.iostimer.app",
  appName: "المؤقت",
  webDir: "out",
  // يسمح بفتح chrome://inspect لرؤية أخطاء الواجهة داخل التطبيق مباشرة
  webContentsDebuggingEnabled: true,
  android: {
    allowMixedContent: false,
    backgroundColor: "#000000",
    // نثبّت المخطط والمضيف حتى تتطابق مسارات /_next المطلقة مع السيرفر المحلي
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      backgroundColor: "#000000",
      showSpinner: false,
      launchAutoHide: true,
      launchShowDuration: 500,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#000000",
    },
  },
}

export default config
