use sysinfo::System;
use crate::models::system::SystemInfo;

#[tauri::command]
pub fn get_system_info() -> SystemInfo {
    let uptime = System::uptime();
    let boot_time = System::boot_time() as i64;

    SystemInfo {
        os_name: System::name().unwrap_or_else(|| "Unknown".to_string()),
        os_version: System::os_version().unwrap_or_else(|| "Unknown".to_string()),
        kernel_version: System::kernel_version().unwrap_or_else(|| "Unknown".to_string()),
        hostname: System::host_name().unwrap_or_else(|| "Unknown".to_string()),
        uptime_seconds: uptime,
        boot_time,
        cpu_arch: std::env::consts::ARCH.to_string(),
    }
}
