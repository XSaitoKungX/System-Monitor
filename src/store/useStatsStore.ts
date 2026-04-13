import { create } from "zustand";
import type { CpuStats, MemoryStats } from "@/types";

interface StatsState {
  cpu: CpuStats | null;
  mem: MemoryStats | null;
  cpuHistory: number[];
  memHistory: number[];
  setCpu: (s: CpuStats) => void;
  setMem: (s: MemoryStats) => void;
}

export const useStatsStore = create<StatsState>((set) => ({
  cpu: null,
  mem: null,
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
}));
