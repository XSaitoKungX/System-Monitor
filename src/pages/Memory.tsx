import { useMemo } from "react";
import { useMemoryStats } from "@/hooks/useSystemStats";
import { GaugeChart } from "@/components/charts/GaugeChart";
import { LineChart } from "@/components/charts/LineChart";
import { formatBytes, getUsageClass } from "@/lib/utils";

export function Memory() {
  const { data, history } = useMemoryStats();

  const chartData = useMemo(
    () => history.map((v, i) => ({ t: i, ram: v })),
    [history]
  );

  if (!data) {
    return <div className="text-muted text-sm">Loading memory data...</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-primary">Memory</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass p-4 text-center">
          <GaugeChart value={data.usage_percent} size={110} sublabel="RAM" />
        </div>
        <div className="glass p-4 flex flex-col justify-center gap-2">
          <div>
            <p className="text-xs text-muted">Total RAM</p>
            <p className="text-lg font-semibold text-primary">{formatBytes(data.total_bytes)}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Used</p>
            <p className={`text-base font-medium ${getUsageClass(data.usage_percent)}`}>
              {formatBytes(data.used_bytes)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Available</p>
            <p className="text-base font-medium text-primary">{formatBytes(data.available_bytes)}</p>
          </div>
        </div>
        <div className="glass p-4 text-center">
          <GaugeChart value={data.swap_usage_percent} size={110} sublabel="Swap" />
        </div>
        <div className="glass p-4 flex flex-col justify-center gap-2">
          <div>
            <p className="text-xs text-muted">Total Swap</p>
            <p className="text-lg font-semibold text-primary">{formatBytes(data.swap_total_bytes)}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Used Swap</p>
            <p className={`text-base font-medium ${getUsageClass(data.swap_usage_percent)}`}>
              {formatBytes(data.swap_used_bytes)}
            </p>
          </div>
        </div>
      </div>

      <div className="glass p-4">
        <p className="text-sm font-medium text-primary mb-3">Memory Usage History</p>
        <LineChart
          data={chartData}
          lines={[{ key: "ram", color: "rgb(var(--success))", name: "RAM %" }]}
          height={160}
          unit="%"
          domain={[0, 100]}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="glass p-4">
          <p className="text-sm font-medium text-primary mb-3">RAM Breakdown</p>
          <div className="space-y-2">
            {[
              { label: "Used", bytes: data.used_bytes, pct: data.usage_percent },
              { label: "Available", bytes: data.available_bytes, pct: (data.available_bytes / data.total_bytes) * 100 },
            ].map(({ label, bytes, pct }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-xs text-muted w-20">{label}</span>
                <div className="flex-1 h-2 rounded-full" style={{ background: "rgb(var(--border))" }}>
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(pct, 100)}%`,
                      background: "rgb(var(--success))",
                    }}
                  />
                </div>
                <span className="text-xs text-primary w-20 text-right">{formatBytes(bytes)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="glass p-4">
          <p className="text-sm font-medium text-primary mb-3">Swap Breakdown</p>
          <div className="space-y-2">
            {[
              { label: "Used", bytes: data.swap_used_bytes, pct: data.swap_usage_percent },
              { label: "Free", bytes: data.swap_total_bytes - data.swap_used_bytes, pct: 100 - data.swap_usage_percent },
            ].map(({ label, bytes, pct }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-xs text-muted w-20">{label}</span>
                <div className="flex-1 h-2 rounded-full" style={{ background: "rgb(var(--border))" }}>
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(pct, 100)}%`,
                      background: "rgb(var(--warning))",
                    }}
                  />
                </div>
                <span className="text-xs text-primary w-20 text-right">{formatBytes(bytes)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
