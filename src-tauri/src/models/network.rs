use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkInterface {
    pub name: String,
    pub received_bytes: u64,
    pub transmitted_bytes: u64,
    pub received_bytes_per_sec: u64,
    pub transmitted_bytes_per_sec: u64,
    pub mac_address: String,
    pub ip_address: Vec<String>,
    pub iface_type: String,
    pub is_primary: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkStats {
    pub interfaces: Vec<NetworkInterface>,
    pub primary_rx_per_sec: u64,
    pub primary_tx_per_sec: u64,
    pub total_received_per_sec: u64,
    pub total_transmitted_per_sec: u64,
}
