"use client"

type Props = {
  remainingMs: number
  totalMs: number
  /** هل هناك ساعات في المدة المختارة */
  showHours: boolean
  statusLabel: string
  endsAt: string | null
}

const pad = (n: number) => String(n).padStart(2, "0")

/**
 * لوحة يمين الشاشة — نفس مكان تقويم StandBy، لكنها تعرض
 * المتبقي بالساعات والدقائق والثواني.
 */
export function RemainingPanel({ remainingMs, totalMs, showHours, statusLabel, endsAt }: Props) {
  const total = Math.max(0, Math.ceil(remainingMs / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60

  const units: { key: string; label: string; value: number; live: boolean }[] = [
    ...(showHours ? [{ key: "h", label: "ساعة", value: h, live: false }] : []),
    { key: "m", label: "دقيقة", value: m, live: false },
    { key: "s", label: "ثانية", value: s, live: true },
  ]

  const totalSec = Math.max(0, Math.round(totalMs / 1000))
  const th = Math.floor(totalSec / 3600)
  const tm = Math.floor((totalSec % 3600) / 60)
  const ts = totalSec % 60

  return (
    <section className="flex w-full flex-col gap-5" aria-label="الوقت المتبقي">
      <h2 className="text-xl font-semibold tracking-tight text-alert">المتبقي</h2>

      <div className="flex items-start gap-6" dir="ltr">
        {units.map((u) => (
          <div key={u.key} className="flex flex-col items-center gap-2">
            <span className="text-sm font-medium text-foreground">{u.label}</span>
            <span
              className={`flex h-14 w-14 items-center justify-center rounded-full font-mono text-3xl font-medium tabular-nums ${
                u.live ? "bg-alert text-foreground" : "text-foreground"
              }`}
            >
              {pad(u.value)}
            </span>
          </div>
        ))}
      </div>

      <dl className="flex flex-col gap-2 border-t border-foreground/10 pt-4 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted">الحالة</dt>
          <dd className="text-foreground">{statusLabel}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted">المدة</dt>
          <dd className="font-mono tabular-nums text-foreground" dir="ltr">
            {th > 0 ? `${pad(th)}:${pad(tm)}:${pad(ts)}` : `${pad(tm)}:${pad(ts)}`}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted">ينتهي</dt>
          <dd className="font-mono tabular-nums text-foreground" dir="ltr">
            {endsAt ?? "—"}
          </dd>
        </div>
      </dl>
    </section>
  )
}
