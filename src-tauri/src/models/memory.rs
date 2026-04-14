use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryStats {
    pub total_bytes: u64,
    pub used_bytes: u64,
    pub available_bytes: u64,
    pub usage_percent: f32,
    pub swap_total_bytes: u64,
    pub swap_used_bytes: u64,
    pub swap_usage_percent: f32,
    pub cached_bytes: Option<u64>,
    pub buffers_bytes: Option<u64>,
    pub dirty_bytes: Option<u64>,
    pub active_bytes: Option<u64>,
    pub inactive_bytes: Option<u64>,
}
