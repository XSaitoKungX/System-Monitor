mod commands;
mod models;
mod state;

use commands::cpu::get_cpu_stats;
use commands::memory::get_memory_stats;
use commands::disk::get_disk_stats;
use commands::network::get_network_stats;
use commands::processes::{get_processes, kill_process};
use commands::gpu::get_gpu_stats;
use commands::system::get_system_info;
use commands::webview::open_speedtest;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(state::SysState::new())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            get_cpu_stats,
            get_memory_stats,
            get_disk_stats,
            get_gpu_stats,
            get_network_stats,
            get_processes,
            kill_process,
            get_system_info,
            open_speedtest,
        ])
        .run(tauri::generate_context!())
        .expect("error while running system monitor");
}
