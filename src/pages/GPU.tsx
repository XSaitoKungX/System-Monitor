import { Monitor, Thermometer, Zap, HardDrive, Activity, Wind, Cpu } from "lucide-react";
import { useGpuStats } from "@/hooks/useSystemStats";
import { formatBytes, getUsageColor, clampPct } from "@/lib/utils";
import { GaugeChart } from "@/components/charts/GaugeChart";
import type { GpuInfo } from "@/types";

const VENDOR_STYLE: Record<string, { bg: string; color: string }> = {
  NVIDIA: { bg: "rgb(118 185 0 / 0.14)", color: "rgb(130 200 0)" },
  AMD:    { bg: "rgb(237 60 60 / 0.14)", color: "rgb(240 100 100)" },
  Intel:  { bg: "rgb(0 130 200 / 0.14)", color: "rgb(80 165 228)" },
};

function VendorBadge({ vendor }: { vendor: string }) {
  const s = VENDOR_STYLE[vendor] ?? { bg: "rgb(var(--bg-elevated))", color: "rgb(var(--text-secondary))" };
  return (
    <span className="badge font-semibold" style={{ background: s.bg, color: s.color }}>{vendor}</span>
  );
}

function StatTile({
  icon, label, value, color,
}: { icon: React.ReactNode; label: string; value: string; color?: string }) {
  return (
    <div className="stat-tile">
      <span className="text-token-xs text-muted flex items-center gap-1.5">{icon} {label}</span>
      <span className="text-token-lg font-bold" style={{ color: color ?? "rgb(var(--text-primary))" }}>
        {value}
      </span>
    </div>
  );
}

function GpuCard({ gpu }: { gpu: GpuInfo }) {
  const vramPct = gpu.vram_usage_percent;
  const hasVram = gpu.vram_total_bytes > 0;
  const tempColor = gpu.temperature != null
    ? gpu.temperature >= 85 ? "rgb(var(--danger))" : gpu.temperature >= 70 ? "rgb(var(--warning))" : "rgb(var(--success))"
    : "rgb(var(--text-muted))";

  return (
    <div className="glass-card flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl shrink-0" style={{ background: "rgb(var(--accent)/0.1)" }}>
            <Monitor size={16} style={{ color: "rgb(var(--accent))" }} />
          </div>
          <div className="min-w-0">
            <p className="text-token-sm font-semibold text-primary truncate">{gpu.name}</p>
            <p className="text-token-xs text-muted mt-0.5">
              Driver: <span className="font-mono">{gpu.driver}</span>
            </p>
          </div>
        </div>
        <VendorBadge vendor={gpu.vendor} />
      </div>

      {/* Usage gauge + stat grid */}
      <div className="flex items-center gap-5">
        <div className="flex flex-col items-center gap-1 shrink-0">
          <GaugeChart value={gpu.gpu_usage_percent} size={100} sublabel="GPU" />
          <span className="text-token-xs text-muted">Load</span>
        </div>

        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-card">
          <StatTile icon={<Thermometer size={12} />} label="Temperature"
            value={gpu.temperature != null ? `${gpu.temperature.toFixed(0)}°C` : "N/A"}
            color={tempColor} />
          <StatTile icon={<Zap size={12} />} label="Power"
            value={gpu.power_watts != null
              ? gpu.power_limit_watts != null
                ? `${gpu.power_watts.toFixed(0)}/${gpu.power_limit_watts.toFixed(0)}W`
                : `${gpu.power_watts.toFixed(1)}W`
              : "N/A"} />
          <StatTile icon={<Wind size={12} />} label="Fan"
            value={gpu.fan_speed_percent != null
              ? gpu.fan_rpm != null ? `${gpu.fan_speed_percent}% · ${gpu.fan_rpm}rpm` : `${gpu.fan_speed_percent}%`
              : "N/A"} />
          <StatTile icon={<Cpu size={12} />} label="Core Clk"
            value={gpu.freq_mhz != null ? `${gpu.freq_mhz} MHz` : "N/A"} />
          <StatTile icon={<Activity size={12} />} label="Mem Clk"
            value={gpu.mem_freq_mhz != null ? `${gpu.mem_freq_mhz} MHz` : "N/A"} />
          {(gpu.encoder_percent != null || gpu.decoder_percent != null) && (
            <StatTile icon={<Activity size={12} />} label="Enc/Dec"
              value={`${gpu.encoder_percent ?? 0}% / ${gpu.decoder_percent ?? 0}%`} />
          )}
        </div>
      </div>

      {/* VRAM bar */}
      {hasVram && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-token-xs">
            <span className="text-muted flex items-center gap-1.5">
              <HardDrive size={11} /> VRAM
            </span>
            <span style={{ color: getUsageColor(vramPct) }}>{vramPct.toFixed(1)}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill"
              style={{ width: `${clampPct(vramPct)}%`, background: getUsageColor(vramPct) }} />
          </div>
          <div className="flex justify-between text-token-xs text-muted">
            <span>{formatBytes(gpu.vram_used_bytes)} used</span>
            <span>{formatBytes(gpu.vram_total_bytes)} total</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function GPU() {
  const { data } = useGpuStats();

  if (!data) return (
    <div className="flex items-center justify-center h-full">
      <span className="text-muted text-token-sm animate-pulse-dot">Loading GPU data…</span>
    </div>
  );

  return (
    <div className="page-layout">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-token-xl font-bold text-primary">GPU</h1>
          <p className="text-token-xs text-muted mt-0.5">
            {data.gpus.length} device{data.gpus.length !== 1 ? "s" : ""} detected
          </p>
        </div>
      </div>

      {data.gpus.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-14 gap-3 text-center">
          <Monitor size={34} className="text-muted" />
          <p className="text-token-sm font-medium text-secondary">
            {data.platform_note ? "GPU monitoring not available" : "No GPU detected"}
          </p>
          <p className="text-token-xs text-muted max-w-sm">
            {data.platform_note ?? (
              <>
                No DRM devices found under{" "}
                <code className="px-1 py-0.5 rounded text-token-xs"
                  style={{ background: "rgb(var(--bg-elevated))" }}>/sys/class/drm</code>.
              </>
            )}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-card">
          {data.gpus.map((gpu) => <GpuCard key={gpu.index} gpu={gpu} />)}
        </div>
      )}
    </div>
  );
}
