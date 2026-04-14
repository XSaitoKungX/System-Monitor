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

use tauri::{Manager, Emitter};
use serde::Deserialize;
use std::sync::{Arc, Mutex};
use std::time::Duration;

#[derive(Deserialize)]
struct WindowBehavior {
    close_to_tray: bool,
}

#[tauri::command]
fn update_window_behavior(app: tauri::AppHandle, behavior: WindowBehavior) {
    app.manage(behavior);
}

#[tauri::command]
fn hide_window(app: tauri::AppHandle) {
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.hide();
    }
}

#[tauri::command]
fn show_window(app: tauri::AppHandle) {
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.show();
        let _ = w.set_focus();
    }
}

#[tauri::command]
fn set_refresh_interval(interval_ms: u64, interval_state: tauri::State<Arc<Mutex<u64>>>) {
    let clamped = interval_ms.clamp(500, 10_000);
    *interval_state.lock().unwrap() = clamped;
}

fn spawn_stats_loop(app: tauri::AppHandle, interval_state: Arc<Mutex<u64>>) {
    std::thread::spawn(move || {
        loop {
            let interval_ms = *interval_state.lock().unwrap();

            let state = app.state::<state::SysState>();

            let cpu  = get_cpu_stats(state.clone());
            let mem  = get_memory_stats(state.clone());
            let disk = get_disk_stats();
            let net  = get_network_stats(state.clone());
            let gpu  = get_gpu_stats();

            let _ = app.emit("stats:cpu",  &cpu);
            let _ = app.emit("stats:mem",  &mem);
            let _ = app.emit("stats:disk", &disk);
            let _ = app.emit("stats:net",  &net);
            let _ = app.emit("stats:gpu",  &gpu);

            std::thread::sleep(Duration::from_millis(interval_ms));
        }
    });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let interval_state: Arc<Mutex<u64>> = Arc::new(Mutex::new(3000));

    tauri::Builder::default()
        .manage(state::SysState::new())
        .manage(interval_state.clone())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .setup({
            let interval_state = interval_state.clone();
            move |app| {
            // Check if we should start minimized (read from store file)
            let app_path = app.path().app_local_data_dir().ok();
            let start_minimized = app_path.and_then(|p| {
                let store_path = p.join("system-monitor-settings.json");
                let content = std::fs::read_to_string(store_path).ok()?;
                let json: serde_json::Value = serde_json::from_str(&content).ok()?;
                json.get("state")
                    .and_then(|s| s.get("startMinimized").and_then(|v| v.as_bool()))
            }).unwrap_or(false);

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

            // Start minimized if requested
            if start_minimized {
                if let Some(w) = app.get_webview_window("main") {
                    let _ = w.hide();
                }
            }

            // Emit event that frontend can use to send window behavior
            let _ = app.emit("window-ready", ());

            // Start background stats push loop
            spawn_stats_loop(app.handle().clone(), interval_state.clone());

            Ok(())
        }})
        // Closing the main window behavior depends on closeToTray setting
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == "main" {
                    // Check if closeToTray is enabled (default true)
                    let app_handle = window.app_handle();
                    let close_to_tray = app_handle.try_state::<WindowBehavior>()
                        .map(|b| b.close_to_tray)
                        .unwrap_or(true);

                    if close_to_tray {
                        let _ = window.hide();
                        api.prevent_close();
                    }
                    // else: allow close (quit)
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
            update_window_behavior,
            hide_window,
            show_window,
            set_refresh_interval,
        ])
        .run(tauri::generate_context!())
        .expect("error while running system monitor");
}
