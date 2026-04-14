export interface CpuStats {
  usage_total: number;
  usage_per_core: number[];
  frequency_mhz: number;
  physical_cores: number;
  logical_cores: number;
  brand: string;
  vendor: string;
  temperature: number | null;
  architecture: string;
  cache_l1_kb: number | null;
  cache_l2_kb: number | null;
  cache_l3_kb: number | null;
  features: string[];
}

export interface MemoryStats {
  total_bytes: number;
  used_bytes: number;
  available_bytes: number;
  usage_percent: number;
  swap_total_bytes: number;
  swap_used_bytes: number;
  swap_usage_percent: number;
  cached_bytes: number | null;
  buffers_bytes: number | null;
  dirty_bytes: number | null;
  active_bytes: number | null;
  inactive_bytes: number | null;
}

export interface DiskInfo {
  name: string;
  mount_point: string;
  file_system: string;
  total_bytes: number;
  available_bytes: number;
  used_bytes: number;
  usage_percent: number;
  is_removable: boolean;
  read_bytes_per_sec: number;
  write_bytes_per_sec: number;
}

export interface DiskStats {
  disks: DiskInfo[];
}

export interface NetworkInterface {
  name: string;
  received_bytes: number;
  transmitted_bytes: number;
  received_bytes_per_sec: number;
  transmitted_bytes_per_sec: number;
  mac_address: string;
  ip_address: string[];
  iface_type: "wifi" | "lan" | "other";
  is_primary: boolean;
}

export interface NetworkStats {
  interfaces: NetworkInterface[];
  primary_rx_per_sec: number;
  primary_tx_per_sec: number;
  total_received_per_sec: number;
  total_transmitted_per_sec: number;
}

export interface GpuInfo {
  index: number;
  name: string;
  vendor: string;
  driver: string;
  vram_total_bytes: number;
  vram_used_bytes: number;
  vram_usage_percent: number;
  gpu_usage_percent: number;
  temperature: number | null;
  power_watts: number | null;
  power_limit_watts: number | null;
  freq_mhz: number | null;
  max_freq_mhz: number | null;
  mem_freq_mhz: number | null;
  fan_speed_percent: number | null;
  fan_rpm: number | null;
  card_path: string;
}

export interface GpuStats {
  gpus: GpuInfo[];
  platform_note: string | null;
}

export interface ProcessInfo {
  pid: number;
  parent_pid: number | null;
  name: string;
  exe: string;
  status: string;
  cpu_usage: number;
  memory_bytes: number;
  virtual_memory_bytes: number;
  read_bytes: number;
  written_bytes: number;
  started_at: number;
  user: string;
}

export interface SystemInfo {
  os_name: string;
  os_version: string;
  kernel_version: string;
  hostname: string;
  uptime_seconds: number;
  boot_time: number;
  cpu_arch: string;
}

export type Theme = "default" | "dark" | "light" | "space" | "dev" | "midnight" | "rose" | "nord";

export type NavPage =
  | "dashboard"
  | "cpu"
  | "memory"
  | "gpu"
  | "disk"
  | "network"
  | "speedtest"
  | "processes"
  | "settings";
