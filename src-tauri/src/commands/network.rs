use tauri::State;
use crate::models::network::{NetworkInterface, NetworkStats};
use crate::state::SysState;

fn iface_type(name: &str) -> &'static str {
    let n = name.to_lowercase();
    if n.starts_with("wl") { return "wifi"; }
    if n.starts_with("eth") || n.starts_with("enp") || n.starts_with("ens")
        || n.starts_with("eno") || n.starts_with("em") { return "lan"; }
    "other"
}

fn is_physical(name: &str) -> bool {
    let n = name.to_lowercase();
    if n.starts_with("lo") { return false; }
    let blocklist = ["docker", "br-", "veth", "virbr", "tun", "tap", "dummy", "vcan", "sit", "vmnet", "vboxnet", "wg"];
    if blocklist.iter().any(|prefix| n.starts_with(prefix)) { return false; }
    true
}

#[tauri::command]
pub fn get_network_stats(state: State<SysState>) -> NetworkStats {
    let elapsed_secs = state.net_elapsed_secs();

    let mut net = state.net.lock().unwrap();
    net.refresh(false);

    let mut total_rx_sec: u64 = 0;
    let mut total_tx_sec: u64 = 0;

    let mut interfaces: Vec<NetworkInterface> = net
        .iter()
        .filter(|(name, data)| {
            is_physical(name)
                && (data.total_received() + data.total_transmitted() > 0
                    || data.ip_networks().iter().any(|ip| {
                        let addr = ip.addr.to_string();
                        !addr.starts_with("127.") && !addr.starts_with("::1") && addr != "0.0.0.0"
                    }))
        })
        .map(|(name, data)| {
            let secs = elapsed_secs.max(0.1);
            let rx_sec = (data.received() as f64 / secs) as u64;
            let tx_sec = (data.transmitted() as f64 / secs) as u64;
            total_rx_sec += rx_sec;
            total_tx_sec += tx_sec;

            let ips: Vec<String> = data
                .ip_networks()
                .iter()
                .filter(|ip| {
                    let a = ip.addr.to_string();
                    !a.starts_with("::1") && a != "0.0.0.0"
                })
                .map(|ip| ip.addr.to_string())
                .collect();

            NetworkInterface {
                name: name.clone(),
                received_bytes: data.total_received(),
                transmitted_bytes: data.total_transmitted(),
                received_bytes_per_sec: rx_sec,
                transmitted_bytes_per_sec: tx_sec,
                mac_address: data.mac_address().to_string(),
                ip_address: ips,
                iface_type: iface_type(name).to_string(),
                is_primary: false,
            }
        })
        .collect();

    let primary_idx = interfaces
        .iter()
        .position(|i| i.iface_type == "lan" && !i.ip_address.is_empty())
        .or_else(|| interfaces.iter().position(|i| i.iface_type == "wifi" && !i.ip_address.is_empty()))
        .or_else(|| interfaces.iter().position(|i| !i.ip_address.is_empty()));

    if let Some(idx) = primary_idx {
        interfaces[idx].is_primary = true;
    }

    let (primary_rx, primary_tx) = primary_idx
        .map(|i| (interfaces[i].received_bytes_per_sec, interfaces[i].transmitted_bytes_per_sec))
        .unwrap_or((total_rx_sec, total_tx_sec));

    interfaces.sort_by(|a, b| b.is_primary.cmp(&a.is_primary)
        .then(b.iface_type.cmp(&a.iface_type))
        .then((b.received_bytes + b.transmitted_bytes).cmp(&(a.received_bytes + a.transmitted_bytes))));

    NetworkStats {
        interfaces,
        primary_rx_per_sec: primary_rx,
        primary_tx_per_sec: primary_tx,
        total_received_per_sec: total_rx_sec,
        total_transmitted_per_sec: total_tx_sec,
    }
}
