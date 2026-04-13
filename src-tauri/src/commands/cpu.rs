use tauri::State;
use crate::models::cpu::CpuStats;
use crate::state::SysState;

#[tauri::command]
pub fn get_cpu_stats(state: State<SysState>) -> CpuStats {
    let mut sys = state.sys.lock().unwrap();
    sys.refresh_cpu_all();

    let cpus = sys.cpus();
    let usage_per_core: Vec<f32> = cpus.iter().map(|c| c.cpu_usage()).collect();
    let usage_total = if usage_per_core.is_empty() {
        0.0
    } else {
        usage_per_core.iter().sum::<f32>() / usage_per_core.len() as f32
    };

    let frequency_mhz = cpus.first().map(|c| c.frequency()).unwrap_or(0);
    let brand = cpus.first().map(|c| c.brand().to_string()).unwrap_or_default();
    let vendor = cpus.first().map(|c| c.vendor_id().to_string()).unwrap_or_default();
    let physical_cores = sys.physical_core_count().unwrap_or(0);
    let logical_cores = cpus.len();

    let temperature = {
        let components = sysinfo::Components::new_with_refreshed_list();
        components
            .iter()
            .find(|c| {
                let l = c.label().to_lowercase();
                l.contains("cpu") || l.contains("core")
            })
            .and_then(|c| c.temperature())
    };

    CpuStats {
        usage_total,
        usage_per_core,
        frequency_mhz,
        physical_cores,
        logical_cores,
        brand,
        vendor,
        temperature,
    }
}
