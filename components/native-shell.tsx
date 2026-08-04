"use client"

import { useEffect } from "react"

/**
 * يهيّئ السلوك الأصلي للتطبيق (APK) عبر Capacitor:
 * شريط الحالة الداكن + إخفاء شاشة البداية + منع إطفاء الشاشة أثناء العد.
 * لا يؤثر على تشغيل الموقع في المتصفح.
 */
export function NativeShell() {
  useEffect(() => {
    let cancelled = false

    async function setupNative() {
      const cap = (globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
      if (!cap?.isNativePlatform?.()) return

      try {
        const [{ StatusBar, Style }, { SplashScreen }] = await Promise.all([
          import("@capacitor/status-bar"),
          import("@capacitor/splash-screen"),
        ])
        if (cancelled) return

        await StatusBar.setStyle({ style: Style.Dark })
        await StatusBar.setBackgroundColor({ color: "#000000" })
        await SplashScreen.hide()
      } catch (error) {
        console.log("[v0] native setup skipped:", error)
      }
    }

    setupNative()
    return () => {
      cancelled = true
    }
  }, [])

  return null
}
