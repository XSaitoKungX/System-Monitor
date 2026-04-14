use tauri::State;
use crate::models::memory::MemoryStats;
use crate::state::SysState;

#[cfg(target_os = "linux")]
fn parse_meminfo_kb(key: &str, content: &str) -> Option<u64> {
    content.lines()
        .find(|l| l.starts_with(key))
        .and_then(|l| l.split_whitespace().nth(1))
        .and_then(|v| v.parse::<u64>().ok())
        .map(|kb| kb * 1024)
}

#[tauri::command]
pub fn get_memory_stats(state: State<SysState>) -> MemoryStats {
    let mut sys = state.sys.lock().unwrap();
    sys.refresh_memory();

    let total = sys.total_memory();
    let used = sys.used_memory();
    let available = sys.available_memory();
    let usage_percent = if total > 0 { (used as f32 / total as f32) * 100.0 } else { 0.0 };

    let swap_total = sys.total_swap();
    let swap_used = sys.used_swap();
    let swap_usage_percent = if swap_total > 0 { (swap_used as f32 / swap_total as f32) * 100.0 } else { 0.0 };

    // ── Linux: parse /proc/meminfo for detail breakdown ───────────────────────
    #[cfg(target_os = "linux")]
    let (cached_bytes, buffers_bytes, dirty_bytes, active_bytes, inactive_bytes) = {
        if let Ok(content) = std::fs::read_to_string("/proc/meminfo") {
            (
                parse_meminfo_kb("Cached:", &content),
                parse_meminfo_kb("Buffers:", &content),
                parse_meminfo_kb("Dirty:", &content),
                parse_meminfo_kb("Active:", &content),
                parse_meminfo_kb("Inactive:", &content),
            )
        } else {
            (None, None, None, None, None)
        }
    };

    #[cfg(not(target_os = "linux"))]
    let (cached_bytes, buffers_bytes, dirty_bytes, active_bytes, inactive_bytes) =
        (None, None, None, None, None);

    MemoryStats {
        total_bytes: total,
        used_bytes: used,
        available_bytes: available,
        usage_percent,
        swap_total_bytes: swap_total,
        swap_used_bytes: swap_used,
        swap_usage_percent,
        cached_bytes,
        buffers_bytes,
        dirty_bytes,
        active_bytes,
        inactive_bytes,
    }
}
