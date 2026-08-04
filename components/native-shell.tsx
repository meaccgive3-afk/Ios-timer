"use client"

import { useEffect } from "react"
import { SplashScreen } from "@capacitor/splash-screen"
import { StatusBar, Style } from "@capacitor/status-bar"
import { isNative } from "@/lib/live-timer"

/**
 * يهيّئ السلوك الأصلي للتطبيق (APK) عبر Capacitor:
 * شريط الحالة الداكن + إخفاء شاشة البداية.
 * لا يؤثر على تشغيل الموقع في المتصفح.
 *
 * الاستيراد ثابت (لا `import()` ديناميكي): تحميل حِزمة JS منفصلة من داخل
 * WebView قد يفشل ويرفع خطأ يُسقط الصفحة كاملة، فنتجنّبه.
 */
export function NativeShell() {
  useEffect(() => {
    if (!isNative()) return

    // كل نداء منفصل: فشل أحدها لا يمنع الباقي ولا يصل الخطأ إلى React
    void StatusBar.setStyle({ style: Style.Dark }).catch(() => {})
    void StatusBar.setBackgroundColor({ color: "#000000" }).catch(() => {})
    void SplashScreen.hide().catch(() => {})
  }, [])

  return null
}
