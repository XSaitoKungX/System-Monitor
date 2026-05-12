import { useId } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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
  const uid = useId().replace(/:/g, "");

  return (
    <div>
      {/* Inline legend */}
      {lines.length > 1 && (
        <div className="flex items-center gap-4 mb-2 px-1">
          {lines.map((l) => (
            <span key={l.key} className="flex items-center gap-1.5 text-token-xs text-secondary">
              <span style={{ width: 20, height: 2, background: l.color, borderRadius: 1, display: "inline-block" }} />
              {l.name ?? l.key}
            </span>
          ))}
        </div>
      )}

      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            {lines.map((l) => (
              <linearGradient key={l.key} id={`lc-${uid}-${l.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={l.color} stopOpacity={0.22} />
                <stop offset="100%" stopColor={l.color} stopOpacity={0.01} />
              </linearGradient>
            ))}
          </defs>

          {showGrid && (
            <CartesianGrid strokeDasharray="3 3"
              stroke="rgb(var(--border) / 0.25)" vertical={false} />
          )}

          <XAxis dataKey="t" hide axisLine={false} tickLine={false} />

          <YAxis domain={domain}
            tick={{ fill: "rgb(var(--text-muted))", fontSize: 10 }}
            axisLine={false} tickLine={false} width={52}
            tickFormatter={tickFormatter ?? ((v) => `${v}${unit}`)} />

          <Tooltip
            contentStyle={{
              background: "rgb(var(--bg-elevated))",
              border: "1px solid rgb(var(--border) / 0.6)",
              borderRadius: "10px",
              fontSize: 12,
              color: "rgb(var(--text-primary))",
              padding: "6px 12px",
              boxShadow: "0 8px 32px rgb(0 0 0 / 0.3)",
            }}
            formatter={(v, name) => [
              tooltipFormatter ? tooltipFormatter(Number(v)) : `${Number(v).toFixed(1)}${unit}`,
              lines.find((l) => l.key === name)?.name ?? name,
            ]}
            labelFormatter={() => ""}
            cursor={{ stroke: "rgb(var(--border))", strokeWidth: 1 }}
          />

          {lines.map((l) => (
            <Area key={l.key}
              type="monotoneX"
              dataKey={l.key}
              stroke={l.color}
              strokeWidth={2}
              fill={`url(#lc-${uid}-${l.key})`}
              dot={false}
              isAnimationActive={false}
              activeDot={{ r: 4, fill: l.color, strokeWidth: 0 }}
              name={l.name ?? l.key}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
