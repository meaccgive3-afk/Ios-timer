/**
 * جسر موحّد بين واجهة الويب والطبقة الأصلية.
 *
 * - أندرويد: يستدعي إضافة Capacitor باسم `LiveTimer` التي تشغّل خدمة أمامية
 *   بإشعار فيه عدّاد حيّ (يظهر في شريط الحالة، شاشة القفل، وكبسولة النشاط الحيّ
 *   في HyperOS / Realme UI / MagicOS، والشريط الحيّ في أندرويد 16).
 * - iOS: يستدعي نفس الإضافة المكتوبة بـ Swift + ActivityKit فيظهر العدّاد في
 *   الجزيرة الديناميكية وشاشة القفل.
 * - الويب: لا شيء — تُتجاهل النداءات بهدوء.
 *
 * مهم: نستخدم `registerPlugin` من `@capacitor/core` (استيراد ثابت) بدل قراءة
 * `Capacitor.Plugins.LiveTimer` أو `import()` الديناميكي. الإضافات المكتوبة
 * داخل مشروع أندرويد لا تُسجَّل في `capacitor.plugins.json`، لذلك كان الوصول
 * إليها عبر `Capacitor.Plugins` يعطي `undefined` دائماً. والاستيراد الثابت يمنع
 * أيضاً تحميل حِزم JS منفصلة داخل WebView وهو سبب شائع لانهيار الصفحة.
 */

import { Capacitor, registerPlugin } from "@capacitor/core"

export type TimerState = "idle" | "running" | "paused" | "done"

type PluginListenerHandle = { remove: () => Promise<void> }

type LiveTimerPlugin = {
  start(options: { endAt: number; totalMs: number; label: string }): Promise<void>
  pause(): Promise<void>
  resume(): Promise<void>
  stop(): Promise<void>
  isSupported(): Promise<{ supported: boolean }>
  addListener(
    event: "timerState",
    handler: (data: { state: TimerState; remainingMs: number }) => void,
  ): Promise<PluginListenerHandle>
  requestPermissions(): Promise<{ notifications: string }>
  checkPermissions(): Promise<{ notifications: string }>
}

const LiveTimer = registerPlugin<LiveTimerPlugin>("LiveTimer")

export function isNative(): boolean {
  try {
    return Capacitor.isNativePlatform()
  } catch {
    return false
  }
}

export function nativePlatform(): string {
  try {
    return Capacitor.getPlatform()
  } catch {
    return "web"
  }
}

/** يعيد الإضافة على الأجهزة الأصلية فقط، وإلا `null` حتى لا نستدعي شيئاً على الويب. */
function plugin(): LiveTimerPlugin | null {
  return isNative() ? LiveTimer : null
}

/** يطلب صلاحية الإشعارات (أندرويد ١٣+ و iOS) عند أول تشغيل. */
export async function ensureNotificationPermission(): Promise<boolean> {
  const p = plugin()
  if (!p) return false
  try {
    const current = await p.checkPermissions()
    if (current?.notifications === "granted") return true
    const asked = await p.requestPermissions()
    return asked?.notifications === "granted"
  } catch (error) {
    console.log("[v0] notification permission failed:", error)
    return false
  }
}

export async function startLiveTimer(endAt: number, totalMs: number, label = "المؤقت") {
  const p = plugin()
  if (!p) return
  try {
    await p.start({ endAt, totalMs, label })
  } catch (error) {
    console.log("[v0] startLiveTimer failed:", error)
  }
}

export async function pauseLiveTimer() {
  try {
    await plugin()?.pause()
  } catch (error) {
    console.log("[v0] pauseLiveTimer failed:", error)
  }
}

export async function resumeLiveTimer() {
  try {
    await plugin()?.resume()
  } catch (error) {
    console.log("[v0] resumeLiveTimer failed:", error)
  }
}

export async function stopLiveTimer() {
  try {
    await plugin()?.stop()
  } catch (error) {
    console.log("[v0] stopLiveTimer failed:", error)
  }
}

/** يستمع لأزرار الإشعار / الجزيرة الديناميكية ويعيد دالة لإلغاء الاستماع. */
export function onNativeTimerState(
  handler: (data: { state: TimerState; remainingMs: number }) => void,
): () => void {
  const p = plugin()
  if (!p) return () => {}

  let remove: (() => Promise<void>) | null = null
  let cancelled = false

  try {
    p.addListener("timerState", handler)
      .then((handle) => {
        if (cancelled) {
          void handle.remove()
          return
        }
        remove = handle.remove
      })
      .catch((error) => console.log("[v0] listener failed:", error))
  } catch (error) {
    console.log("[v0] listener failed:", error)
  }

  return () => {
    cancelled = true
    if (remove) void remove()
  }
}
