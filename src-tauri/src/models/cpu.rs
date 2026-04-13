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
}
