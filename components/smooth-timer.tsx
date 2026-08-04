"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AnalogTimerFace } from "./analog-timer-face"
import { RemainingPanel } from "./remaining-panel"
import { WheelPicker } from "./wheel-picker"

type Phase = "idle" | "running" | "paused" | "done"

const PRESETS = [
  { label: "دقيقة", ms: 60_000 },
  { label: "٥ دقائق", ms: 5 * 60_000 },
  { label: "١٠ دقائق", ms: 10 * 60_000 },
  { label: "٢٥ دقيقة", ms: 25 * 60_000 },
  { label: "ساعة", ms: 60 * 60_000 },
]

export function SmoothTimer() {
  const [hours, setHours] = useState(1)
  const [minutes, setMinutes] = useState(0)
  const [secs, setSecs] = useState(0)

  const [phase, setPhase] = useState<Phase>("idle")
  const [totalMs, setTotalMs] = useState(3600_000)
  const [remainingMs, setRemainingMs] = useState(3600_000)

  const endAtRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const audioRef = useRef<AudioContext | null>(null)

  const pickedMs = hours * 3600_000 + minutes * 60_000 + secs * 1000

  // العرض في وضع الاختيار يتبع القيم المختارة
  useEffect(() => {
    if (phase === "idle") {
      setTotalMs(pickedMs)
      setRemainingMs(pickedMs)
    }
  }, [pickedMs, phase])

  const chime = useCallback(() => {
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = audioRef.current ?? new Ctx()
      audioRef.current = ctx
      const now = ctx.currentTime
      ;[0, 0.42, 0.84].forEach((offset) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "sine"
        osc.frequency.setValueAtTime(880, now + offset)
        gain.gain.setValueAtTime(0, now + offset)
        gain.gain.linearRampToValueAtTime(0.28, now + offset + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.34)
        osc.connect(gain).connect(ctx.destination)
        osc.start(now + offset)
        osc.stop(now + offset + 0.36)
      })
    } catch {
      /* الصوت غير متاح */
    }
  }, [])

  // حلقة العرض: تحديث كل فريم => العقارب تتحرك بسلاسة
  useEffect(() => {
    if (phase !== "running") return

    const tick = () => {
      const left = endAtRef.current - performance.now()
      if (left <= 0) {
        setRemainingMs(0)
        setPhase("done")
        chime()
        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([200, 100, 200])
        return
      }
      setRemainingMs(left)
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [phase, chime])

  const start = () => {
    if (pickedMs <= 0) return
    setTotalMs(pickedMs)
    setRemainingMs(pickedMs)
    endAtRef.current = performance.now() + pickedMs
    setPhase("running")
  }

  const resume = () => {
    endAtRef.current = performance.now() + remainingMs
    setPhase("running")
  }

  const reset = () => {
    setPhase("idle")
    setRemainingMs(pickedMs)
    setTotalMs(pickedMs)
  }

  const applyPreset = (ms: number) => {
    setHours(Math.floor(ms / 3600_000))
    setMinutes(Math.floor((ms % 3600_000) / 60_000))
    setSecs(Math.floor((ms % 60_000) / 1000))
    setPhase("idle")
  }

  const editing = phase === "idle"

  const statusLabel =
    phase === "running" ? "يعمل" : phase === "paused" ? "متوقف مؤقتاً" : "انتهى"

  const [endsAt, setEndsAt] = useState<string | null>(null)
  useEffect(() => {
    if (phase !== "running" && phase !== "paused") {
      setEndsAt(null)
      return
    }
    const d = new Date(Date.now() + remainingMs)
    setEndsAt(
      `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
    )
    // نحدّثه عند تغيّر الحالة فقط، لا كل فريم
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  return (
    <div
      dir="ltr"
      className="flex w-full flex-col items-center gap-10 md:flex-row md:items-center md:justify-center md:gap-16"
    >
      {/* الساعة */}
      <div className="shrink-0">
        <AnalogTimerFace
          totalMs={totalMs || 1}
          remainingMs={remainingMs}
          size={300}
        />
      </div>

      {/* اللوحة اليمنى: الإعداد أو المتبقي */}
      <div dir="rtl" className="flex w-full max-w-xs flex-col gap-6">
        {editing ? (
          <section className="flex flex-col gap-5" aria-label="اختيار المدة">
            <h2 className="text-xl font-semibold tracking-tight text-alert">المدة</h2>

            <div className="flex items-start justify-center gap-2" dir="ltr">
              <WheelPicker label="ساعات" count={24} value={hours} onChange={setHours} />
              <WheelPicker label="دقائق" count={60} value={minutes} onChange={setMinutes} />
              <WheelPicker label="ثواني" count={60} value={secs} onChange={setSecs} />
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => applyPreset(p.ms)}
                  className="rounded-full bg-surface px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-surface/70"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </section>
        ) : (
          <RemainingPanel
            remainingMs={remainingMs}
            totalMs={totalMs}
            showHours={totalMs >= 3600_000}
            statusLabel={statusLabel}
            endsAt={endsAt}
          />
        )}

        {/* الأزرار */}
        <div className="flex items-center justify-center gap-3">
          {phase === "running" ? (
            <button
              type="button"
              onClick={() => setPhase("paused")}
              className="h-16 w-16 rounded-full bg-surface text-sm font-semibold text-foreground transition-transform active:scale-95"
            >
              إيقاف
            </button>
          ) : phase === "paused" ? (
            <button
              type="button"
              onClick={resume}
              className="h-16 w-16 rounded-full bg-alert text-sm font-semibold text-foreground transition-transform active:scale-95"
            >
              متابعة
            </button>
          ) : phase === "idle" ? (
            <button
              type="button"
              onClick={start}
              disabled={pickedMs <= 0}
              className="h-16 w-16 rounded-full bg-alert text-sm font-semibold text-foreground transition-transform active:scale-95 disabled:opacity-40"
            >
              ابدأ
            </button>
          ) : (
            <button
              type="button"
              onClick={reset}
              className="h-16 w-16 rounded-full bg-alert text-sm font-semibold text-foreground transition-transform active:scale-95"
            >
              تم
            </button>
          )}

          {phase !== "idle" ? (
            <button
              type="button"
              onClick={reset}
              className="h-16 w-16 rounded-full bg-surface text-sm font-semibold text-muted transition-transform active:scale-95"
            >
              تصفير
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
