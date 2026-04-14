import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type {
  CpuStats,
  MemoryStats,
  DiskStats,
  GpuStats,
  NetworkStats,
  ProcessInfo,
  SystemInfo,
} from "@/types";
import { useAppStore } from "@/store/useAppStore";
import { useStatsStore } from "@/store/useStatsStore";

// Sync refresh interval with backend whenever it changes
export function useRefreshIntervalSync() {
  const refreshInterval = useAppStore((s) => s.refreshInterval);
  useEffect(() => {
    invoke("set_refresh_interval", { intervalMs: refreshInterval }).catch(() => {});
  }, [refreshInterval]);
}

export function useCpuStats() {
  const { setCpu } = useStatsStore();
  const data = useStatsStore((s) => s.cpu);
  const history = useStatsStore((s) => s.cpuHistory);

  useEffect(() => {
    const unlisten = listen<CpuStats>("stats:cpu", (e) => setCpu(e.payload));
    return () => { unlisten.then((f) => f()); };
  }, [setCpu]);

  return { data, history };
}

export function useMemoryStats() {
  const { setMem } = useStatsStore();
  const data = useStatsStore((s) => s.mem);
  const history = useStatsStore((s) => s.memHistory);

  useEffect(() => {
    const unlisten = listen<MemoryStats>("stats:mem", (e) => setMem(e.payload));
    return () => { unlisten.then((f) => f()); };
  }, [setMem]);

  return { data, history };
}

export function useDiskStats() {
  const { setDisk } = useStatsStore();
  const data = useStatsStore((s) => s.disk);

  useEffect(() => {
    const unlisten = listen<DiskStats>("stats:disk", (e) => setDisk(e.payload));
    return () => { unlisten.then((f) => f()); };
  }, [setDisk]);

  return { data };
}

export function useGpuStats() {
  const [data, setData] = useState<GpuStats | null>(null);

  useEffect(() => {
    const unlisten = listen<GpuStats>("stats:gpu", (e) => setData(e.payload));
    return () => { unlisten.then((f) => f()); };
  }, []);

  return { data };
}

export function useNetworkStats() {
  const { setNet } = useStatsStore();
  const data = useStatsStore((s) => s.net);
  const [rxHistory, setRxHistory] = useState<number[]>([]);
  const [txHistory, setTxHistory] = useState<number[]>([]);

  useEffect(() => {
    const unlisten = listen<NetworkStats>("stats:net", (e) => {
      const stats = e.payload;
      setNet(stats);
      setRxHistory((prev) => [...prev.slice(-59), stats.total_received_per_sec]);
      setTxHistory((prev) => [...prev.slice(-59), stats.total_transmitted_per_sec]);
    });
    return () => { unlisten.then((f) => f()); };
  }, [setNet]);

  return { data, rxHistory, txHistory };
}

export function useProcesses() {
  const [data, setData] = useState<ProcessInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const refreshInterval = useAppStore((s) => s.refreshInterval);

  const fetchProcesses = useCallback(async () => {
    try {
      const procs = await invoke<ProcessInfo[]>("get_processes");
      setData(procs);
    } catch (e) {
      console.error("Failed to fetch processes", e);
    }
  }, []);

  const killProcess = useCallback(async (pid: number) => {
    setLoading(true);
    try {
      await invoke("kill_process", { pid });
      await fetchProcesses();
    } catch (e) {
      console.error("Failed to kill process", e);
    } finally {
      setLoading(false);
    }
  }, [fetchProcesses]);

  useEffect(() => {
    fetchProcesses();
    const id = setInterval(fetchProcesses, refreshInterval);
    return () => clearInterval(id);
  }, [fetchProcesses, refreshInterval]);

  return { data, loading, killProcess, refresh: fetchProcesses };
}

export function useSystemInfo() {
  const [data, setData] = useState<SystemInfo | null>(null);

  useEffect(() => {
    invoke<SystemInfo>("get_system_info")
      .then(setData)
      .catch((e) => console.error("Failed to fetch system info", e));
  }, []);

  return data;
}
