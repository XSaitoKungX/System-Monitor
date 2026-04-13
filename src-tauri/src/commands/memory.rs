use tauri::State;
use crate::models::memory::MemoryStats;
use crate::state::SysState;

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

    MemoryStats {
        total_bytes: total,
        used_bytes: used,
        available_bytes: available,
        usage_percent,
        swap_total_bytes: swap_total,
        swap_used_bytes: swap_used,
        swap_usage_percent,
    }
}
