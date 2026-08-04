/**
 * جسر موحّد بين واجهة الويب والطبقة الأصلية.
 *
 * - أندرويد: يستدعي إضافة Capacitor باسم `LiveTimer` التي تشغّل خدمة أمامية
 *   بإشعار فيه عدّاد حيّ (يظهر في شريط الحالة، شاشة القفل، وكبسولة النشاط الحيّ
 *   في HyperOS / Realme UI / MagicOS، والشريط الحيّ في أندرويد 16).
 * - iOS: يستدعي نفس الإضافة المكتوبة بـ Swift + ActivityKit فيظهر العدّاد في
 *   الجزيرة الديناميكية وشاشة القفل.
 * - الويب: لا شيء — تُتجاهل النداءات بهدوء.
 */

export type TimerState = "idle" | "running" | "paused" | "done"

type LiveTimerPlugin = {
  start(options: { endAt: number; totalMs: number; label: string }): Promise<void>
  pause(): Promise<void>
  resume(): Promise<void>
  stop(): Promise<void>
  isSupported(): Promise<{ supported: boolean }>
  addListener(
    event: "timerState",
    handler: (data: { state: TimerState; remainingMs: number }) => void,
  ): Promise<{ remove: () => Promise<void> }>
  requestPermissions?(): Promise<{ notifications: string }>
  checkPermissions?(): Promise<{ notifications: string }>
}

type CapacitorGlobal = {
  isNativePlatform?: () => boolean
  getPlatform?: () => string
  Plugins?: Record<string, unknown>
}

function capacitor(): CapacitorGlobal | undefined {
  return (globalThis as { Capacitor?: CapacitorGlobal }).Capacitor
}

export function isNative(): boolean {
  return capacitor()?.isNativePlatform?.() === true
}

export function nativePlatform(): string {
  return capacitor()?.getPlatform?.() ?? "web"
}

function plugin(): LiveTimerPlugin | null {
  const cap = capacitor()
  if (!cap?.isNativePlatform?.()) return null
  const found = cap.Plugins?.LiveTimer
  return (found as LiveTimerPlugin | undefined) ?? null
}

/** يطلب صلاحية الإشعارات (أندرويد ١٣+ و iOS) عند أول تشغيل. */
export async function ensureNotificationPermission(): Promise<boolean> {
  const p = plugin()
  if (!p) return false
  try {
    const current = await p.checkPermissions?.()
    if (current?.notifications === "granted") return true
    const asked = await p.requestPermissions?.()
    return asked?.notifications === "granted"
  } catch {
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

  p.addListener("timerState", handler)
    .then((handle) => {
      if (cancelled) {
        void handle.remove()
        return
      }
      remove = handle.remove
    })
    .catch((error) => console.log("[v0] listener failed:", error))

  return () => {
    cancelled = true
    if (remove) void remove()
  }
}
