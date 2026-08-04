"use client"

type Props = {
  /** المدة الكاملة بالمللي ثانية */
  totalMs: number
  /** المتبقي بالمللي ثانية (يتغير بسلاسة كل فريم) */
  remainingMs: number
  size?: number
}

const TAU = Math.PI * 2

function polar(cx: number, cy: number, r: number, angle: number) {
  return {
    x: cx + r * Math.sin(angle),
    y: cy - r * Math.cos(angle),
  }
}

/**
 * قوس المدة المتبقية على شكل شريحة دائرية (pie slice).
 */
function arcPath(cx: number, cy: number, r: number, fraction: number) {
  const f = Math.min(Math.max(fraction, 0), 0.999999)
  if (f <= 0) return ""
  const end = f * TAU
  const start = polar(cx, cy, r, 0)
  const stop = polar(cx, cy, r, end)
  const largeArc = f > 0.5 ? 1 : 0
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${stop.x} ${stop.y} Z`
}

export function AnalogTimerFace({ totalMs, remainingMs, size = 300 }: Props) {
  const S = 300
  const c = S / 2
  const rOuter = 138
  const rDial = 122

  // الزوايا محسوبة من قيم كسرية مستمرة => حركة سلسة بدون قفزات
  const seconds = remainingMs / 1000
  const secondAngle = (seconds % 60) * 6 // 6 درجات للثانية
  const minuteAngle = ((seconds / 60) % 60) * 6
  const hourAngle = ((seconds / 3600) % 12) * 30

  const fraction = totalMs > 0 ? remainingMs / totalMs : 0
  const showHour = totalMs >= 3600 * 1000

  const ticks = Array.from({ length: 60 }, (_, i) => i)

  return (
    <svg
      viewBox={`0 0 ${S} ${S}`}
      width={size}
      height={size}
      role="img"
      aria-label="ساعة بعقارب تعرض الوقت المتبقي"
      className="select-none"
    >
      <defs>
        <radialGradient id="dial" cx="50%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#2a2a2e" />
          <stop offset="100%" stopColor="#141416" />
        </radialGradient>
        <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#000" floodOpacity="0.55" />
        </filter>
      </defs>

      {/* الجسم */}
      <circle cx={c} cy={c} r={rOuter} fill="url(#dial)" filter="url(#soft)" />
      <circle cx={c} cy={c} r={rOuter} fill="none" stroke="#3a3a3e" strokeWidth="1.5" />

      {/* شريحة الوقت المتبقي */}
      {fraction > 0 && (
        <path d={arcPath(c, c, rDial, fraction)} fill="var(--accent)" opacity="0.07" />
      )}
      {/* مسار الحلقة */}
      <circle cx={c} cy={c} r={rDial} fill="none" stroke="#3a3a3e" strokeWidth="2.5" />
      {fraction > 0 && (
        <circle
          cx={c}
          cy={c}
          r={rDial}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={`${TAU * rDial * Math.min(fraction, 1)} ${TAU * rDial}`}
          transform={`rotate(-90 ${c} ${c})`}
        />
      )}

      {/* التدريجات */}
      {ticks.map((i) => {
        const major = i % 5 === 0
        const angle = (i * 6 * Math.PI) / 180
        const rStart = major ? 96 : 104
        const rEnd = 111
        const a = polar(c, c, rStart, angle)
        const b = polar(c, c, rEnd, angle)
        return (
          <line
            key={i}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke={major ? "#f2f2f7" : "#6e6e73"}
            strokeWidth={major ? 3 : 1.2}
            strokeLinecap="round"
          />
        )
      })}

      {/* الأرقام */}
      {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n, i) => {
        const angle = (i * 30 * Math.PI) / 180
        const p = polar(c, c, 76, angle)
        return (
          <text
            key={n}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#f2f2f7"
            fontSize="19"
            fontWeight={600}
            fontFamily="var(--font-geist-sans), system-ui"
          >
            {n}
          </text>
        )
      })}

      {/* العقارب — تدور بشكل مستمر (سلس) */}
      {showHour && (
        <g transform={`rotate(${hourAngle} ${c} ${c})`}>
          <line
            x1={c}
            y1={c + 18}
            x2={c}
            y2={c - 58}
            stroke="#f2f2f7"
            strokeWidth="7.5"
            strokeLinecap="round"
          />
        </g>
      )}

      <g transform={`rotate(${minuteAngle} ${c} ${c})`}>
        <line
          x1={c}
          y1={c + 22}
          x2={c}
          y2={c - 92}
          stroke="#f2f2f7"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </g>

      <g transform={`rotate(${secondAngle} ${c} ${c})`}>
        <line
          x1={c}
          y1={c + 30}
          x2={c}
          y2={c - 112}
          stroke="var(--accent)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx={c} cy={c - 112} r="3.5" fill="var(--accent)" />
      </g>

      {/* المحور */}
      <circle cx={c} cy={c} r="7" fill="#f2f2f7" />
      <circle cx={c} cy={c} r="3" fill="var(--accent)" />
    </svg>
  )
}
