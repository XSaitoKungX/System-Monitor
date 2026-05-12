import { useMemo } from "react";
import { useCpuStats } from "@/hooks/useSystemStats";
import { GaugeChart } from "@/components/charts/GaugeChart";
import { LineChart } from "@/components/charts/LineChart";
import { formatFrequency, formatCache, getUsageColor, getUsageClass, clampPct } from "@/lib/utils";
import { Thermometer, Cpu as CpuIcon, Zap, Layers } from "lucide-react";

export function CPU() {
  const { data, history } = useCpuStats();
  const chartData = useMemo(() => history.map((v, i) => ({ t: i, cpu: v })), [history]);

  if (!data) return (
    <div className="flex items-center justify-center h-full">
      <span className="text-muted text-token-sm animate-pulse-dot">Loading CPU data…</span>
    </div>
  );

  const tempColor = data.temperature != null
    ? data.temperature >= 85 ? "rgb(var(--danger))" : data.temperature >= 70 ? "rgb(var(--warning))" : "rgb(var(--success))"
    : "rgb(var(--text-muted))";

  return (
    <div className="page-layout">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-token-xl font-bold text-primary">CPU</h1>
          <p className="text-token-xs text-muted mt-0.5">{data.brand}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="badge" style={{ background: "rgb(var(--accent)/0.12)", color: "rgb(var(--accent))" }}>
              {data.vendor}
            </span>
            <span className="badge" style={{ background: "rgb(var(--bg-elevated))", color: "rgb(var(--text-muted))" }}>
              {data.architecture}
            </span>
            <span className="badge" style={{ background: "rgb(var(--bg-elevated))", color: "rgb(var(--text-muted))" }}>
              {data.physical_cores}P / {data.logical_cores}L cores
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className={`text-token-4xl font-bold tabular-nums ${getUsageClass(data.usage_total)}`}>
            {data.usage_total.toFixed(1)}<span className="text-token-xl">%</span>
          </p>
          <p className="text-token-xs text-muted">{formatFrequency(data.frequency_mhz)}</p>
        </div>
      </div>

      {/* Main row: gauge + stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-card">
        <div className="glass-card flex flex-col items-center justify-center gap-2 py-4">
          <GaugeChart value={data.usage_total} size={120} sublabel="Total" />
        </div>

        <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-card">
          {[
            { icon: <Zap size={14} />, label: "Frequency", value: formatFrequency(data.frequency_mhz), color: "rgb(var(--accent))" },
            { icon: <CpuIcon size={14} />, label: "P-Cores", value: String(data.physical_cores), color: "rgb(var(--info))" },
            { icon: <Layers size={14} />, label: "L-Cores", value: String(data.logical_cores), color: "rgb(var(--info))" },
            { icon: <Thermometer size={14} />, label: "Temp", value: data.temperature != null ? `${data.temperature.toFixed(1)}°C` : "N/A", color: tempColor },
          ].map(({ icon, label, value, color }) => (
            <div key={label} className="stat-tile">
              <span className="text-token-xs text-muted flex items-center gap-1.5" style={{ color }}>
                {icon} {label}
              </span>
              <span className="text-token-xl font-bold" style={{ color }}>{value}</span>
            </div>
          ))}

          {/* Cache */}
          <div className="stat-tile col-span-2">
            <span className="text-token-xs text-muted mb-1">Cache</span>
            <div className="flex gap-3 flex-wrap">
              {[["L1", data.cache_l1_kb], ["L2", data.cache_l2_kb], ["L3", data.cache_l3_kb]].map(([lvl, kb]) =>
                kb != null ? (
                  <div key={String(lvl)} className="flex flex-col items-center">
                    <span className="text-token-xs text-muted">{lvl}</span>
                    <span className="text-token-sm font-semibold text-primary font-mono">{formatCache(Number(kb))}</span>
                  </div>
                ) : null
              )}
            </div>
          </div>

          {/* ISA features */}
          <div className="stat-tile col-span-2">
            <span className="text-token-xs text-muted mb-1">Instruction Sets</span>
            <div className="flex flex-wrap gap-1">
              {data.features.length > 0
                ? data.features.map((f) => (
                    <span key={f} className="badge"
                      style={{ background: "rgb(var(--accent)/0.1)", color: "rgb(var(--accent))" }}>
                      {f}
                    </span>
                  ))
                : <span className="text-token-xs text-muted">N/A</span>}
            </div>
          </div>
        </div>
      </div>

      {/* History chart */}
      <div className="glass-card">
        <div className="flex items-center justify-between mb-3">
          <p className="text-token-sm font-semibold text-primary">Usage History</p>
          <span className={`text-token-xs font-semibold tabular-nums ${getUsageClass(data.usage_total)}`}>
            {data.usage_total.toFixed(1)}%
          </span>
        </div>
        <LineChart data={chartData}
          lines={[{ key: "cpu", color: "rgb(var(--accent))", name: "CPU %" }]}
          height={140} unit="%" domain={[0, 100]} />
      </div>

      {/* Per-core grid */}
      <div className="glass-card">
        <p className="text-token-sm font-semibold text-primary mb-3">Per-Core Usage</p>
        <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))" }}>
          {data.usage_per_core.map((u, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-full rounded-sm overflow-hidden" style={{ height: 48, background: "rgb(var(--bg-hover))" }}>
                <div className="w-full rounded-sm transition-all duration-500"
                  style={{
                    height: `${clampPct(u)}%`,
                    marginTop: `${100 - clampPct(u)}%`,
                    background: getUsageColor(u),
                    opacity: 0.85,
                  }} />
              </div>
              <span className="text-token-xs text-muted">C{i}</span>
              <span className="text-token-xs font-semibold tabular-nums" style={{ color: getUsageColor(u) }}>
                {u.toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
