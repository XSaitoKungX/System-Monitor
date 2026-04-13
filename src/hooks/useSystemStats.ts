import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
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

export function useCpuStats() {
  const refreshInterval = useAppStore((s) => s.refreshInterval);
  const { setCpu } = useStatsStore();
  const data = useStatsStore((s) => s.cpu);
  const history = useStatsStore((s) => s.cpuHistory);

  const fetchStats = useCallback(async () => {
    try {
      const stats = await invoke<CpuStats>("get_cpu_stats");
      setCpu(stats);
    } catch (e) {
      console.error("Failed to fetch CPU stats", e);
    }
  }, [setCpu]);

  useEffect(() => {
    fetchStats();
    const id = setInterval(fetchStats, refreshInterval);
    return () => clearInterval(id);
  }, [fetchStats, refreshInterval]);

  return { data, history };
}

export function useMemoryStats() {
  const refreshInterval = useAppStore((s) => s.refreshInterval);
  const { setMem } = useStatsStore();
  const data = useStatsStore((s) => s.mem);
  const history = useStatsStore((s) => s.memHistory);

  const fetchStats = useCallback(async () => {
    try {
      const stats = await invoke<MemoryStats>("get_memory_stats");
      setMem(stats);
    } catch (e) {
      console.error("Failed to fetch memory stats", e);
    }
  }, [setMem]);

  useEffect(() => {
    fetchStats();
    const id = setInterval(fetchStats, refreshInterval);
    return () => clearInterval(id);
  }, [fetchStats, refreshInterval]);

  return { data, history };
}

export function useDiskStats() {
  const [data, setData] = useState<DiskStats | null>(null);
  const refreshInterval = useAppStore((s) => s.refreshInterval);

  const fetch = useCallback(async () => {
    try {
      const stats = await invoke<DiskStats>("get_disk_stats");
      setData(stats);
    } catch (e) {
      console.error("Failed to fetch disk stats", e);
    }
  }, []);

  useEffect(() => {
    fetch();
    const id = setInterval(fetch, refreshInterval);
    return () => clearInterval(id);
  }, [fetch, refreshInterval]);

  return { data };
}

export function useGpuStats() {
  const [data, setData] = useState<GpuStats | null>(null);
  const refreshInterval = useAppStore((s) => s.refreshInterval);

  const fetchStats = useCallback(async () => {
    try {
      const stats = await invoke<GpuStats>("get_gpu_stats");
      setData(stats);
    } catch (e) {
      console.error("Failed to fetch GPU stats", e);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const id = setInterval(fetchStats, refreshInterval);
    return () => clearInterval(id);
  }, [fetchStats, refreshInterval]);

  return { data };
}

export function useNetworkStats() {
  const [data, setData] = useState<NetworkStats | null>(null);
  const [rxHistory, setRxHistory] = useState<number[]>([]);
  const [txHistory, setTxHistory] = useState<number[]>([]);
  const refreshInterval = useAppStore((s) => s.refreshInterval);

  const fetch = useCallback(async () => {
    try {
      const stats = await invoke<NetworkStats>("get_network_stats");
      setData(stats);
      setRxHistory((prev) => [...prev.slice(-59), stats.total_received_per_sec]);
      setTxHistory((prev) => [...prev.slice(-59), stats.total_transmitted_per_sec]);
    } catch (e) {
      console.error("Failed to fetch network stats", e);
    }
  }, []);

  useEffect(() => {
    fetch();
    const id = setInterval(fetch, refreshInterval);
    return () => clearInterval(id);
  }, [fetch, refreshInterval]);

  return { data, rxHistory, txHistory };
}

export function useProcesses() {
  const [data, setData] = useState<ProcessInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const refreshInterval = useAppStore((s) => s.refreshInterval);

  const fetch = useCallback(async () => {
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
      await fetch();
    } catch (e) {
      console.error("Failed to kill process", e);
    } finally {
      setLoading(false);
    }
  }, [fetch]);

  useEffect(() => {
    fetch();
    const id = setInterval(fetch, refreshInterval);
    return () => clearInterval(id);
  }, [fetch, refreshInterval]);

  return { data, loading, killProcess, refresh: fetch };
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
