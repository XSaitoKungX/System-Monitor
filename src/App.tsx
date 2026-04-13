import { lazy, Suspense, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { useAppStore } from "@/store/useAppStore";

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
  const { currentPage, theme } = useAppStore();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

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
