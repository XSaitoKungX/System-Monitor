import { useState } from "react";
import { useDiskStats } from "@/hooks/useSystemStats";
import { formatBytes, formatBytesPerSec, getUsageColor, getUsageClass, clampPct } from "@/lib/utils";
import { HardDrive, ArrowDown, ArrowUp, Usb, ChevronDown, ChevronUp, Database } from "lucide-react";
import type { DiskInfo } from "@/types";

function UsageRing({ pct }: { pct: number }) {
  const r = 24, circ = 2 * Math.PI * r;
  const color = getUsageColor(pct);
  const dash = (clampPct(pct) / 100) * circ;
  return (
    <div className="relative w-14 h-14 shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill="none" strokeWidth="4.5" stroke="rgb(var(--bg-hover))" />
        <circle cx="28" cy="28" r={r} fill="none" strokeWidth="4.5"
          stroke={color} strokeLinecap="round"
          strokeDasharray={`${dash} ${circ - dash}`}
          style={{ transition: "stroke-dasharray 0.5s cubic-bezier(0.4,0,0.2,1)" }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-token-xs font-bold" style={{ color }}>{pct.toFixed(0)}%</span>
      </div>
    </div>
  );
}

function DiskTypeIcon({ disk }: { disk: DiskInfo }) {
  const color = disk.is_removable ? "rgb(var(--info))" : "rgb(var(--warning))";
  const bg    = disk.is_removable ? "rgb(var(--info)/0.12)" : "rgb(var(--warning)/0.12)";
  const Icon  = disk.is_removable ? Usb : HardDrive;
  return (
    <div className="p-2 rounded-lg shrink-0" style={{ background: bg }}>
      <Icon size={15} style={{ color }} />
    </div>
  );
}

function DiskCard({ disk }: { disk: DiskInfo }) {
  const hasIo = disk.read_bytes_per_sec > 0 || disk.write_bytes_per_sec > 0;
  const displayName = disk.name && disk.name !== disk.mount_point ? disk.name : disk.mount_point;

  return (
    <div className="glass-card flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <DiskTypeIcon disk={disk} />
        <div className="flex-1 min-w-0">
          <p className="text-token-sm font-semibold text-primary truncate" title={displayName}>
            {displayName}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="badge" style={{ background: "rgb(var(--bg-elevated))", color: "rgb(var(--text-muted))" }}>
              {disk.file_system}
            </span>
            {disk.disk_type && disk.disk_type !== "Unknown" && (
              <span className="badge" style={{ background: "rgb(var(--bg-elevated))", color: "rgb(var(--text-muted))" }}>
                {disk.disk_type}
              </span>
            )}
            {disk.is_removable && (
              <span className="badge" style={{ background: "rgb(var(--info)/0.12)", color: "rgb(var(--info))" }}>
                Removable
              </span>
            )}
          </div>
        </div>
        <UsageRing pct={disk.usage_percent} />
      </div>

      {/* Progress bar */}
      <div className="progress-track">
        <div className="progress-fill"
          style={{ width: `${clampPct(disk.usage_percent)}%`, background: getUsageColor(disk.usage_percent) }} />
      </div>

      {/* Storage stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Total", val: formatBytes(disk.total_bytes), cls: "text-primary" },
          { label: "Used",  val: formatBytes(disk.used_bytes),  cls: getUsageClass(disk.usage_percent) },
          { label: "Free",  val: formatBytes(disk.available_bytes), cls: "text-secondary" },
        ].map(({ label, val, cls }) => (
          <div key={label}>
            <p className="text-token-xs text-muted">{label}</p>
            <p className={`text-token-xs font-semibold ${cls}`}>{val}</p>
          </div>
        ))}
      </div>

      {/* I/O */}
      {hasIo && (
        <div className="flex items-center gap-4 pt-2 border-t border-default">
          <span className="flex items-center gap-1.5 text-token-xs">
            <ArrowDown size={11} style={{ color: "rgb(var(--success))" }} />
            <span className="text-muted">Read</span>
            <span className="font-semibold text-primary tabular-nums">{formatBytesPerSec(disk.read_bytes_per_sec)}</span>
          </span>
          <span className="flex items-center gap-1.5 text-token-xs">
            <ArrowUp size={11} style={{ color: "rgb(var(--accent))" }} />
            <span className="text-muted">Write</span>
            <span className="font-semibold text-primary tabular-nums">{formatBytesPerSec(disk.write_bytes_per_sec)}</span>
          </span>
        </div>
      )}
    </div>
  );
}

export function Disk() {
  const { data } = useDiskStats();
  const [showVirtual, setShowVirtual] = useState(false);

  if (!data) return (
    <div className="flex items-center justify-center h-full">
      <span className="text-muted text-token-sm animate-pulse-dot">Loading disk data…</span>
    </div>
  );

  const realDisks    = data.disks.filter((d) => d.total_bytes > 0);
  const virtualDisks = data.disks.filter((d) => d.total_bytes === 0);

  const totalSpace = realDisks.reduce((a, d) => a + d.total_bytes, 0);
  const usedSpace  = realDisks.reduce((a, d) => a + d.used_bytes,  0);

  return (
    <div className="page-layout">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-token-xl font-bold text-primary">Disk</h1>
          <p className="text-token-xs text-muted mt-0.5">
            {realDisks.length} volume{realDisks.length !== 1 ? "s" : ""}
            {totalSpace > 0 && ` · ${formatBytes(usedSpace)} / ${formatBytes(totalSpace)} used`}
          </p>
        </div>
      </div>

      {realDisks.length === 0 && (
        <div className="glass-card flex flex-col items-center justify-center py-12 gap-3 text-center">
          <Database size={32} className="text-muted" />
          <p className="text-token-sm text-muted">No disk volumes detected.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-card">
        {realDisks.map((disk, i) => <DiskCard key={i} disk={disk} />)}
      </div>

      {/* Virtual / overlay mounts */}
      {virtualDisks.length > 0 && (
        <div className="glass overflow-hidden">
          <button
            onClick={() => setShowVirtual((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-token-sm text-secondary hover:text-primary transition-colors"
          >
            <span className="flex items-center gap-2">
              <Database size={13} />
              Virtual / overlay mounts ({virtualDisks.length})
            </span>
            {showVirtual ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          {showVirtual && (
            <div className="border-t border-default divide-y" style={{ borderColor: "rgb(var(--border)/0.3)" }}>
              {virtualDisks.map((disk, i) => (
                <div key={i} className="px-4 py-2 flex items-center gap-3">
                  <HardDrive size={12} className="text-muted shrink-0" />
                  <span className="text-token-xs text-muted truncate flex-1 min-w-0" title={disk.mount_point}>
                    {disk.mount_point}
                  </span>
                  <span className="text-token-xs font-mono text-muted shrink-0">{disk.file_system}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
