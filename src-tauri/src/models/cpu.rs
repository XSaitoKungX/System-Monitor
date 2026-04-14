use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CpuStats {
    pub usage_total: f32,
    pub usage_per_core: Vec<f32>,
    pub frequency_mhz: u64,
    pub physical_cores: usize,
    pub logical_cores: usize,
    pub brand: String,
    pub vendor: String,
    pub temperature: Option<f32>,
    pub architecture: String,
    pub cache_l1_kb: Option<u32>,
    pub cache_l2_kb: Option<u32>,
    pub cache_l3_kb: Option<u32>,
    pub features: Vec<String>,
}
