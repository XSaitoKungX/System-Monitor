use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GpuInfo {
    pub index: usize,
    pub name: String,
    pub vendor: String,
    pub driver: String,
    pub vram_total_bytes: u64,
    pub vram_used_bytes: u64,
    pub vram_usage_percent: f32,
    pub gpu_usage_percent: f32,
    pub temperature: Option<f32>,
    pub power_watts: Option<f32>,
    pub power_limit_watts: Option<f32>,
    pub freq_mhz: Option<u32>,
    pub max_freq_mhz: Option<u32>,
    pub mem_freq_mhz: Option<u32>,
    pub fan_speed_percent: Option<u32>,
    pub fan_rpm: Option<u32>,
    pub card_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GpuStats {
    pub gpus: Vec<GpuInfo>,
    pub platform_note: Option<String>,
}
