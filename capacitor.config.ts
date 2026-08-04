import type { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "com.iostimer.app",
  appName: "المؤقت",
  webDir: "out",
  android: {
    allowMixedContent: false,
    backgroundColor: "#000000",
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
