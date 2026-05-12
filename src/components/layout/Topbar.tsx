import { useSystemInfo } from "@/hooks/useSystemStats";
import { useStatsStore } from "@/store/useStatsStore";
import { formatUptime, getUsageColor, getUsageClass, clampPct } from "@/lib/utils";
import { Monitor, Clock } from "lucide-react";

function MiniStat({ label, pct }: { label: string; pct: number }) {
  const color = getUsageColor(pct);
  return (
    <div className="flex items-center gap-2 shrink-0">
      <span className="text-token-xs text-muted">{label}</span>
      <div className="flex items-center gap-1.5">
        <div className="w-14 h-1.5 rounded-full overflow-hidden" style={{ background: "rgb(var(--bg-hover))" }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${clampPct(pct)}%`, background: color }} />
        </div>
        <span className={`text-token-xs font-medium tabular-nums w-9 ${getUsageClass(pct)}`}>
          {pct.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

export function Topbar() {
  const cpu    = useStatsStore((s) => s.cpu);
  const mem    = useStatsStore((s) => s.mem);
  const sysInfo = useSystemInfo();

  return (
    <header
      className="flex items-center justify-between px-4 shrink-0 border-b border-default"
      style={{ height: "var(--topbar-h)", background: "rgb(var(--bg-secondary))" }}
    >
      {/* Left: OS / host info */}
      <div className="flex items-center gap-2 min-w-0">
        {sysInfo && (
          <>
            <div className="flex items-center gap-1.5 text-token-xs text-muted shrink-0">
              <Monitor size={12} style={{ color: "rgb(var(--accent))", opacity: 0.8 }} />
              <span className="text-primary font-medium">{sysInfo.hostname}</span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline">{sysInfo.os_name}</span>
              {sysInfo.kernel_version && (
                <span className="hidden md:inline text-muted">
                  {sysInfo.kernel_version}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-token-xs text-muted ml-2 max-sm:hidden">
              <Clock size={10} />
              <span>{formatUptime(sysInfo.uptime_seconds)}</span>
            </div>
          </>
        )}
      </div>

      {/* Right: live mini stats */}
      <div className="flex items-center gap-4 shrink-0">
        {cpu && <MiniStat label="CPU" pct={cpu.usage_total} />}
        {mem && <MiniStat label="RAM" pct={mem.usage_percent} />}
      </div>
    </header>
  );
}
