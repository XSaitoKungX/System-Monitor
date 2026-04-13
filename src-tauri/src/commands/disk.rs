use sysinfo::Disks;
use crate::models::disk::{DiskInfo, DiskStats};

#[tauri::command]
pub fn get_disk_stats() -> DiskStats {
    let disks = Disks::new_with_refreshed_list();

    let disk_list: Vec<DiskInfo> = disks.iter().map(|d| {
        let total = d.total_space();
        let available = d.available_space();
        let used = total.saturating_sub(available);
        let usage_percent = if total > 0 { (used as f32 / total as f32) * 100.0 } else { 0.0 };

        DiskInfo {
            name: d.name().to_string_lossy().to_string(),
            mount_point: d.mount_point().to_string_lossy().to_string(),
            file_system: d.file_system().to_string_lossy().to_string(),
            total_bytes: total,
            available_bytes: available,
            used_bytes: used,
            usage_percent,
            is_removable: d.is_removable(),
            read_bytes_per_sec: 0,
            write_bytes_per_sec: 0,
        }
    }).collect();

    DiskStats { disks: disk_list }
}
