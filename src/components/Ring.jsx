export default function Ring({ pct, size = 120, color = '#58cc02', label }) {
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} className="ring-bg" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className="ring-fg"
          style={{ stroke: color, strokeDasharray: c, strokeDashoffset: c * (1 - clamped / 100) }}
        />
      </svg>
      <div className="ring-label" style={{ color }}>
        {label ?? `${Math.round(clamped)}%`}
      </div>
    </div>
  );
}
