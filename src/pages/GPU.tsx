import { Monitor, Thermometer, Zap, HardDrive, Activity, Wind, Cpu } from "lucide-react";
import { useGpuStats } from "@/hooks/useSystemStats";
import { formatBytes, getUsageColor } from "@/lib/utils";
import type { GpuInfo } from "@/types";

function VendorBadge({ vendor }: { vendor: string }) {
  const style: Record<string, { bg: string; color: string }> = {
    NVIDIA: { bg: "rgb(118 185 0 / 0.15)", color: "rgb(118 185 0)" },
    AMD:    { bg: "rgb(237 28 36 / 0.15)", color: "rgb(237 100 100)" },
    Intel:  { bg: "rgb(0 113 197 / 0.15)", color: "rgb(80 160 220)" },
  };
  const s = style[vendor] ?? { bg: "rgb(var(--bg-hover))", color: "rgb(var(--text-secondary))" };
  return (
    <span className="text-token-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.color }}>
      {vendor}
    </span>
  );
}

function UsageArc({ value }: { value: number }) {
  const clamped = Math.min(Math.max(value, 0), 100);
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = (clamped / 100) * circ;
  const color = getUsageColor(clamped);
  return (
    <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="9"
          style={{ stroke: "rgb(var(--bg-hover))" }} />
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="9"
          strokeLinecap="round"
          style={{ stroke: color, strokeDasharray: `${dash} ${circ - dash}`, transition: "stroke-dasharray 0.4s ease" }} />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-token-2xl font-bold text-primary">{clamped.toFixed(0)}</span>
        <span className="text-token-xs text-muted">%</span>
      </div>
    </div>
  );
}

function StatTile({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col gap-1 p-3 rounded-xl" style={{ background: "rgb(var(--bg-hover))" }}>
      <div className="flex items-center gap-1.5 text-token-xs text-muted">{icon} {label}</div>
      <p className="text-token-xl font-bold" style={{ color: color ?? "rgb(var(--text-primary))" }}>{value}</p>
    </div>
  );
}

function GpuCard({ gpu }: { gpu: GpuInfo }) {
  const vramPct = gpu.vram_usage_percent;
  const hasVram = gpu.vram_total_bytes > 0;

  return (
    <div className="glass p-card flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl shrink-0" style={{ background: "rgb(var(--accent)/0.12)" }}>
            <Monitor size={18} style={{ color: "rgb(var(--accent))" }} />
          </div>
          <div className="min-w-0">
            <p className="text-token-sm font-semibold text-primary truncate">{gpu.name}</p>
            <p className="text-token-xs text-muted">Driver: <span className="font-mono">{gpu.driver}</span></p>
          </div>
        </div>
        <VendorBadge vendor={gpu.vendor} />
      </div>

      {/* GPU Usage Arc + Stats */}
      <div className="flex items-center gap-6">
        <div className="flex flex-col items-center gap-1">
          <UsageArc value={gpu.gpu_usage_percent} />
          <span className="text-token-xs text-muted">GPU Load</span>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-card">
          <StatTile icon={<Thermometer size={12} />} label="Temperature"
            value={gpu.temperature != null ? `${gpu.temperature.toFixed(0)}°C` : "N/A"}
            color={gpu.temperature != null ? getUsageColor(gpu.temperature) : undefined} />
          <StatTile icon={<Zap size={12} />} label="Power"
            value={gpu.power_watts != null
              ? gpu.power_limit_watts != null
                ? `${gpu.power_watts.toFixed(0)} / ${gpu.power_limit_watts.toFixed(0)} W`
                : `${gpu.power_watts.toFixed(1)} W`
              : "N/A"} />
          <StatTile icon={<Wind size={12} />} label="Fan Speed"
            value={gpu.fan_speed_percent != null
              ? gpu.fan_rpm != null
                ? `${gpu.fan_speed_percent}% · ${gpu.fan_rpm} RPM`
                : `${gpu.fan_speed_percent}%`
              : "N/A"} />
          <StatTile icon={<Cpu size={12} />} label="Core / Mem Clock"
            value={gpu.freq_mhz != null
              ? gpu.mem_freq_mhz != null
                ? `${gpu.freq_mhz} / ${gpu.mem_freq_mhz} MHz`
                : `${gpu.freq_mhz} MHz`
              : "N/A"} />
          <StatTile icon={<HardDrive size={12} />} label={hasVram ? "VRAM Used" : "Max Clock"}
            value={hasVram ? formatBytes(gpu.vram_used_bytes) : gpu.max_freq_mhz != null ? `${gpu.max_freq_mhz} MHz` : "N/A"} />
          <StatTile icon={<Activity size={12} />} label={hasVram ? "VRAM Total" : ""}
            value={hasVram ? formatBytes(gpu.vram_total_bytes) : ""} />
        </div>
      </div>

      {/* VRAM bar */}
      {hasVram && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-token-xs text-muted">
            <span>VRAM Usage</span>
            <span style={{ color: getUsageColor(vramPct) }}>{vramPct.toFixed(1)}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgb(var(--bg-hover))" }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(vramPct, 100)}%`, background: getUsageColor(vramPct) }} />
          </div>
          <div className="flex justify-between text-token-xs text-muted">
            <span>{formatBytes(gpu.vram_used_bytes)} used</span>
            <span>{formatBytes(gpu.vram_total_bytes - gpu.vram_used_bytes)} free</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function GPU() {
  const { data } = useGpuStats();

  if (!data) {
    return (
      <div className="page-layout">
        <h1 className="text-token-xl font-bold text-primary">GPU</h1>
        <div className="text-muted text-token-sm">Loading GPU data…</div>
      </div>
    );
  }

  return (
    <div className="page-layout">
      <div className="flex items-center justify-between">
        <h1 className="text-token-xl font-bold text-primary">GPU</h1>
        <span className="text-token-xs text-muted">{data.gpus.length} device{data.gpus.length !== 1 ? "s" : ""} detected</span>
      </div>

      {data.gpus.length === 0 ? (
        <div className="glass p-8 flex flex-col items-center justify-center gap-3 text-center">
          <Monitor size={36} className="text-muted" />
          {data.platform_note ? (
            <>
              <p className="text-token-sm font-medium text-secondary">GPU monitoring not available</p>
              <p className="text-token-xs text-muted max-w-sm">{data.platform_note}</p>
            </>
          ) : (
            <>
              <p className="text-token-sm font-medium text-secondary">No GPU detected</p>
              <p className="text-token-xs text-muted max-w-sm">
                No DRM devices found under <code className="px-1 rounded" style={{ background: "rgb(var(--bg-hover))" }}>/sys/class/drm</code>.
                NVIDIA proprietary drivers may not expose sysfs entries — try enabling the{" "}
                <code className="px-1 rounded" style={{ background: "rgb(var(--bg-hover))" }}>nvidia</code> feature flag.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-card">
          {data.gpus.map((gpu) => <GpuCard key={gpu.index} gpu={gpu} />)}
        </div>
      )}
    </div>
  );
}
