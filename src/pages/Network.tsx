import { useMemo, useState } from "react";
import { useNetworkStats } from "@/hooks/useSystemStats";
import { useAppStore } from "@/store/useAppStore";
import { LineChart } from "@/components/charts/LineChart";
import { formatBytes, formatBytesPerSec } from "@/lib/utils";
import { ArrowDown, ArrowUp, Wifi, Network as NetworkIcon, ChevronDown, ChevronUp, Gauge, Circle } from "lucide-react";

function TypeBadge({ type }: { type: string }) {
  if (type === "wifi")
    return (
      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
        style={{ background: "rgb(var(--success)/0.15)", color: "rgb(var(--success))" }}>
        <Wifi size={11} /> WiFi
      </span>
    );
  if (type === "lan")
    return (
      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
        style={{ background: "rgb(var(--info)/0.15)", color: "rgb(var(--info))" }}>
        <NetworkIcon size={11} /> LAN
      </span>
    );
  return null;
}

function bwTickFormatter(bytes: number): string {
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
  const others = useMemo(() => data?.interfaces.filter((i) => !i.is_primary) ?? [], [data]);

  if (!data) return <div className="text-muted text-token-sm">Loading network data...</div>;

  return (
    <div className="page-layout">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-token-xl font-bold text-primary">Network</h1>
          {primary && <TypeBadge type={primary.iface_type} />}
          {primary && <span className="text-xs text-muted">{primary.name}</span>}
        </div>
        <button
          onClick={() => setCurrentPage("speedtest")}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors"
          style={{ borderColor: "rgb(var(--accent)/0.5)", color: "rgb(var(--accent))" }}
        >
          <Gauge size={13} />
          Speedtest
        </button>
      </div>

      {/* Primary download/upload */}
      <div className="grid grid-cols-2 gap-card">
        <div className="glass p-card flex items-center gap-3">
          <div className="rounded-xl p-2.5 shrink-0" style={{ background: "rgb(var(--success)/0.15)" }}>
            <ArrowDown size={20} style={{ color: "rgb(var(--success))" }} />
          </div>
          <div>
            <p className="text-token-xs text-muted">Download</p>
            <p className="text-token-xl font-bold text-primary">{formatBytesPerSec(data.primary_rx_per_sec)}</p>
            {primary && <p className="text-token-xs text-muted mt-0.5">via {primary.name}</p>}
          </div>
        </div>
        <div className="glass p-card flex items-center gap-3">
          <div className="rounded-xl p-2.5 shrink-0" style={{ background: "rgb(var(--accent)/0.15)" }}>
            <ArrowUp size={20} style={{ color: "rgb(var(--accent))" }} />
          </div>
          <div>
            <p className="text-token-xs text-muted">Upload</p>
            <p className="text-token-xl font-bold text-primary">{formatBytesPerSec(data.primary_tx_per_sec)}</p>
          </div>
        </div>
      </div>

      {/* Primary interface detail */}
      {primary && (
        <div className="glass p-card flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-token-sm font-semibold text-primary">{primary.name}</span>
              <TypeBadge type={primary.iface_type} />
              <span className="text-token-xs flex items-center gap-1 px-1.5 py-0.5 rounded"
                style={{ background: "rgb(var(--success)/0.12)", color: "rgb(var(--success))" }}>
                <Circle size={6} fill="currentColor" /> Connected
              </span>
            </div>
            <span className="text-token-xs text-muted font-mono shrink-0">{primary.mac_address}</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {primary.ip_address.map((ip) => (
              <span key={ip} className="text-token-xs font-mono px-2 py-0.5 rounded"
                style={{ background: "rgb(var(--bg-hover))", color: "rgb(var(--text-secondary))" }}>
                {ip}
              </span>
            ))}
          </div>
          <div className="text-token-xs flex gap-6 text-muted pt-2 border-t" style={{ borderColor: "rgb(var(--border)/0.3)" }}>
            <span>↓ Total: <span className="text-primary font-medium">{formatBytes(primary.received_bytes)}</span></span>
            <span>↑ Total: <span className="text-primary font-medium">{formatBytes(primary.transmitted_bytes)}</span></span>
          </div>
        </div>
      )}

      {/* Bandwidth history */}
      <div className="glass p-card">
        <p className="text-token-sm font-medium text-primary mb-3">Bandwidth History</p>
        <LineChart
          data={chartData}
          lines={[
            { key: "rx", color: "rgb(var(--success))", name: "Download" },
            { key: "tx", color: "rgb(var(--accent))", name: "Upload" },
          ]}
          height={160}
          domain={[0, maxVal]}
          tickFormatter={bwTickFormatter}
          tooltipFormatter={(v) => formatBytesPerSec(v)}
        />
      </div>

      {/* Other interfaces — collapsible */}
      {others.length > 0 && (
        <div className="glass overflow-hidden">
          <button
            onClick={() => setShowOthers((v) => !v)}
            className="w-full flex items-center justify-between text-token-sm text-secondary hover:text-primary transition-colors px-4 py-3"
          >
            <span>Other interfaces ({others.length})</span>
            {showOthers ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showOthers && (
            <div className="border-t divide-y" style={{ borderColor: "rgb(var(--border)/0.4)" }}>
              {others.map((iface) => (
                <div key={iface.name} className="px-4 py-2.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-token-sm text-primary truncate">{iface.name}</span>
                    <TypeBadge type={iface.iface_type} />
                  </div>
                  <div className="text-token-xs flex items-center gap-4 shrink-0">
                    <span className="flex items-center gap-1" style={{ color: "rgb(var(--success))" }}>
                      <ArrowDown size={11} /> {formatBytesPerSec(iface.received_bytes_per_sec)}
                    </span>
                    <span className="flex items-center gap-1" style={{ color: "rgb(var(--accent))" }}>
                      <ArrowUp size={11} /> {formatBytesPerSec(iface.transmitted_bytes_per_sec)}
                    </span>
                    <span className="text-muted font-mono">{iface.ip_address[0] ?? "—"}</span>
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
