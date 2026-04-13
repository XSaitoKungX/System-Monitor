import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import type { NavPage } from "@/types";
import {
  LayoutDashboard,
  Cpu,
  MemoryStick,
  Monitor,
  HardDrive,
  Network,
  Gauge,
  List,
  Settings,
  ChevronLeft,
  ChevronRight,
  Activity,
} from "lucide-react";

const NAV_ITEMS: { page: NavPage; label: string; icon: React.ReactNode }[] = [
  { page: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { page: "cpu", label: "CPU", icon: <Cpu size={18} /> },
  { page: "memory", label: "Memory", icon: <MemoryStick size={18} /> },
  { page: "gpu", label: "GPU", icon: <Monitor size={18} /> },
  { page: "disk", label: "Disk", icon: <HardDrive size={18} /> },
  { page: "network", label: "Network", icon: <Network size={18} /> },
  { page: "speedtest", label: "Speedtest", icon: <Gauge size={18} /> },
  { page: "processes", label: "Processes", icon: <List size={18} /> },
  { page: "settings", label: "Settings", icon: <Settings size={18} /> },
];

export function Sidebar() {
  const { currentPage, setCurrentPage, sidebarCollapsed, setSidebarCollapsed } =
    useAppStore();

  return (
    <aside
      className={cn(
        "flex flex-col h-full transition-all duration-300 ease-in-out",
        "border-r border-default",
        sidebarCollapsed ? "w-[56px]" : "w-[200px]"
      )}
      style={{ background: "rgb(var(--bg-secondary))" }}
    >
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-4 border-b border-default",
          sidebarCollapsed && "justify-center"
        )}
      >
        <Activity size={20} style={{ color: "rgb(var(--accent))" }} className="shrink-0" />
        {!sidebarCollapsed && (
          <span className="font-semibold text-sm text-primary truncate">
            System Monitor
          </span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {NAV_ITEMS.map(({ page, label, icon }) => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors duration-150",
              "hover:bg-[rgb(var(--bg-hover))]",
              sidebarCollapsed && "justify-center",
              currentPage === page
                ? "bg-[rgb(var(--accent)/0.15)] text-[rgb(var(--accent))] font-medium"
                : "text-secondary"
            )}
            title={sidebarCollapsed ? label : undefined}
          >
            <span className="shrink-0">{icon}</span>
            {!sidebarCollapsed && <span className="truncate">{label}</span>}
          </button>
        ))}
      </nav>

      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="flex items-center justify-center h-10 border-t border-default text-muted hover:text-secondary transition-colors"
        title={sidebarCollapsed ? "Expand" : "Collapse"}
      >
        {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
}
