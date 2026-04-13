import { ResponsiveContainer, AreaChart, Area, Tooltip } from "recharts";

interface SparkLineProps {
  data: number[];
  color?: string;
  height?: number;
  showTooltip?: boolean;
  unit?: string;
}

export function SparkLine({
  data,
  color = "rgb(var(--accent))",
  height = 40,
  showTooltip = false,
  unit = "%",
}: SparkLineProps) {
  const chartData = data.map((v, i) => ({ t: i, v }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
        <defs>
          <linearGradient id={`sg-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {showTooltip && (
          <Tooltip
            contentStyle={{
              background: "rgb(var(--bg-card))",
              border: "1px solid rgb(var(--border))",
              borderRadius: "6px",
              fontSize: 11,
              color: "rgb(var(--text-primary))",
            }}
            formatter={(v) => [`${Number(v).toFixed(1)}${unit}`, ""]}
            labelFormatter={() => ""}
          />
        )}
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#sg-${color})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
