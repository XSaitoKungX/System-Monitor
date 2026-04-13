import { getUsageColor } from "@/lib/utils";

interface GaugeChartProps {
  value: number;
  max?: number;
  size?: number;
  label?: string;
  sublabel?: string;
  unit?: string;
}

export function GaugeChart({
  value,
  max = 100,
  size = 120,
  label,
  sublabel,
  unit = "%",
}: GaugeChartProps) {
  const pct = Math.min((value / max) * 100, 100);
  const r = 46;
  const cx = 60;
  const cy = 60;
  const startAngle = -220;
  const endAngle = 40;
  const totalAngle = endAngle - startAngle;
  const sweepAngle = (pct / 100) * totalAngle;

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const arcPath = (start: number, end: number) => {
    const s = toRad(start);
    const e = toRad(end);
    const x1 = cx + r * Math.cos(s);
    const y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e);
    const y2 = cy + r * Math.sin(e);
    const largeArc = end - start > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  const color = getUsageColor(pct);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        style={{ overflow: "visible" }}
      >
        <path
          d={arcPath(startAngle, endAngle)}
          fill="none"
          stroke="rgb(var(--border))"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {pct > 0 && (
          <path
            d={arcPath(startAngle, startAngle + sweepAngle)}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
          />
        )}
        <text
          x={cx}
          y={cy + 6}
          textAnchor="middle"
          fill="rgb(var(--text-primary))"
          fontSize="18"
          fontWeight="700"
          fontFamily="inherit"
        >
          {pct.toFixed(0)}{unit}
        </text>
        {sublabel && (
          <text
            x={cx}
            y={cy + 22}
            textAnchor="middle"
            fill="rgb(var(--text-muted))"
            fontSize="10"
            fontFamily="inherit"
          >
            {sublabel}
          </text>
        )}
      </svg>
      {label && (
        <span style={{ color: "rgb(var(--text-secondary))", fontSize: 12 }}>
          {label}
        </span>
      )}
    </div>
  );
}
