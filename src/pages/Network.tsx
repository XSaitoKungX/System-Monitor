import { useMemo, useState } from "react";
import { useNetworkStats } from "@/hooks/useSystemStats";
import { useAppStore } from "@/store/useAppStore";
import { LineChart } from "@/components/charts/LineChart";
import { formatBytes, formatBytesPerSec } from "@/lib/utils";
import {
  ArrowDown, ArrowUp, Wifi, Network as NetworkIcon,
  ChevronDown, ChevronUp, Gauge, AlertCircle,
} from "lucide-react";

function TypeBadge({ type }: { type: string }) {
  if (type === "wifi")
    return <span className="badge" style={{ background: "rgb(var(--success)/0.12)", color: "rgb(var(--success))" }}>
      <Wifi size={10} /> WiFi
    </span>;
  if (type === "lan")
    return <span className="badge" style={{ background: "rgb(var(--info)/0.12)", color: "rgb(var(--info))" }}>
      <NetworkIcon size={10} /> LAN
    </span>;
  return null;
}

function bwFmt(bytes: number): string {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB/s`;
  if (bytes >= 1_048_576)     return `${(bytes / 1_048_576).toFixed(1)} MB/s`;
  if (bytes >= 1_024)         return `${(bytes / 1_024).toFixed(0)} KB/s`;
  return `${bytes} B/s`;
}

export function Network() {
  const { data, rxHistory, txHistory } = useNetworkStats();
  const { setCurrentPage } = useAppStore();
  const [showOthers, setShowOthers] = useState(false);

  const chartData = useMemo(
    () => rxHistory.map((rx, i) => ({ t: i, rx, tx: txHistory[i] ?? 0 })),
    [rxHistory, txHistory]
  );
  const maxVal = Math.max(...rxHistory, ...txHistory, 1024);

  const primary = useMemo(() => data?.interfaces.find((i) => i.is_primary) ?? null, [data]);
  const others   = useMemo(() => data?.interfaces.filter((i) => !i.is_primary) ?? [],  [data]);

  if (!data) return (
    <div className="flex items-center justify-center h-full">
      <span className="text-muted text-token-sm animate-pulse-dot">Loading network data…</span>
    </div>
  );

  return (
    <div className="page-layout">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-token-xl font-bold text-primary">Network</h1>
          {primary && <TypeBadge type={primary.iface_type} />}
          {primary && <span className="text-token-xs text-muted">{primary.name}</span>}
        </div>
        <button
          onClick={() => setCurrentPage("speedtest")}
          className="flex items-center gap-1.5 text-token-xs px-3 py-1.5 rounded-lg border transition-colors"
          style={{ borderColor: "rgb(var(--accent)/0.4)", color: "rgb(var(--accent))" }}
        >
          <Gauge size={12} /> Speedtest
        </button>
      </div>

      {/* DL / UL hero cards */}
      <div className="grid grid-cols-2 gap-card">
        <div className="glass-card flex items-center gap-4">
          <div className="p-3 rounded-xl shrink-0" style={{ background: "rgb(var(--success)/0.12)" }}>
            <ArrowDown size={20} style={{ color: "rgb(var(--success))" }} />
          </div>
          <div>
            <p className="text-token-xs text-muted">Download</p>
            <p className="text-token-2xl font-bold text-primary tabular-nums">
              {formatBytesPerSec(data.primary_rx_per_sec)}
            </p>
            {primary && (
              <p className="text-token-xs text-muted mt-0.5">
                ↓ {formatBytes(primary.received_bytes)} total
              </p>
            )}
          </div>
        </div>
        <div className="glass-card flex items-center gap-4">
          <div className="p-3 rounded-xl shrink-0" style={{ background: "rgb(var(--accent)/0.12)" }}>
            <ArrowUp size={20} style={{ color: "rgb(var(--accent))" }} />
          </div>
          <div>
            <p className="text-token-xs text-muted">Upload</p>
            <p className="text-token-2xl font-bold text-primary tabular-nums">
              {formatBytesPerSec(data.primary_tx_per_sec)}
            </p>
            {primary && (
              <p className="text-token-xs text-muted mt-0.5">
                ↑ {formatBytes(primary.transmitted_bytes)} total
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Primary interface detail */}
      {primary && (
        <div className="glass-card flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-token-sm font-semibold text-primary">{primary.name}</span>
              <TypeBadge type={primary.iface_type} />
              <span className="badge" style={{ background: "rgb(var(--success)/0.1)", color: "rgb(var(--success))" }}>
                Connected
              </span>
            </div>
            <span className="text-token-xs text-muted font-mono">{primary.mac_address}</span>
          </div>

          <div className="flex gap-1.5 flex-wrap">
            {primary.ip_address.map((ip) => (
              <span key={ip} className="badge font-mono"
                style={{ background: "rgb(var(--bg-elevated))", color: "rgb(var(--text-secondary))" }}>
                {ip}
              </span>
            ))}
          </div>

          {(primary.errors_on_received > 0 || primary.errors_on_transmitted > 0) && (
            <div className="flex items-center gap-1.5 text-token-xs text-warning">
              <AlertCircle size={11} />
              Errors: {primary.errors_on_received} RX · {primary.errors_on_transmitted} TX
            </div>
          )}
        </div>
      )}

      {/* Bandwidth history chart */}
      <div className="glass-card">
        <p className="text-token-sm font-semibold text-primary mb-1">Bandwidth History</p>
        <LineChart
          data={chartData}
          lines={[
            { key: "rx", color: "rgb(var(--success))", name: "Download" },
            { key: "tx", color: "rgb(var(--accent))", name: "Upload" },
          ]}
          height={150}
          domain={[0, maxVal]}
          tickFormatter={bwFmt}
          tooltipFormatter={(v) => formatBytesPerSec(v)}
        />
      </div>

      {/* Other interfaces */}
      {others.length > 0 && (
        <div className="glass overflow-hidden">
          <button
            onClick={() => setShowOthers((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-token-sm text-secondary hover:text-primary transition-colors"
          >
            <span className="flex items-center gap-2">
              <NetworkIcon size={13} />
              Other interfaces ({others.length})
            </span>
            {showOthers ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          {showOthers && (
            <div className="border-t border-default divide-y" style={{ borderColor: "rgb(var(--border)/0.35)" }}>
              {others.map((iface) => (
                <div key={iface.name} className="px-4 py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-token-xs text-primary truncate">{iface.name}</span>
                    <TypeBadge type={iface.iface_type} />
                  </div>
                  <div className="flex items-center gap-4 text-token-xs shrink-0">
                    <span className="flex items-center gap-1 tabular-nums" style={{ color: "rgb(var(--success))" }}>
                      <ArrowDown size={10} /> {formatBytesPerSec(iface.received_bytes_per_sec)}
                    </span>
                    <span className="flex items-center gap-1 tabular-nums" style={{ color: "rgb(var(--accent))" }}>
                      <ArrowUp size={10} /> {formatBytesPerSec(iface.transmitted_bytes_per_sec)}
                    </span>
                    <span className="text-muted font-mono hidden sm:block">{iface.ip_address[0] ?? "—"}</span>
                    {(iface.errors_on_received > 0 || iface.errors_on_transmitted > 0) && (
                      <span title="Interface has errors">
                        <AlertCircle size={11} className="text-warning" />
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
