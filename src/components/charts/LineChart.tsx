import {
  ResponsiveContainer,
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface LineChartProps {
  data: Record<string, number>[];
  lines: { key: string; color: string; name?: string }[];
  height?: number;
  unit?: string;
  domain?: [number, number];
  showGrid?: boolean;
  tickFormatter?: (v: number) => string;
  tooltipFormatter?: (v: number) => string;
}

export function LineChart({
  data,
  lines,
  height = 200,
  unit = "%",
  domain = [0, 100],
  showGrid = true,
  tickFormatter,
  tooltipFormatter,
}: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ReLineChart data={data} margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgb(var(--border) / 0.3)"
            vertical={false}
          />
        )}
        <XAxis
          dataKey="t"
          tick={{ fill: "rgb(var(--text-muted))", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          hide
        />
        <YAxis
          domain={domain}
          tick={{ fill: "rgb(var(--text-muted))", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={60}
          tickFormatter={tickFormatter ?? ((v) => `${v}${unit}`)}
        />
        <Tooltip
          contentStyle={{
            background: "rgb(var(--bg-card))",
            border: "1px solid rgb(var(--border))",
            borderRadius: "8px",
            fontSize: 12,
            color: "rgb(var(--text-primary))",
          }}
          formatter={(v) => [tooltipFormatter ? tooltipFormatter(Number(v)) : `${Number(v).toFixed(1)}${unit}`, ""]}
          labelFormatter={() => ""}
        />
        {lines.length > 1 && (
          <Legend
            wrapperStyle={{ fontSize: 11, color: "rgb(var(--text-secondary))" }}
          />
        )}
        {lines.map((l) => (
          <Line
            key={l.key}
            type="monotone"
            dataKey={l.key}
            stroke={l.color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            name={l.name ?? l.key}
          />
        ))}
      </ReLineChart>
    </ResponsiveContainer>
  );
}
