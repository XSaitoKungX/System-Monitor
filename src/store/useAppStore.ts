import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Theme, NavPage } from "@/types";

interface AppState {
  theme: Theme;
  currentPage: NavPage;
  sidebarCollapsed: boolean;
  refreshInterval: number;
  alerts: AlertConfig[];
  compactMode: boolean;
  startMinimized: boolean;
  closeToTray: boolean;
  setTheme: (theme: Theme) => void;
  setCurrentPage: (page: NavPage) => void;
  setSidebarCollapsed: (v: boolean) => void;
  setRefreshInterval: (ms: number) => void;
  addAlert: (alert: AlertConfig) => void;
  removeAlert: (id: string) => void;
  setCompactMode: (v: boolean) => void;
  setStartMinimized: (v: boolean) => void;
  setCloseToTray: (v: boolean) => void;
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
      compactMode: false,
      startMinimized: false,
      closeToTray: true,
      setTheme: (theme) => {
        document.documentElement.setAttribute("data-theme", theme);
        set({ theme });
      },
      setCurrentPage: (page) => set({ currentPage: page }),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      setRefreshInterval: (ms) => set({ refreshInterval: ms }),
      addAlert: (alert) => set((s) => ({ alerts: [...s.alerts, alert] })),
      removeAlert: (id) => set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) })),
      setCompactMode: (v) => {
        document.documentElement.setAttribute("data-compact", v ? "true" : "false");
        set({ compactMode: v });
      },
      setStartMinimized: (v) => set({ startMinimized: v }),
      setCloseToTray: (v) => set({ closeToTray: v }),
    }),
    {
      name: "system-monitor-settings",
      partialize: (s) => ({
        theme: s.theme,
        sidebarCollapsed: s.sidebarCollapsed,
        refreshInterval: s.refreshInterval,
        alerts: s.alerts,
        compactMode: s.compactMode,
        startMinimized: s.startMinimized,
        closeToTray: s.closeToTray,
      }),
    }
  )
);
