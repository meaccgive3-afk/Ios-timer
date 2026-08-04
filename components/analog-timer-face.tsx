"use client"

type Props = {
  /** المدة الكاملة بالمللي ثانية */
  totalMs: number
  /** المتبقي بالمللي ثانية (يتغير بسلاسة كل فريم) */
  remainingMs: number
  size?: number
}

/** التقريب يضمن تطابق ناتج السيرفر مع العميل (hydration) */
const round = (n: number) => Math.round(n * 1000) / 1000

function polar(cx: number, cy: number, r: number, angle: number) {
  return {
    x: round(cx + r * Math.sin(angle)),
    y: round(cy - r * Math.cos(angle)),
  }
}

/**
 * وجه ساعة بأسلوب StandBy في iOS:
 * خلفية سوداء، حلقة تدريجات دقيقة، أرقام عريضة، عقارب بيضاء
 * وعقرب ثواني ذهبي رقيق. كل الزوايا مشتقة من قيم كسرية مستمرة
 * حتى تكون الحركة انسيابية بدون قفزات.
 */
export function AnalogTimerFace({ totalMs, remainingMs, size = 300 }: Props) {
  const S = 300
  const c = S / 2

  const seconds = remainingMs / 1000
  const secondAngle = (seconds % 60) * 6
  const minuteAngle = ((seconds / 60) % 60) * 6
  const hourAngle = ((seconds / 3600) % 12) * 30

  const showHour = totalMs >= 3600 * 1000
  const ticks = Array.from({ length: 60 }, (_, i) => i)

  return (
    <svg
      viewBox={`0 0 ${S} ${S}`}
      width={size}
      height={size}
      role="img"
      aria-label="ساعة بعقارب تعرض الوقت المتبقي"
      className="block select-none"
    >
      {/* حلقة التدريجات — 60 علامة، الخماسية أطول وأعرض */}
      {ticks.map((i) => {
        const major = i % 5 === 0
        const angle = (i * 6 * Math.PI) / 180
        const rStart = major ? 122 : 130
        const rEnd = 141
        const a = polar(c, c, rStart, angle)
        const b = polar(c, c, rEnd, angle)
        return (
          <line
            key={i}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke="var(--foreground)"
            strokeWidth={major ? 4.5 : 1.6}
            opacity={major ? 1 : 0.55}
            strokeLinecap="butt"
          />
        )
      })}

      {/* الأرقام العريضة */}
      {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n, i) => {
        const angle = (i * 30 * Math.PI) / 180
        const p = polar(c, c, 96, angle)
        return (
          <text
            key={n}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="central"
            fill="var(--foreground)"
            fontSize="34"
            fontWeight={700}
            letterSpacing="-1"
            fontFamily="var(--font-geist-sans), system-ui"
          >
            {n}
          </text>
        )
      })}

      {/* عقرب الساعات */}
      {showHour && (
        <g transform={`rotate(${hourAngle} ${c} ${c})`}>
          <line
            x1={c}
            y1={c + 20}
            x2={c}
            y2={c - 60}
            stroke="var(--foreground)"
            strokeWidth="8"
            strokeLinecap="round"
          />
        </g>
      )}

      {/* عقرب الدقائق */}
      <g transform={`rotate(${minuteAngle} ${c} ${c})`}>
        <line
          x1={c}
          y1={c + 26}
          x2={c}
          y2={c - 118}
          stroke="var(--foreground)"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </g>

      {/* عقرب الثواني الذهبي */}
      <g transform={`rotate(${secondAngle} ${c} ${c})`}>
        <line
          x1={c}
          y1={c + 36}
          x2={c}
          y2={c - 130}
          stroke="var(--accent)"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </g>

      {/* المحور الذهبي */}
      <circle cx={c} cy={c} r="4.5" fill="var(--accent)" />
    </svg>
  )
}
