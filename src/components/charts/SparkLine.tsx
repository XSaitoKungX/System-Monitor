import { useId } from "react";
import { ResponsiveContainer, AreaChart, Area, Tooltip, YAxis } from "recharts";

interface SparkLineProps {
  data: number[];
  color?: string;
  height?: number;
  showTooltip?: boolean;
  unit?: string;
  domain?: [number, number];
}

export function SparkLine({
  data,
  color = "rgb(var(--accent))",
  height = 48,
  showTooltip = false,
  unit = "%",
  domain = [0, 100],
}: SparkLineProps) {
  const uid = useId().replace(/:/g, "");
  const gradId = `spark-grad-${uid}`;
  const chartData = data.map((v, i) => ({ t: i, v }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <YAxis domain={domain} hide />
        {showTooltip && (
          <Tooltip
            contentStyle={{
              background: "rgb(var(--bg-elevated))",
              border: "1px solid rgb(var(--border) / 0.6)",
              borderRadius: "8px",
              fontSize: 11,
              color: "rgb(var(--text-primary))",
              padding: "4px 10px",
            }}
            formatter={(v) => [`${Number(v).toFixed(1)}${unit}`, ""]}
            labelFormatter={() => ""}
            cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: "3 3" }}
          />
        )}
        <Area
          type="monotoneX"
          dataKey="v"
          stroke={color}
          strokeWidth={1.75}
          fill={`url(#${gradId})`}
          dot={false}
          isAnimationActive={false}
          activeDot={{ r: 3, fill: color, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
