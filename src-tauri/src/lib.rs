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

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(state::SysState::new())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Build tray menu
            let show_i = tauri::menu::MenuItemBuilder::with_id("show", "Show Window")
                .build(app)?;
            let quit_i = tauri::menu::MenuItemBuilder::with_id("quit", "Quit System Monitor")
                .build(app)?;
            let menu = tauri::menu::MenuBuilder::new(app)
                .items(&[&show_i, &quit_i])
                .build()?;

            tauri::tray::TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("System Monitor")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "quit" => app.exit(0),
                    "show" => {
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    // Left-click on tray icon → show/focus window
                    if let tauri::tray::TrayIconEvent::Click {
                        button: tauri::tray::MouseButton::Left,
                        button_state: tauri::tray::MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        // Closing the main window hides it to tray rather than quitting
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == "main" {
                    let _ = window.hide();
                    api.prevent_close();
                }
            }
        })
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
