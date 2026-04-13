use tauri::{AppHandle, Manager, WebviewWindowBuilder, WebviewUrl};

#[tauri::command]
pub fn open_speedtest(app: AppHandle) -> Result<(), String> {
    let label = "speedtest";

    if let Some(win) = app.get_webview_window(label) {
        win.set_focus().map_err(|e: tauri::Error| e.to_string())?;
        return Ok(());
    }

    WebviewWindowBuilder::new(
        &app,
        label,
        WebviewUrl::External("https://fast.com".parse().unwrap()),
    )
    .title("Speedtest — System Monitor")
    .inner_size(900.0, 620.0)
    .min_inner_size(600.0, 400.0)
    .resizable(true)
    .decorations(true)
    .build()
    .map_err(|e| e.to_string())?;

    Ok(())
}
