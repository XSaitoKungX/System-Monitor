import { useDiskStats } from "@/hooks/useSystemStats";
import { formatBytes, formatBytesPerSec, getUsageColor, getUsageClass } from "@/lib/utils";
import { HardDrive, ArrowDown, ArrowUp, Usb } from "lucide-react";
import type { DiskInfo } from "@/types";

function UsageRing({ pct }: { pct: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(pct, 100) / 100) * circ;
  const color = getUsageColor(pct);
  return (
    <div className="relative w-16 h-16 shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={r} fill="none" strokeWidth="6"
          style={{ stroke: "rgb(var(--bg-hover))" }} />
        <circle cx="32" cy="32" r={r} fill="none" strokeWidth="6"
          strokeLinecap="round"
          style={{
            stroke: color,
            strokeDasharray: `${dash} ${circ - dash}`,
            transition: "stroke-dasharray 0.4s ease",
          }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold" style={{ color }}>{pct.toFixed(0)}%</span>
      </div>
    </div>
  );
}

function DiskCard({ disk }: { disk: DiskInfo }) {
  const hasIo = disk.read_bytes_per_sec > 0 || disk.write_bytes_per_sec > 0;
  const displayName = disk.name && disk.name !== disk.mount_point ? disk.name : null;

  return (
    <div className="glass p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg shrink-0"
          style={{ background: disk.is_removable ? "rgb(var(--info)/0.12)" : "rgb(var(--warning)/0.12)" }}>
          {disk.is_removable
            ? <Usb size={16} style={{ color: "rgb(var(--info))" }} />
            : <HardDrive size={16} style={{ color: "rgb(var(--warning))" }} />
          }
        </div>
        <div className="flex-1 min-w-0">
          {displayName && (
            <p className="text-sm font-semibold text-primary truncate" title={disk.name}>{displayName}</p>
          )}
          {/* mount_point: truncate from start if too long */}
          <p className="text-xs text-muted truncate w-full" title={disk.mount_point}
            style={{ direction: "rtl", textAlign: "left", unicodeBidi: "plaintext" }}>
            {disk.mount_point}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs font-mono px-1.5 py-0.5 rounded"
              style={{ background: "rgb(var(--bg-hover))", color: "rgb(var(--text-muted))" }}>
              {disk.file_system}
            </span>
            {disk.is_removable && (
              <span className="text-xs px-1.5 py-0.5 rounded"
                style={{ background: "rgb(var(--info)/0.15)", color: "rgb(var(--info))" }}>
                Removable
              </span>
            )}
          </div>
        </div>
        <UsageRing pct={disk.usage_percent} />
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgb(var(--bg-hover))" }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(disk.usage_percent, 100)}%`, background: getUsageColor(disk.usage_percent) }} />
      </div>

      {/* Storage stats */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-muted">Total</p>
          <p className="font-semibold text-primary">{formatBytes(disk.total_bytes)}</p>
        </div>
        <div>
          <p className="text-muted">Used</p>
          <p className={`font-semibold ${getUsageClass(disk.usage_percent)}`}>{formatBytes(disk.used_bytes)}</p>
        </div>
        <div>
          <p className="text-muted">Free</p>
          <p className="font-semibold text-primary">{formatBytes(disk.available_bytes)}</p>
        </div>
      </div>

      {/* I/O stats */}
      {hasIo && (
        <div className="flex gap-4 pt-1 border-t" style={{ borderColor: "rgb(var(--border)/0.3)" }}>
          <div className="flex items-center gap-1.5 text-xs">
            <ArrowDown size={12} style={{ color: "rgb(var(--success))" }} />
            <span className="text-muted">Read</span>
            <span className="font-medium text-primary">{formatBytesPerSec(disk.read_bytes_per_sec)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <ArrowUp size={12} style={{ color: "rgb(var(--accent))" }} />
            <span className="text-muted">Write</span>
            <span className="font-medium text-primary">{formatBytesPerSec(disk.write_bytes_per_sec)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function Disk() {
  const { data } = useDiskStats();

  if (!data) {
    return <div className="text-muted text-sm">Loading disk data...</div>;
  }

  const realDisks = data.disks.filter((d) => d.total_bytes > 0);
  const virtualDisks = data.disks.filter((d) => d.total_bytes === 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary">Disk</h1>
        <span className="text-xs text-muted">{realDisks.length} volume{realDisks.length !== 1 ? "s" : ""}</span>
      </div>

      {data.disks.length === 0 && (
        <div className="glass p-6 text-center text-muted">No disks detected.</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {realDisks.map((disk, i) => <DiskCard key={i} disk={disk} />)}
      </div>

      {virtualDisks.length > 0 && (
        <details className="glass overflow-hidden">
          <summary className="px-4 py-3 text-sm text-muted cursor-pointer hover:text-secondary transition-colors list-none flex items-center justify-between">
            <span>Virtual / overlay mounts ({virtualDisks.length})</span>
            <span className="text-xs">▼</span>
          </summary>
          <div className="border-t divide-y" style={{ borderColor: "rgb(var(--border)/0.3)" }}>
            {virtualDisks.map((disk, i) => (
              <div key={i} className="px-4 py-2 flex items-center gap-3">
                <HardDrive size={13} className="text-muted shrink-0" />
                <span className="text-xs text-muted truncate flex-1 min-w-0" title={disk.mount_point}>
                  {disk.mount_point}
                </span>
                <span className="text-xs font-mono text-muted shrink-0">{disk.file_system}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
