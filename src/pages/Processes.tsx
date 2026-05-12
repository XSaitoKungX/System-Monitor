import { useState, useMemo } from "react";
import { useProcesses } from "@/hooks/useSystemStats";
import { formatBytes, formatRuntime, getUsageColor } from "@/lib/utils";
import { Search, RefreshCw, XCircle, ChevronUp, ChevronDown, AlertTriangle } from "lucide-react";

type SortKey = "cpu_usage" | "memory_bytes" | "name" | "pid" | "run_time_secs";
type SortDir = "asc" | "desc";

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  Running:  { bg: "rgb(var(--success)/0.12)", color: "rgb(var(--success))" },
  Sleeping: { bg: "rgb(var(--bg-elevated))",  color: "rgb(var(--text-muted))" },
  Idle:     { bg: "rgb(var(--bg-elevated))",  color: "rgb(var(--text-muted))" },
  Zombie:   { bg: "rgb(var(--danger)/0.12)",  color: "rgb(var(--danger))" },
  Stopped:  { bg: "rgb(var(--warning)/0.12)", color: "rgb(var(--warning))" },
  Dead:     { bg: "rgb(var(--danger)/0.12)",  color: "rgb(var(--danger))" },
};

export function Processes() {
  const { data, loading, killProcess, refresh } = useProcesses();
  const [search,     setSearch]     = useState("");
  const [sortKey,    setSortKey]    = useState<SortKey>("cpu_usage");
  const [sortDir,    setSortDir]    = useState<SortDir>("desc");
  const [confirmKill, setConfirmKill] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return data
      .filter((p) => p.name.toLowerCase().includes(q) || String(p.pid).includes(q))
      .sort((a, b) => {
        const va = a[sortKey] as number | string;
        const vb = b[sortKey] as number | string;
        const cmp = typeof va === "string" ? va.localeCompare(vb as string) : (va as number) - (vb as number);
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [data, search, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <span className="w-3" />;
    return sortDir === "asc" ? <ChevronUp size={11} /> : <ChevronDown size={11} />;
  }

  async function handleKill(pid: number) {
    if (confirmKill === pid) {
      await killProcess(pid);
      setConfirmKill(null);
    } else {
      setConfirmKill(pid);
      setTimeout(() => setConfirmKill(null), 3000);
    }
  }

  const TH = ({ k, w, children }: { k: SortKey; w?: number; children: React.ReactNode }) => (
    <th
      onClick={() => toggleSort(k)}
      className="text-left text-token-xs text-muted font-medium px-3 py-2 cursor-pointer select-none hover:text-secondary transition-colors whitespace-nowrap"
      style={w ? { width: w } : undefined}
    >
      <span className="flex items-center gap-1">{children} <SortIcon k={k} /></span>
    </th>
  );

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-token-xl font-bold text-primary">Processes</h1>
          <p className="text-token-xs text-muted mt-0.5">
            {filtered.length} shown · {data.length} total
          </p>
        </div>
        <button
          onClick={refresh} disabled={loading}
          className="icon-btn"
          title="Refresh processes"
        >
          <RefreshCw size={14} className={loading ? "animate-spin-slow" : ""} />
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by name or PID…"
          className="w-full pl-8 pr-3 py-1.5 text-token-sm rounded-lg border border-default text-primary placeholder:text-muted focus:outline-none transition-colors"
          style={{ background: "rgb(var(--bg-secondary))" }}
          onFocus={(e) => e.currentTarget.style.borderColor = "rgb(var(--accent)/0.6)"}
          onBlur={(e)  => e.currentTarget.style.borderColor = ""}
        />
      </div>

      {/* Table */}
      <div className="glass flex-1 overflow-hidden flex flex-col min-h-0">
        {/* Sticky header */}
        <table className="w-full shrink-0" style={{ tableLayout: "fixed" }}>
          <thead className="border-b border-default" style={{ background: "rgb(var(--bg-secondary))" }}>
            <tr>
              <TH k="pid" w={60}>PID</TH>
              <TH k="name">Name</TH>
              <TH k="cpu_usage" w={80}>CPU %</TH>
              <TH k="memory_bytes" w={88}>Mem</TH>
              <TH k="run_time_secs" w={72}>Time</TH>
              <th className="text-left text-token-xs text-muted font-medium px-3 py-2" style={{ width: 80 }}>Status</th>
              <th style={{ width: 44 }} />
            </tr>
          </thead>
        </table>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 min-h-0">
          <table className="w-full" style={{ tableLayout: "fixed" }}>
            <tbody>
              {filtered.map((p) => {
                const isKillTarget = confirmKill === p.pid;
                const statusStyle = STATUS_STYLE[p.status] ?? STATUS_STYLE.Sleeping;
                return (
                  <tr
                    key={p.pid}
                    className="transition-colors"
                    style={{
                      borderBottom: "1px solid rgb(var(--border)/0.25)",
                      background: isKillTarget ? "rgb(var(--danger)/0.06)" : undefined,
                    }}
                    onMouseEnter={(e) => { if (!isKillTarget) e.currentTarget.style.background = "rgb(var(--bg-hover))"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = isKillTarget ? "rgb(var(--danger)/0.06)" : ""; }}
                  >
                    <td className="text-token-xs text-muted font-mono px-3 py-1.5" style={{ width: 60 }}>
                      {p.pid}
                    </td>
                    <td className="px-3 py-1.5">
                      <span className="text-token-xs text-primary truncate block" title={p.cmd[0] ?? p.name}>
                        {p.name}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 tabular-nums" style={{ width: 80 }}>
                      <span className="text-token-xs font-semibold" style={{ color: getUsageColor(p.cpu_usage) }}>
                        {p.cpu_usage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-token-xs text-secondary px-3 py-1.5 tabular-nums" style={{ width: 88 }}>
                      {formatBytes(p.memory_bytes)}
                    </td>
                    <td className="text-token-xs text-muted px-3 py-1.5 tabular-nums" style={{ width: 72 }}>
                      {formatRuntime(p.run_time_secs)}
                    </td>
                    <td className="px-3 py-1.5" style={{ width: 80 }}>
                      <span className="badge text-token-xs" style={{ background: statusStyle.bg, color: statusStyle.color }}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-center" style={{ width: 44 }}>
                      <button
                        onClick={() => handleKill(p.pid)}
                        className="icon-btn mx-auto"
                        style={{ color: isKillTarget ? "rgb(var(--danger))" : undefined }}
                        title={isKillTarget ? "Click again to confirm kill" : "Kill process"}
                      >
                        {isKillTarget
                          ? <AlertTriangle size={13} />
                          : <XCircle size={13} />}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-token-xs text-muted">
                    No processes match "{search}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
