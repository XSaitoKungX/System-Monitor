import { useState, useMemo } from "react";
import { useProcesses } from "@/hooks/useSystemStats";
import { formatBytes, getUsageClass } from "@/lib/utils";
import { Search, RefreshCw, XCircle, ChevronUp, ChevronDown } from "lucide-react";
import { clsx } from "clsx";

type SortKey = "cpu_usage" | "memory_bytes" | "name" | "pid";
type SortDir = "asc" | "desc";

export function Processes() {
  const { data, loading, killProcess, refresh } = useProcesses();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("cpu_usage");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
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
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return null;
    return sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
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

  const thCls = "text-left text-token-xs text-muted font-medium px-3 py-2 cursor-pointer select-none hover:text-secondary transition-colors";

  return (
    <div className="h-full flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h1 className="text-token-xl font-bold text-primary">Processes</h1>
        <div className="flex items-center gap-2">
          <span className="text-token-xs text-muted">{filtered.length} / {data.length}</span>
          <button
            onClick={refresh}
            disabled={loading}
            className="p-1.5 rounded-md text-muted hover:text-secondary transition-colors hover:bg-[rgb(var(--bg-hover))]"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or PID..."
          className="w-full pl-8 pr-3 py-2 text-token-sm rounded-lg border border-default bg-[rgb(var(--bg-secondary))] text-primary placeholder:text-muted focus:outline-none focus:border-[rgb(var(--accent))] transition-colors"
        />
      </div>

      <div className="glass flex-1 overflow-hidden flex flex-col">
        <table className="w-full" style={{ tableLayout: "fixed" }}>
          <thead className="border-b border-default">
            <tr>
              <th className={thCls} style={{ width: 60 }} onClick={() => toggleSort("pid")}>
                <span className="flex items-center gap-1">PID <SortIcon k="pid" /></span>
              </th>
              <th className={thCls} onClick={() => toggleSort("name")}>
                <span className="flex items-center gap-1">Name <SortIcon k="name" /></span>
              </th>
              <th className={thCls} style={{ width: 90 }} onClick={() => toggleSort("cpu_usage")}>
                <span className="flex items-center gap-1">CPU% <SortIcon k="cpu_usage" /></span>
              </th>
              <th className={thCls} style={{ width: 100 }} onClick={() => toggleSort("memory_bytes")}>
                <span className="flex items-center gap-1">Mem <SortIcon k="memory_bytes" /></span>
              </th>
              <th className={thCls} style={{ width: 80 }}>Status</th>
              <th className={thCls} style={{ width: 60 }}>Kill</th>
            </tr>
          </thead>
        </table>
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-token-sm" style={{ tableLayout: "fixed" }}>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.pid}
                  className="border-b border-[rgb(var(--border)/0.3)] hover:bg-[rgb(var(--bg-hover))] transition-colors"
                >
                  <td className="text-muted font-mono px-3 py-1.5" style={{ width: 60 }}>{p.pid}</td>
                  <td className="text-primary truncate px-3 py-1.5">{p.name}</td>
                  <td className={clsx("font-medium px-3 py-1.5", getUsageClass(p.cpu_usage))} style={{ width: 90 }}>
                    {p.cpu_usage.toFixed(1)}%
                  </td>
                  <td className="text-secondary px-3 py-1.5" style={{ width: 100 }}>
                    {formatBytes(p.memory_bytes)}
                  </td>
                  <td className="text-token-xs text-muted truncate px-3 py-1.5" style={{ width: 80 }}>{p.status}</td>
                  <td className="px-3 py-1.5" style={{ width: 60 }}>
                    <button
                      onClick={() => handleKill(p.pid)}
                      className="p-1 rounded transition-colors"
                      style={{ color: confirmKill === p.pid ? "rgb(var(--danger))" : "rgb(var(--text-muted))" }}
                      title={confirmKill === p.pid ? "Click again to confirm" : "Kill process"}
                    >
                      <XCircle size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
