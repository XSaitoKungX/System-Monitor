import { useCpuStats, useMemoryStats, useDiskStats, useNetworkStats, useSystemInfo } from "@/hooks/useSystemStats";
import { GaugeChart } from "@/components/charts/GaugeChart";
import { SparkLine } from "@/components/charts/SparkLine";
import { formatBytes, formatBytesPerSec, formatUptime, getUsageClass } from "@/lib/utils";
import { Cpu, MemoryStick, HardDrive, Network, Server, Clock } from "lucide-react";
import { clsx } from "clsx";

function StatCard({
  icon,
  title,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="glass flex items-center gap-3 p-card">
      <div
        className="rounded-lg shrink-0 p-2"
        style={{ background: `${color}1a`, color }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-token-xs text-muted mb-0.5">{title}</p>
        <p className="text-token-lg font-semibold text-primary leading-tight">{value}</p>
        {sub && <p className="text-token-xs text-muted truncate">{sub}</p>}
      </div>
    </div>
  );
}

function HealthScore({ cpu, mem }: { cpu: number; mem: number }) {
  const score = Math.round(100 - (cpu * 0.5 + mem * 0.5));
  const cls = score >= 80 ? "text-success" : score >= 50 ? "text-warning" : "text-danger";
  return (
    <div className="glass p-card">
      <p className="text-token-xs text-muted mb-1">System Health</p>
      <p className={clsx("text-token-4xl font-bold", cls)}>
        {score}
        <span className="text-token-base font-normal text-muted">/100</span>
      </p>
    </div>
  );
}

export function Dashboard() {
  const { data: cpu, history: cpuHistory } = useCpuStats();
  const { data: mem, history: memHistory } = useMemoryStats();
  const { data: disk } = useDiskStats();
  const { data: net } = useNetworkStats();
  const sysInfo = useSystemInfo();

  const totalDisk = disk?.disks.reduce((a, d) => a + d.total_bytes, 0) ?? 0;
  const usedDisk = disk?.disks.reduce((a, d) => a + d.used_bytes, 0) ?? 0;

  return (
    <div className="page-layout">
      <h1 className="text-token-xl font-bold text-primary">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-card">
        <StatCard
          icon={<Cpu size={18} />}
          title="CPU Usage"
          value={cpu ? `${cpu.usage_total.toFixed(1)}%` : "—"}
          sub={cpu?.brand}
          color="rgb(var(--accent))"
        />
        <StatCard
          icon={<MemoryStick size={18} />}
          title="Memory"
          value={mem ? `${mem.usage_percent.toFixed(1)}%` : "—"}
          sub={mem ? `${formatBytes(mem.used_bytes)} / ${formatBytes(mem.total_bytes)}` : undefined}
          color="rgb(var(--success))"
        />
        <StatCard
          icon={<HardDrive size={18} />}
          title="Disk"
          value={totalDisk > 0 ? `${((usedDisk / totalDisk) * 100).toFixed(1)}%` : "—"}
          sub={totalDisk > 0 ? `${formatBytes(usedDisk)} / ${formatBytes(totalDisk)}` : undefined}
          color="rgb(var(--warning))"
        />
        <StatCard
          icon={<Network size={18} />}
          title="Network"
          value={net ? formatBytesPerSec(net.total_received_per_sec + net.total_transmitted_per_sec) : "—"}
          sub={net ? `↓ ${formatBytesPerSec(net.total_received_per_sec)} ↑ ${formatBytesPerSec(net.total_transmitted_per_sec)}` : undefined}
          color="rgb(var(--info))"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-card">
        {sysInfo && (
          <>
            <StatCard icon={<Server size={18} />} title="OS" value={sysInfo.os_name} sub={sysInfo.os_version} color="rgb(var(--text-muted))" />
            <StatCard icon={<Clock size={18} />} title="Uptime" value={formatUptime(sysInfo.uptime_seconds)} sub={sysInfo.hostname} color="rgb(var(--text-muted))" />
          </>
        )}
        {cpu && <HealthScore cpu={cpu.usage_total} mem={mem?.usage_percent ?? 0} />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-card">
        <div className="glass p-card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-token-sm font-medium text-primary">CPU History</p>
            {cpu && (
              <span className={clsx("text-token-sm font-semibold", getUsageClass(cpu.usage_total))}>
                {cpu.usage_total.toFixed(1)}%
              </span>
            )}
          </div>
          <SparkLine data={cpuHistory} color="rgb(var(--accent))" height={80} showTooltip />
        </div>
        <div className="glass p-card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-token-sm font-medium text-primary">Memory History</p>
            {mem && (
              <span className={clsx("text-token-sm font-semibold", getUsageClass(mem.usage_percent))}>
                {mem.usage_percent.toFixed(1)}%
              </span>
            )}
          </div>
          <SparkLine data={memHistory} color="rgb(var(--success))" height={80} showTooltip />
        </div>
      </div>

      {cpu && (
        <div className="glass p-card">
          <p className="text-token-sm font-medium text-primary mb-3">CPU Cores</p>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {cpu.usage_per_core.map((usage, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <GaugeChart value={usage} size={56} unit="%" />
                <span className="text-token-xs text-muted">C{i}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
