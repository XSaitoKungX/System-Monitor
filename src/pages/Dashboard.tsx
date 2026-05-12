import { useCpuStats, useMemoryStats, useDiskStats, useNetworkStats, useSystemInfo } from "@/hooks/useSystemStats";
import { SparkLine } from "@/components/charts/SparkLine";
import { formatBytes, formatBytesPerSec, formatUptime, getUsageColor, getUsageClass, clampPct } from "@/lib/utils";
import { Cpu, MemoryStick, HardDrive, Network, Server, Clock, ArrowDown, ArrowUp, User } from "lucide-react";

function UsageCard({
  icon, title, value, sub, history, color, pct,
}: {
  icon: React.ReactNode; title: string; value: string;
  sub?: string; history?: number[]; color: string; pct?: number;
}) {
  return (
    <div className="glass-card flex flex-col gap-3 min-h-0">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg shrink-0" style={{ background: `${color}1a` }}>
          <span style={{ color }}>{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-token-xs text-muted">{title}</p>
          <p className="text-token-lg font-bold text-primary leading-tight">{value}</p>
          {sub && <p className="text-token-xs text-muted truncate mt-0.5">{sub}</p>}
        </div>
        {pct !== undefined && (
          <span className="text-token-xs font-semibold tabular-nums shrink-0"
            style={{ color: getUsageColor(pct) }}>
            {pct.toFixed(1)}%
          </span>
        )}
      </div>
      {pct !== undefined && (
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${clampPct(pct)}%`, background: color }} />
        </div>
      )}
      {history && history.length > 0 && (
        <SparkLine data={history} color={color} height={40} showTooltip />
      )}
    </div>
  );
}

function HealthScore({ cpu, mem, disk }: { cpu: number; mem: number; disk: number }) {
  const score = Math.round(100 - (cpu * 0.4 + mem * 0.35 + disk * 0.25));
  const color = score >= 80 ? "rgb(var(--success))" : score >= 50 ? "rgb(var(--warning))" : "rgb(var(--danger))";
  const label = score >= 80 ? "Healthy" : score >= 50 ? "Moderate" : "High Load";
  return (
    <div className="glass-card flex flex-col gap-2">
      <p className="text-token-xs text-muted uppercase tracking-wide">System Health</p>
      <div className="flex items-end gap-2">
        <span className="text-token-4xl font-bold" style={{ color, lineHeight: 1 }}>{score}</span>
        <span className="text-token-base text-muted mb-1">/100</span>
      </div>
      <span className="badge" style={{ background: `${color}1a`, color }}>{label}</span>
      <div className="progress-track mt-1">
        <div className="progress-fill" style={{ width: `${score}%`, background: color }} />
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-default last:border-0">
      <span className="text-muted shrink-0">{icon}</span>
      <span className="text-token-xs text-muted w-20 shrink-0">{label}</span>
      <span className="text-token-xs text-primary font-medium truncate">{value}</span>
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
  const usedDisk  = disk?.disks.reduce((a, d) => a + d.used_bytes,  0) ?? 0;
  const diskPct   = totalDisk > 0 ? (usedDisk / totalDisk) * 100 : 0;

  return (
    <div className="page-layout">
      {/* Page title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-token-xl font-bold text-primary">Dashboard</h1>
          <p className="text-token-xs text-muted mt-0.5">Live system overview</p>
        </div>
        {sysInfo && (
          <span className="badge text-token-xs"
            style={{ background: "rgb(var(--accent)/0.12)", color: "rgb(var(--accent))" }}>
            {sysInfo.os_name} {sysInfo.os_version}
          </span>
        )}
      </div>

      {/* 4-column stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-card">
        <UsageCard
          icon={<Cpu size={16} />} title="CPU"
          value={cpu ? `${cpu.usage_total.toFixed(1)}%` : "—"}
          sub={cpu?.brand}
          pct={cpu?.usage_total} history={cpuHistory}
          color="rgb(var(--accent))"
        />
        <UsageCard
          icon={<MemoryStick size={16} />} title="Memory"
          value={mem ? formatBytes(mem.used_bytes) : "—"}
          sub={mem ? `of ${formatBytes(mem.total_bytes)}` : undefined}
          pct={mem?.usage_percent} history={memHistory}
          color="rgb(var(--success))"
        />
        <UsageCard
          icon={<HardDrive size={16} />} title="Disk"
          value={totalDisk > 0 ? formatBytes(usedDisk) : "—"}
          sub={totalDisk > 0 ? `of ${formatBytes(totalDisk)}` : undefined}
          pct={diskPct > 0 ? diskPct : undefined}
          color="rgb(var(--warning))"
        />
        <UsageCard
          icon={<Network size={16} />} title="Network"
          value={net ? formatBytesPerSec(net.primary_rx_per_sec + net.primary_tx_per_sec) : "—"}
          sub={net
            ? `↓ ${formatBytesPerSec(net.primary_rx_per_sec)}  ↑ ${formatBytesPerSec(net.primary_tx_per_sec)}`
            : undefined}
          color="rgb(var(--info))"
        />
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-card">
        {/* Health + sys info */}
        <div className="flex flex-col gap-card">
          {cpu && (
            <HealthScore
              cpu={cpu.usage_total}
              mem={mem?.usage_percent ?? 0}
              disk={diskPct}
            />
          )}
          {sysInfo && (
            <div className="glass-card">
              <p className="text-token-xs text-muted uppercase tracking-wide mb-2">System</p>
              <InfoRow icon={<Server size={11} />} label="Hostname" value={sysInfo.hostname} />
              <InfoRow icon={<Clock size={11} />} label="Uptime" value={formatUptime(sysInfo.uptime_seconds)} />
              <InfoRow icon={<User size={11} />} label="User" value={sysInfo.username} />
              <InfoRow icon={<Server size={11} />} label="Kernel" value={sysInfo.kernel_version} />
              <InfoRow icon={<Server size={11} />} label="Arch" value={sysInfo.cpu_arch} />
            </div>
          )}
        </div>

        {/* Network card */}
        <div className="glass-card md:col-span-2 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-token-sm font-semibold text-primary">Network</p>
            {net?.interfaces.find(i => i.is_primary) && (
              <span className="text-token-xs text-muted">
                {net.interfaces.find(i => i.is_primary)?.name}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-card">
            <div className="stat-tile">
              <span className="text-token-xs text-muted flex items-center gap-1.5">
                <ArrowDown size={11} style={{ color: "rgb(var(--success))" }} /> Download
              </span>
              <span className="text-token-xl font-bold text-primary">
                {net ? formatBytesPerSec(net.primary_rx_per_sec) : "—"}
              </span>
            </div>
            <div className="stat-tile">
              <span className="text-token-xs text-muted flex items-center gap-1.5">
                <ArrowUp size={11} style={{ color: "rgb(var(--accent))" }} /> Upload
              </span>
              <span className="text-token-xl font-bold text-primary">
                {net ? formatBytesPerSec(net.primary_tx_per_sec) : "—"}
              </span>
            </div>
          </div>
          {cpu && (
            <div className="mt-1">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-token-xs text-muted">CPU — {cpu.brand}</span>
                <span className={`text-token-xs font-semibold ${getUsageClass(cpu.usage_total)}`}>
                  {cpu.usage_total.toFixed(1)}%
                </span>
              </div>
              <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.min(cpu.usage_per_core.length, 16)}, 1fr)` }}>
                {cpu.usage_per_core.slice(0, 16).map((u, i) => (
                  <div key={i} title={`Core ${i}: ${u.toFixed(1)}%`}
                    className="rounded-sm transition-all duration-500"
                    style={{
                      height: 20,
                      background: getUsageColor(u),
                      opacity: 0.2 + (u / 100) * 0.8,
                    }} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Disk volumes */}
      {disk && disk.disks.filter(d => d.total_bytes > 0).length > 0 && (
        <div className="glass-card">
          <p className="text-token-sm font-semibold text-primary mb-3">Disk Volumes</p>
          <div className="flex flex-col gap-2">
            {disk.disks.filter(d => d.total_bytes > 0).map((d, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-token-xs text-muted w-28 truncate shrink-0">{d.mount_point}</span>
                <div className="flex-1 progress-track">
                  <div className="progress-fill"
                    style={{ width: `${clampPct(d.usage_percent)}%`, background: getUsageColor(d.usage_percent) }} />
                </div>
                <span className="text-token-xs text-secondary w-10 text-right tabular-nums shrink-0">
                  {d.usage_percent.toFixed(0)}%
                </span>
                <span className="text-token-xs text-muted w-20 text-right tabular-nums shrink-0">
                  {formatBytes(d.used_bytes)} / {formatBytes(d.total_bytes)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
