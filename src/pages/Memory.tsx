import { useMemo } from "react";
import { useMemoryStats } from "@/hooks/useSystemStats";
import { GaugeChart } from "@/components/charts/GaugeChart";
import { LineChart } from "@/components/charts/LineChart";
import { formatBytes, getUsageColor, getUsageClass, clampPct } from "@/lib/utils";

function BreakdownRow({ label, bytes, pct, color }: { label: string; bytes: number; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-token-xs w-4 h-4 rounded-sm shrink-0" style={{ background: color, opacity: 0.85 }} />
      <span className="text-token-xs text-muted w-20 shrink-0">{label}</span>
      <div className="flex-1 progress-track">
        <div className="progress-fill" style={{ width: `${clampPct(pct)}%`, background: color }} />
      </div>
      <span className="text-token-xs font-mono text-secondary w-16 text-right tabular-nums shrink-0">
        {formatBytes(bytes)}
      </span>
      <span className="text-token-xs text-muted w-8 text-right tabular-nums shrink-0">
        {pct.toFixed(0)}%
      </span>
    </div>
  );
}

export function Memory() {
  const { data, history } = useMemoryStats();
  const chartData = useMemo(() => history.map((v, i) => ({ t: i, ram: v })), [history]);

  if (!data) return (
    <div className="flex items-center justify-center h-full">
      <span className="text-muted text-token-sm animate-pulse-dot">Loading memory data…</span>
    </div>
  );

  const ramRows = [
    { label: "Used",      bytes: data.used_bytes,      pct: data.usage_percent,                                    color: "rgb(var(--success))" },
    { label: "Available", bytes: data.available_bytes,  pct: (data.available_bytes / data.total_bytes) * 100,      color: "rgb(var(--accent))" },
    data.cached_bytes  != null ? { label: "Cached",   bytes: data.cached_bytes,   pct: (data.cached_bytes / data.total_bytes) * 100,   color: "rgb(var(--info))" }   : null,
    data.buffers_bytes != null ? { label: "Buffers",  bytes: data.buffers_bytes,  pct: (data.buffers_bytes / data.total_bytes) * 100,  color: "rgb(var(--warning))" } : null,
    data.active_bytes  != null ? { label: "Active",   bytes: data.active_bytes,   pct: (data.active_bytes / data.total_bytes) * 100,   color: "rgb(var(--danger))" }  : null,
    data.inactive_bytes != null ? { label: "Inactive", bytes: data.inactive_bytes, pct: (data.inactive_bytes / data.total_bytes) * 100, color: "rgb(var(--text-muted))" } : null,
    (data.dirty_bytes != null && data.dirty_bytes > 0) ? { label: "Dirty", bytes: data.dirty_bytes, pct: (data.dirty_bytes / data.total_bytes) * 100, color: "rgb(var(--warning)/0.6)" } : null,
  ].filter(Boolean) as { label: string; bytes: number; pct: number; color: string }[];

  return (
    <div className="page-layout">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-token-xl font-bold text-primary">Memory</h1>
        <span className="text-token-xs text-muted">{formatBytes(data.total_bytes)} total</span>
      </div>

      {/* Gauges row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-card">
        <div className="glass-card flex flex-col items-center justify-center py-3">
          <GaugeChart value={data.usage_percent} size={112} sublabel="RAM"
            color={getUsageColor(data.usage_percent)} />
        </div>

        <div className="glass-card flex flex-col justify-center gap-3">
          {[
            { label: "Total",     val: formatBytes(data.total_bytes),     cls: "text-primary" },
            { label: "Used",      val: formatBytes(data.used_bytes),      cls: getUsageClass(data.usage_percent) },
            { label: "Available", val: formatBytes(data.available_bytes), cls: "text-secondary" },
            ...(data.cached_bytes != null ? [{ label: "Cached", val: formatBytes(data.cached_bytes), cls: "text-info" }] : []),
          ].map(({ label, val, cls }) => (
            <div key={label}>
              <p className="text-token-xs text-muted">{label}</p>
              <p className={`text-token-sm font-semibold ${cls}`}>{val}</p>
            </div>
          ))}
        </div>

        <div className="glass-card flex flex-col items-center justify-center py-3">
          <GaugeChart value={data.swap_usage_percent} size={112} sublabel="Swap"
            color={getUsageColor(data.swap_usage_percent)} />
        </div>

        <div className="glass-card flex flex-col justify-center gap-3">
          {[
            { label: "Total Swap",  val: formatBytes(data.swap_total_bytes),                          cls: "text-primary" },
            { label: "Used Swap",   val: formatBytes(data.swap_used_bytes),                           cls: getUsageClass(data.swap_usage_percent) },
            { label: "Free Swap",   val: formatBytes(data.swap_total_bytes - data.swap_used_bytes),   cls: "text-secondary" },
          ].map(({ label, val, cls }) => (
            <div key={label}>
              <p className="text-token-xs text-muted">{label}</p>
              <p className={`text-token-sm font-semibold ${cls}`}>{val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stacked bar overview */}
      <div className="glass-card">
        <div className="flex items-center justify-between mb-2">
          <p className="text-token-sm font-semibold text-primary">RAM Usage</p>
          <span className={`text-token-xs font-semibold tabular-nums ${getUsageClass(data.usage_percent)}`}>
            {data.usage_percent.toFixed(1)}%
          </span>
        </div>
        <div className="flex h-4 rounded-full overflow-hidden gap-px">
          {ramRows.map(({ label, pct, color }) => (
            <div key={label} title={`${label}: ${pct.toFixed(1)}%`}
              className="transition-all duration-500"
              style={{ width: `${clampPct(pct)}%`, background: color, opacity: 0.85, minWidth: pct > 0.5 ? 2 : 0 }} />
          ))}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
          {ramRows.map(({ label, color }) => (
            <span key={label} className="flex items-center gap-1 text-token-xs text-muted">
              <span className="w-2.5 h-2.5 rounded-sm inline-block shrink-0" style={{ background: color, opacity: 0.85 }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* History chart */}
      <div className="glass-card">
        <div className="flex items-center justify-between mb-3">
          <p className="text-token-sm font-semibold text-primary">Usage History</p>
        </div>
        <LineChart data={chartData}
          lines={[{ key: "ram", color: "rgb(var(--success))", name: "RAM %" }]}
          height={140} unit="%" domain={[0, 100]} />
      </div>

      {/* Breakdown tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-card">
        <div className="glass-card">
          <p className="text-token-sm font-semibold text-primary mb-3">RAM Breakdown</p>
          <div className="flex flex-col gap-2.5">{ramRows.map((r) => <BreakdownRow key={r.label} {...r} />)}</div>
        </div>
        <div className="glass-card">
          <p className="text-token-sm font-semibold text-primary mb-3">Swap Breakdown</p>
          <div className="flex flex-col gap-2.5">
            <BreakdownRow label="Used" bytes={data.swap_used_bytes} pct={data.swap_usage_percent} color="rgb(var(--warning))" />
            <BreakdownRow label="Free" bytes={data.swap_total_bytes - data.swap_used_bytes} pct={100 - data.swap_usage_percent} color="rgb(var(--bg-elevated))" />
          </div>
        </div>
      </div>
    </div>
  );
}
