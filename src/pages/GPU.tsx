import { Monitor, Thermometer, Zap, HardDrive, Cpu, Activity } from "lucide-react";
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
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
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
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="9"
          style={{ stroke: "rgb(var(--bg-hover))" }} />
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="9"
          strokeLinecap="round"
          style={{
            stroke: color,
            strokeDasharray: `${dash} ${circ - dash}`,
            transition: "stroke-dasharray 0.4s ease",
          }} />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold text-primary">{clamped.toFixed(0)}</span>
        <span className="text-xs text-muted">%</span>
      </div>
    </div>
  );
}

function GpuCard({ gpu }: { gpu: GpuInfo }) {
  const vramPct = gpu.vram_usage_percent;
  const hasVram = gpu.vram_total_bytes > 0;

  return (
    <div className="glass p-5 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl shrink-0" style={{ background: "rgb(var(--accent)/0.12)" }}>
            <Monitor size={18} style={{ color: "rgb(var(--accent))" }} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-primary truncate">{gpu.name}</p>
            <p className="text-xs text-muted">Driver: <span className="font-mono">{gpu.driver}</span></p>
          </div>
        </div>
        <VendorBadge vendor={gpu.vendor} />
      </div>

      {/* GPU Usage Arc + Stats */}
      <div className="flex items-center gap-6">
        <div className="flex flex-col items-center gap-1 shrink-0">
          <UsageArc value={gpu.gpu_usage_percent} />
          <span className="text-xs text-muted">GPU Load</span>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-3">
          {/* Temperature */}
          <div className="flex flex-col gap-1 p-3 rounded-xl"
            style={{ background: "rgb(var(--bg-hover))" }}>
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <Thermometer size={12} /> Temperature
            </div>
            <p className="text-xl font-bold"
              style={{ color: gpu.temperature != null ? getUsageColor(gpu.temperature / 100 * 100) : "rgb(var(--text-muted))" }}>
              {gpu.temperature != null ? `${gpu.temperature.toFixed(0)}°C` : "N/A"}
            </p>
          </div>

          {/* Power */}
          <div className="flex flex-col gap-1 p-3 rounded-xl"
            style={{ background: "rgb(var(--bg-hover))" }}>
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <Zap size={12} /> Power
            </div>
            <p className="text-xl font-bold text-primary">
              {gpu.power_watts != null ? `${gpu.power_watts.toFixed(1)} W` : "N/A"}
            </p>
          </div>

          {/* VRAM Used or Clock */}
          <div className="flex flex-col gap-1 p-3 rounded-xl"
            style={{ background: "rgb(var(--bg-hover))" }}>
            <div className="flex items-center gap-1.5 text-xs text-muted">
              {hasVram ? <HardDrive size={12} /> : <Activity size={12} />}
              {hasVram ? "VRAM Used" : "Clock"}
            </div>
            <p className="text-xl font-bold text-primary">
              {hasVram
                ? formatBytes(gpu.vram_used_bytes)
                : gpu.freq_mhz != null ? `${gpu.freq_mhz} MHz` : "N/A"}
            </p>
          </div>

          {/* VRAM Total or Max Clock */}
          <div className="flex flex-col gap-1 p-3 rounded-xl"
            style={{ background: "rgb(var(--bg-hover))" }}>
            <div className="flex items-center gap-1.5 text-xs text-muted">
              {hasVram ? <Cpu size={12} /> : <Cpu size={12} />}
              {hasVram ? "VRAM Total" : "Max Clock"}
            </div>
            <p className="text-xl font-bold text-primary">
              {hasVram
                ? formatBytes(gpu.vram_total_bytes)
                : gpu.max_freq_mhz != null ? `${gpu.max_freq_mhz} MHz` : "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* VRAM bar (dedicated only) */}
      {hasVram ? (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted">
            <span>VRAM</span>
            <span style={{ color: getUsageColor(vramPct) }}>{vramPct.toFixed(1)}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgb(var(--bg-hover))" }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(vramPct, 100)}%`, background: getUsageColor(vramPct) }} />
          </div>
          <div className="flex justify-between text-xs text-muted">
            <span>{formatBytes(gpu.vram_used_bytes)} used</span>
            <span>{formatBytes(gpu.vram_total_bytes - gpu.vram_used_bytes)} free</span>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted px-0.5">
          <HardDrive size={11} className="inline mr-1 opacity-50" />
          Shared system RAM — no dedicated VRAM on this GPU
        </p>
      )}
    </div>
  );
}

export function GPU() {
  const { data } = useGpuStats();

  if (!data) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold text-primary">GPU</h1>
        <div className="text-muted text-sm">Loading GPU data…</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary">GPU</h1>
        <span className="text-xs text-muted">{data.gpus.length} device{data.gpus.length !== 1 ? "s" : ""} detected</span>
      </div>

      {data.gpus.length === 0 ? (
        <div className="glass p-8 flex flex-col items-center justify-center gap-3 text-center">
          <Monitor size={36} className="text-muted" />
          {data.platform_note ? (
            <>
              <p className="text-sm font-medium text-secondary">GPU monitoring not available</p>
              <p className="text-xs text-muted max-w-sm">{data.platform_note}</p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-secondary">No GPU detected</p>
              <p className="text-xs text-muted max-w-sm">
                No DRM devices found under <code className="px-1 rounded" style={{ background: "rgb(var(--bg-hover))" }}>/sys/class/drm</code>.
                NVIDIA proprietary drivers may not expose sysfs entries — try enabling the{" "}
                <code className="px-1 rounded" style={{ background: "rgb(var(--bg-hover))" }}>nvidia</code> feature flag.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {data.gpus.map((gpu) => <GpuCard key={gpu.index} gpu={gpu} />)}
        </div>
      )}
    </div>
  );
}
