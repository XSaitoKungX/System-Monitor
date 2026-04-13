import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Theme, NavPage } from "@/types";

interface AppState {
  theme: Theme;
  currentPage: NavPage;
  sidebarCollapsed: boolean;
  refreshInterval: number;
  alerts: AlertConfig[];
  setTheme: (theme: Theme) => void;
  setCurrentPage: (page: NavPage) => void;
  setSidebarCollapsed: (v: boolean) => void;
  setRefreshInterval: (ms: number) => void;
  addAlert: (alert: AlertConfig) => void;
  removeAlert: (id: string) => void;
}

export interface AlertConfig {
  id: string;
  metric: "cpu" | "memory" | "disk" | "network";
  threshold: number;
  label: string;
  enabled: boolean;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: "default",
      currentPage: "dashboard",
      sidebarCollapsed: false,
      refreshInterval: 3000,
      alerts: [],
      setTheme: (theme) => {
        document.documentElement.setAttribute("data-theme", theme);
        set({ theme });
      },
      setCurrentPage: (page) => set({ currentPage: page }),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      setRefreshInterval: (ms) => set({ refreshInterval: ms }),
      addAlert: (alert) => set((s) => ({ alerts: [...s.alerts, alert] })),
      removeAlert: (id) => set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) })),
    }),
    {
      name: "system-monitor-settings",
      partialize: (s) => ({
        theme: s.theme,
        sidebarCollapsed: s.sidebarCollapsed,
        refreshInterval: s.refreshInterval,
        alerts: s.alerts,
      }),
    }
  )
);
