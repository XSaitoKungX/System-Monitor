import { lazy, Suspense, useCallback, useEffect, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { useAppStore } from "@/store/useAppStore";
import { invoke } from "@tauri-apps/api/core";
import { isPermissionGranted, requestPermission, sendNotification } from "@tauri-apps/plugin-notification";

const Dashboard = lazy(() => import("@/pages/Dashboard").then((m) => ({ default: m.Dashboard })));
const CPU = lazy(() => import("@/pages/CPU").then((m) => ({ default: m.CPU })));
const Memory = lazy(() => import("@/pages/Memory").then((m) => ({ default: m.Memory })));
const GPU = lazy(() => import("@/pages/GPU").then((m) => ({ default: m.GPU })));
const Disk = lazy(() => import("@/pages/Disk").then((m) => ({ default: m.Disk })));
const Network = lazy(() => import("@/pages/Network").then((m) => ({ default: m.Network })));
const Processes = lazy(() => import("@/pages/Processes").then((m) => ({ default: m.Processes })));
const Settings = lazy(() => import("@/pages/Settings").then((m) => ({ default: m.Settings })));
const Speedtest = lazy(() => import("@/pages/Speedtest").then((m) => ({ default: m.Speedtest })));

const PAGE_MAP = {
  dashboard: Dashboard,
  cpu: CPU,
  memory: Memory,
  gpu: GPU,
  disk: Disk,
  network: Network,
  speedtest: Speedtest,
  processes: Processes,
  settings: Settings,
} as const;

function PageFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <span className="text-muted text-sm">Loading...</span>
    </div>
  );
}

function App() {
  const { currentPage, theme, compactMode, alerts } = useAppStore();
  const notifiedAlerts = useRef<Set<string>>(new Set());
  const permGranted = useRef(false);

  // Init attributes on mount (single pass)
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.setAttribute("data-compact", String(compactMode));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { document.documentElement.setAttribute("data-theme", theme); }, [theme]);
  useEffect(() => { document.documentElement.setAttribute("data-compact", String(compactMode)); }, [compactMode]);

  // One-time notification permission check
  useEffect(() => {
    isPermissionGranted().then((ok) => {
      if (!ok) requestPermission().then((res) => { permGranted.current = res === "granted"; });
      else permGranted.current = true;
    });
  }, []);

  // Alert checker — stable callback using a ref snapshot of alerts
  const alertsRef = useRef(alerts);
  useEffect(() => { alertsRef.current = alerts; }, [alerts]);

  const checkAlerts = useCallback(async () => {
    const activeAlerts = alertsRef.current.filter((a) => a.enabled);
    if (activeAlerts.length === 0) return;

    try {
      const [cpu, memory, disk, network] = await Promise.all([
        invoke<{ usage_total: number }>("get_cpu_stats").catch(() => null),
        invoke<{ usage_percent: number }>("get_memory_stats").catch(() => null),
        invoke<{ disks: Array<{ usage_percent: number }> }>("get_disk_stats").catch(() => null),
        invoke<{ primary_rx_per_sec: number }>("get_network_stats").catch(() => null),
      ]);

      for (const alert of activeAlerts) {
        let value = 0;
        switch (alert.metric) {
          case "cpu":     value = cpu?.usage_total ?? 0; break;
          case "memory":  value = memory?.usage_percent ?? 0; break;
          case "disk":    value = disk?.disks.length
            ? disk.disks.reduce((s, d) => s + d.usage_percent, 0) / disk.disks.length
            : 0; break;
          case "network": value = (network?.primary_rx_per_sec ?? 0) / 1_000_000; break;
        }

        const key = `${alert.metric}-${alert.threshold}`;
        if (value > alert.threshold) {
          if (!notifiedAlerts.current.has(key)) {
            sendNotification({
              title: "System Monitor Alert",
              body: `${alert.label}: ${value.toFixed(1)}${alert.metric === "network" ? " MB/s" : "%"} (limit: ${alert.threshold}${alert.metric === "network" ? " MB/s" : "%"})`,
            });
            notifiedAlerts.current.add(key);
          }
        } else {
          notifiedAlerts.current.delete(key);
        }
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    if (alerts.every((a) => !a.enabled)) return;
    const id = setInterval(checkAlerts, 5000);
    return () => clearInterval(id);
  }, [alerts, checkAlerts]);

  const PageComponent = PAGE_MAP[currentPage];

  return (
    <Layout>
      <Suspense fallback={<PageFallback />}>
        <PageComponent />
      </Suspense>
    </Layout>
  );
}

export default App;
