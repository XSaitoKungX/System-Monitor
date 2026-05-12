import { clampPct, getUsageColor } from "@/lib/utils";

interface GaugeChartProps {
  value: number;
  max?: number;
  size?: number;
  label?: string;
  sublabel?: string;
  unit?: string;
  color?: string;
}

export function GaugeChart({
  value,
  max = 100,
  size = 120,
  label,
  sublabel,
  unit = "%",
  color: colorOverride,
}: GaugeChartProps) {
  const pct    = clampPct((value / max) * 100);
  const color  = colorOverride ?? getUsageColor(pct);

  const cx = 60, cy = 60, r = 46;
  const START = -215, END = 35;
  const TOTAL = END - START;

  const toRad = (d: number) => (d * Math.PI) / 180;
  const arc = (from: number, to: number) => {
    const [sx, sy] = [cx + r * Math.cos(toRad(from)), cy + r * Math.sin(toRad(from))];
    const [ex, ey] = [cx + r * Math.cos(toRad(to)),   cy + r * Math.sin(toRad(to))];
    return `M ${sx} ${sy} A ${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${ex} ${ey}`;
  };

  const sweepEnd = START + (pct / 100) * TOTAL;
  const uid = `gauge-${Math.round(value)}-${size}`;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox="0 0 120 120" style={{ overflow: "visible" }}>
        <defs>
          <filter id={`${uid}-glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Track */}
        <path d={arc(START, END)} fill="none"
          stroke="rgb(var(--bg-hover))" strokeWidth="7" strokeLinecap="round" />

        {/* Fill */}
        {pct > 0 && (
          <path d={arc(START, sweepEnd)} fill="none"
            stroke={color} strokeWidth="7" strokeLinecap="round"
            filter={`url(#${uid}-glow)`}
            style={{ transition: "d 0.5s cubic-bezier(0.4,0,0.2,1)" }} />
        )}

        {/* Value */}
        <text x={cx} y={cy + 5} textAnchor="middle"
          fill="rgb(var(--text-primary))" fontSize="17" fontWeight="700" fontFamily="inherit">
          {pct.toFixed(0)}{unit}
        </text>

        {/* Sublabel */}
        {sublabel && (
          <text x={cx} y={cy + 20} textAnchor="middle"
            fill="rgb(var(--text-muted))" fontSize="9.5" fontFamily="inherit" letterSpacing="0.5">
            {sublabel.toUpperCase()}
          </text>
        )}
      </svg>

      {label && (
        <span style={{ color: "rgb(var(--text-secondary))", fontSize: 11 }}>{label}</span>
      )}
    </div>
  );
}
