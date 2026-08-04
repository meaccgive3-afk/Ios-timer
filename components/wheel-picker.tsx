"use client"

import { useCallback, useEffect, useRef } from "react"

const ITEM_H = 38
const VISIBLE = 3 // عدد العناصر الظاهرة (فردي)
const PAD = ((VISIBLE - 1) / 2) * ITEM_H

type Props = {
  count: number
  value: number
  onChange: (v: number) => void
  label: string
  suffix?: string
  disabled?: boolean
}

export function WheelPicker({ count, value, onChange, label, suffix, disabled }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const settleRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const programmatic = useRef(false)

  const scrollTo = useCallback((index: number, smooth: boolean) => {
    const el = ref.current
    if (!el) return
    programmatic.current = true
    el.scrollTo({ top: index * ITEM_H, behavior: smooth ? "smooth" : "auto" })
    window.setTimeout(() => {
      programmatic.current = false
    }, smooth ? 400 : 60)
  }, [])

  // مزامنة الموضع مع القيمة الخارجية
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const current = Math.round(el.scrollTop / ITEM_H)
    if (current !== value) scrollTo(value, false)
  }, [value, scrollTo])

  const handleScroll = () => {
    if (programmatic.current) return
    if (settleRef.current) clearTimeout(settleRef.current)
    settleRef.current = setTimeout(() => {
      const el = ref.current
      if (!el) return
      const index = Math.min(count - 1, Math.max(0, Math.round(el.scrollTop / ITEM_H)))
      if (index !== value) onChange(index)
      scrollTo(index, true)
    }, 90)
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs font-medium tracking-wide text-muted">{label}</span>
      <div className="relative" style={{ height: VISIBLE * ITEM_H, width: 76 }}>
        {/* شريط التحديد */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 rounded-xl bg-surface/80"
          style={{ height: ITEM_H }}
        />
        {/* تلاشي أعلى/أسفل */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-20"
          style={{
            background:
              "linear-gradient(to bottom, var(--background) 0%, transparent 42%, transparent 58%, var(--background) 100%)",
            opacity: 0.85,
          }}
        />
        <div
          ref={ref}
          onScroll={handleScroll}
          role="listbox"
          aria-label={label}
          tabIndex={0}
          className={`wheel relative h-full overflow-y-scroll ${
            disabled ? "pointer-events-none opacity-40" : ""
          }`}
          style={{ paddingTop: PAD, paddingBottom: PAD }}
        >
          {Array.from({ length: count }, (_, i) => {
            const active = i === value
            return (
              <div
                key={i}
                role="option"
                aria-selected={active}
                className="wheel-item flex items-center justify-center"
                style={{ height: ITEM_H }}
              >
                <span
                  className={`font-mono tabular-nums transition-all duration-150 ${
                    active ? "text-2xl text-foreground" : "text-xl text-muted"
                  }`}
                >
                  {i}
                </span>
              </div>
            )
          })}
        </div>
      </div>
      {suffix ? <span className="text-[11px] text-muted">{suffix}</span> : null}
    </div>
  )
}
