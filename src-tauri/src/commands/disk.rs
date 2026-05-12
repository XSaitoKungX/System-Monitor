use tauri::State;
use crate::models::disk::{DiskInfo, DiskStats};
use crate::state::SysState;

fn classify_disk_type(name: &str, kind: sysinfo::DiskKind) -> String {
    let n = name.to_lowercase();
    if n.contains("nvme") { return "NVMe".to_string(); }
    match kind {
        sysinfo::DiskKind::SSD     => "SSD".to_string(),
        sysinfo::DiskKind::HDD     => "HDD".to_string(),
        sysinfo::DiskKind::Unknown(_) => {
            // Best-effort guess from mount/device name
            if n.starts_with("sd") { "HDD".to_string() }
            else if n.starts_with("mmcblk") { "eMMC".to_string() }
            else { "Unknown".to_string() }
        }
    }
}

#[tauri::command]
pub fn get_disk_stats(state: State<SysState>) -> DiskStats {
    let elapsed = state.disk_elapsed_secs();

    let mut disks = state.disks.lock().unwrap();
    disks.refresh(false);

    let mut prev = state.disk_io_prev.lock().unwrap();

    let disk_list: Vec<DiskInfo> = disks.iter().map(|d| {
        let total     = d.total_space();
        let available = d.available_space();
        let used      = total.saturating_sub(available);
        let usage_percent = if total > 0 {
            (used as f64 / total as f64 * 100.0) as f32
        } else {
            0.0
        };

        let mount = d.mount_point().to_string_lossy().to_string();
        let cur_read  = d.usage().read_bytes;
        let cur_write = d.usage().written_bytes;
        let (prev_read, prev_write) = prev.get(&mount).copied().unwrap_or((cur_read, cur_write));

        let read_delta  = cur_read.saturating_sub(prev_read);
        let write_delta = cur_write.saturating_sub(prev_write);
        let read_per_sec  = (read_delta  as f64 / elapsed) as u64;
        let write_per_sec = (write_delta as f64 / elapsed) as u64;

        prev.insert(mount.clone(), (cur_read, cur_write));

        let name_str = d.name().to_string_lossy().to_string();
        let disk_type = classify_disk_type(&name_str, d.kind());

        DiskInfo {
            name: name_str,
            mount_point: mount,
            file_system: d.file_system().to_string_lossy().to_string(),
            total_bytes: total,
            available_bytes: available,
            used_bytes: used,
            usage_percent,
            is_removable: d.is_removable(),
            read_bytes_per_sec: read_per_sec,
            write_bytes_per_sec: write_per_sec,
            disk_type,
        }
    }).collect();

    DiskStats { disks: disk_list }
}
