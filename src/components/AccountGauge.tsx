/** `stroke-dasharray` is in percent of the circumference, so the rest is 100 - progress. */
const FULL_CIRCLE = 100

interface AccountGaugeProps {
  /** Percentage saved towards the goal. */
  progress: number
}

/** The ring on a goal account, drawn from the payload's `progress`. */
export function AccountGauge({ progress }: AccountGaugeProps) {
  const filled = Math.min(Math.max(progress, 0), FULL_CIRCLE)

  return (
    <div className="main-acc__circle">
      <svg className="graph-bar" width="100%" height="100%" viewBox="0 0 42 42">
        <circle
          cx="21"
          cy="21"
          r="15.91549430918954"
          fill="transparent"
          stroke="rgba(0,0,0,0.07)"
          strokeWidth="1.5"
        />
        <circle
          className="gauge"
          cx="21"
          cy="21"
          r="15.91549430918954"
          fill="transparent"
          stroke="#fff"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDashoffset="25"
          style={{ strokeDasharray: `${filled} ${FULL_CIRCLE - filled}` }}
        />
      </svg>
      <div className="main-acc__num">
        <span className="percent">{filled}</span>
        <span className="unit">%</span>
      </div>
    </div>
  )
}
