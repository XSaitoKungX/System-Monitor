import { useMemo } from "react";
import { useMemoryStats } from "@/hooks/useSystemStats";
import { GaugeChart } from "@/components/charts/GaugeChart";
import { LineChart } from "@/components/charts/LineChart";
import { formatBytes, getUsageClass } from "@/lib/utils";
import { clsx } from "clsx";

export function Memory() {
  const { data, history } = useMemoryStats();

  const chartData = useMemo(
    () => history.map((v, i) => ({ t: i, ram: v })),
    [history]
  );

  if (!data) {
    return <div className="text-muted text-token-sm">Loading memory data...</div>;
  }

  const BreakdownRow = ({ label, bytes, pct, color }: { label: string; bytes: number; pct: number; color: string }) => (
    <div className="flex items-center gap-3">
      <span className="text-token-xs text-muted w-20">{label}</span>
      <div className="flex-1 h-2 rounded-full" style={{ background: "rgb(var(--border))" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
      </div>
      <span className="text-token-xs text-primary w-20 text-right font-mono">{formatBytes(bytes)}</span>
    </div>
  );

  return (
    <div className="page-layout">
      <h1 className="text-token-xl font-bold text-primary">Memory</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-card">
        <div className="glass p-card text-center">
          <GaugeChart value={data.usage_percent} size={110} sublabel="RAM" />
        </div>
        <div className="glass p-card flex flex-col justify-center gap-card">
          <div>
            <p className="text-token-xs text-muted">Total RAM</p>
            <p className="text-token-lg font-semibold text-primary">{formatBytes(data.total_bytes)}</p>
          </div>
          <div>
            <p className="text-token-xs text-muted">Used</p>
            <p className={clsx("text-token-base font-medium", getUsageClass(data.usage_percent))}>{formatBytes(data.used_bytes)}</p>
          </div>
          <div>
            <p className="text-token-xs text-muted">Available</p>
            <p className="text-token-base font-medium text-primary">{formatBytes(data.available_bytes)}</p>
          </div>
        </div>
        <div className="glass p-card text-center">
          <GaugeChart value={data.swap_usage_percent} size={110} sublabel="Swap" />
        </div>
        <div className="glass p-card flex flex-col justify-center gap-card">
          <div>
            <p className="text-token-xs text-muted">Total Swap</p>
            <p className="text-token-lg font-semibold text-primary">{formatBytes(data.swap_total_bytes)}</p>
          </div>
          <div>
            <p className="text-token-xs text-muted">Used Swap</p>
            <p className={clsx("text-token-base font-medium", getUsageClass(data.swap_usage_percent))}>{formatBytes(data.swap_used_bytes)}</p>
          </div>
        </div>
      </div>

      <div className="glass p-card">
        <p className="text-token-sm font-medium text-primary mb-3">Memory Usage History</p>
        <LineChart
          data={chartData}
          lines={[{ key: "ram", color: "rgb(var(--success))", name: "RAM %" }]}
          height={160}
          unit="%"
          domain={[0, 100]}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-card">
        <div className="glass p-card">
          <p className="text-token-sm font-medium text-primary mb-3">RAM Breakdown</p>
          <div className="flex flex-col gap-2">
            <BreakdownRow label="Used" bytes={data.used_bytes} pct={data.usage_percent} color="rgb(var(--success))" />
            <BreakdownRow label="Available" bytes={data.available_bytes} pct={(data.available_bytes / data.total_bytes) * 100} color="rgb(var(--accent))" />
            {data.cached_bytes != null && (
              <BreakdownRow label="Cached" bytes={data.cached_bytes} pct={(data.cached_bytes / data.total_bytes) * 100} color="rgb(var(--info))" />
            )}
            {data.buffers_bytes != null && (
              <BreakdownRow label="Buffers" bytes={data.buffers_bytes} pct={(data.buffers_bytes / data.total_bytes) * 100} color="rgb(var(--warning))" />
            )}
            {data.active_bytes != null && (
              <BreakdownRow label="Active" bytes={data.active_bytes} pct={(data.active_bytes / data.total_bytes) * 100} color="rgb(var(--danger)/0.7)" />
            )}
            {data.inactive_bytes != null && (
              <BreakdownRow label="Inactive" bytes={data.inactive_bytes} pct={(data.inactive_bytes / data.total_bytes) * 100} color="rgb(var(--text-muted)/0.4)" />
            )}
            {data.dirty_bytes != null && data.dirty_bytes > 0 && (
              <BreakdownRow label="Dirty" bytes={data.dirty_bytes} pct={(data.dirty_bytes / data.total_bytes) * 100} color="rgb(var(--warning)/0.6)" />
            )}
          </div>
        </div>
        <div className="glass p-card">
          <p className="text-token-sm font-medium text-primary mb-3">Swap Breakdown</p>
          <div className="flex flex-col gap-2">
            <BreakdownRow label="Used" bytes={data.swap_used_bytes} pct={data.swap_usage_percent} color="rgb(var(--warning))" />
            <BreakdownRow label="Free" bytes={data.swap_total_bytes - data.swap_used_bytes} pct={100 - data.swap_usage_percent} color="rgb(var(--bg-hover))" />
          </div>
        </div>
      </div>
    </div>
  );
}
