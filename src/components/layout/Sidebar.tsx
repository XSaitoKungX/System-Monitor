import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { useStatsStore } from "@/store/useStatsStore";
import type { NavPage } from "@/types";
import {
  LayoutDashboard, Cpu, MemoryStick, Monitor, HardDrive,
  Network, Gauge, List, Settings, ChevronLeft, ChevronRight,
  Activity, Zap,
} from "lucide-react";

const NAV_ITEMS: { page: NavPage; label: string; icon: React.ReactNode; group?: string }[] = [
  { page: "dashboard",  label: "Dashboard",  icon: <LayoutDashboard size={16} /> },
  { page: "cpu",        label: "CPU",        icon: <Cpu size={16} />,        group: "Hardware" },
  { page: "memory",     label: "Memory",     icon: <MemoryStick size={16} />, group: "Hardware" },
  { page: "gpu",        label: "GPU",        icon: <Monitor size={16} />,    group: "Hardware" },
  { page: "disk",       label: "Disk",       icon: <HardDrive size={16} />,  group: "Hardware" },
  { page: "network",    label: "Network",    icon: <Network size={16} />,    group: "Network" },
  { page: "speedtest",  label: "Speedtest",  icon: <Gauge size={16} />,      group: "Network" },
  { page: "processes",  label: "Processes",  icon: <List size={16} />,       group: "System" },
  { page: "settings",   label: "Settings",   icon: <Settings size={16} />,   group: "System" },
];

function LiveBadge({ pct, color }: { pct: number; color: string }) {
  const cls = pct >= 90 ? "text-danger" : pct >= 70 ? "text-warning" : "text-success";
  return (
    <span className={cn("text-token-xs font-mono ml-auto shrink-0", cls)}
      style={{ color }}>
      {pct.toFixed(0)}%
    </span>
  );
}

export function Sidebar() {
  const { currentPage, setCurrentPage, sidebarCollapsed, setSidebarCollapsed } = useAppStore();
  const cpu = useStatsStore((s) => s.cpu);
  const mem = useStatsStore((s) => s.mem);

  const grouped = NAV_ITEMS.reduce<{ group: string; items: typeof NAV_ITEMS }[]>((acc, item) => {
    const g = item.group ?? "";
    const existing = acc.find((a) => a.group === g);
    if (existing) existing.items.push(item);
    else acc.push({ group: g, items: [item] });
    return acc;
  }, []);

  return (
    <aside
      className={cn(
        "flex flex-col h-full shrink-0 border-r border-default",
        "transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "w-[58px]" : "w-[220px]"
      )}
      style={{ background: "rgb(var(--bg-secondary))" }}
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-2.5 px-3 border-b border-default shrink-0",
        "h-[44px]",
        sidebarCollapsed && "justify-center"
      )}>
        <div className="shrink-0 p-1 rounded-lg" style={{ background: "rgb(var(--accent)/0.15)" }}>
          <Activity size={14} style={{ color: "rgb(var(--accent))" }} />
        </div>
        {!sidebarCollapsed && (
          <span className="font-semibold text-token-sm text-primary truncate">
            System Monitor
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2 flex flex-col gap-3">
        {grouped.map(({ group, items }) => (
          <div key={group}>
            {group && !sidebarCollapsed && (
              <p className="text-token-xs text-muted font-medium uppercase tracking-widest px-2 mb-1 mt-1">
                {group}
              </p>
            )}
            <div className="flex flex-col gap-0.5">
              {items.map(({ page, label, icon }) => {
                const active = currentPage === page;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    title={sidebarCollapsed ? label : undefined}
                    className={cn(
                      "nav-item",
                      sidebarCollapsed && "justify-center px-0",
                      active && "active"
                    )}
                  >
                    <span className="shrink-0">{icon}</span>
                    {!sidebarCollapsed && (
                      <>
                        <span className="truncate flex-1">{label}</span>
                        {page === "cpu" && cpu && (
                          <LiveBadge pct={cpu.usage_total} color="rgb(var(--accent))" />
                        )}
                        {page === "memory" && mem && (
                          <LiveBadge pct={mem.usage_percent} color="rgb(var(--success))" />
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer: live stats pill */}
      {!sidebarCollapsed && (cpu || mem) && (
        <div className="px-2 pb-2 shrink-0">
          <div className="rounded-lg px-3 py-2 flex items-center gap-3"
            style={{ background: "rgb(var(--bg-elevated))", border: "1px solid rgb(var(--border)/0.3)" }}>
            <Zap size={12} style={{ color: "rgb(var(--accent))", opacity: 0.7 }} />
            {cpu && (
              <span className="text-token-xs text-muted flex items-center gap-1">
                CPU <span className="text-accent font-semibold">{cpu.usage_total.toFixed(0)}%</span>
              </span>
            )}
            {mem && (
              <span className="text-token-xs text-muted flex items-center gap-1 ml-auto">
                RAM <span className="text-success font-semibold">{mem.usage_percent.toFixed(0)}%</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="flex items-center justify-center h-9 border-t border-default text-muted hover:text-secondary transition-colors shrink-0"
        title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  );
}
