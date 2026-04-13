import { useSystemInfo } from "@/hooks/useSystemStats";
import { useStatsStore } from "@/store/useStatsStore";
import { formatUptime, getUsageClass } from "@/lib/utils";
import { Circle } from "lucide-react";

export function Topbar() {
  const cpu = useStatsStore((s) => s.cpu);
  const mem = useStatsStore((s) => s.mem);
  const sysInfo = useSystemInfo();

  return (
    <header
      className="flex items-center justify-between px-4 h-11 border-b border-default shrink-0"
      style={{ background: "rgb(var(--bg-secondary))" }}
    >
      <div className="flex items-center gap-1 text-xs text-muted">
        <span>{sysInfo?.os_name ?? "—"}</span>
        {sysInfo?.os_version && <span>· {sysInfo.os_version}</span>}
        {sysInfo?.hostname && <span>· {sysInfo.hostname}</span>}
      </div>

      <div className="flex items-center gap-4 text-xs">
        {cpu && (
          <div className="flex items-center gap-1.5">
            <Circle size={8} className={getUsageClass(cpu.usage_total)} fill="currentColor" />
            <span className="text-muted">CPU</span>
            <span className={`font-medium ${getUsageClass(cpu.usage_total)}`}>
              {cpu.usage_total.toFixed(1)}%
            </span>
          </div>
        )}
        {mem && (
          <div className="flex items-center gap-1.5">
            <Circle size={8} className={getUsageClass(mem.usage_percent)} fill="currentColor" />
            <span className="text-muted">RAM</span>
            <span className={`font-medium ${getUsageClass(mem.usage_percent)}`}>
              {mem.usage_percent.toFixed(1)}%
            </span>
          </div>
        )}
        {sysInfo && (
          <div className="text-muted hidden sm:block">
            Up: {formatUptime(sysInfo.uptime_seconds)}
          </div>
        )}
      </div>
    </header>
  );
}
