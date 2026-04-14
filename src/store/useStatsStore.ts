import { create } from "zustand";
import type { CpuStats, MemoryStats, DiskStats, NetworkStats } from "@/types";

interface StatsState {
  cpu: CpuStats | null;
  mem: MemoryStats | null;
  disk: DiskStats | null;
  net: NetworkStats | null;
  cpuHistory: number[];
  memHistory: number[];
  setCpu: (s: CpuStats) => void;
  setMem: (s: MemoryStats) => void;
  setDisk: (s: DiskStats) => void;
  setNet: (s: NetworkStats) => void;
}

export const useStatsStore = create<StatsState>((set) => ({
  cpu: null,
  mem: null,
  disk: null,
  net: null,
  cpuHistory: [],
  memHistory: [],
  setCpu: (s) =>
    set((state) => ({
      cpu: s,
      cpuHistory: [...state.cpuHistory.slice(-59), s.usage_total],
    })),
  setMem: (s) =>
    set((state) => ({
      mem: s,
      memHistory: [...state.memHistory.slice(-59), s.usage_percent],
    })),
  setDisk: (s) => set({ disk: s }),
  setNet: (s) => set({ net: s }),
}));
