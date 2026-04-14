use crate::models::gpu::GpuStats;

// ── Windows ───────────────────────────────────────────────────────────────────
#[cfg(target_os = "windows")]
use crate::models::gpu::GpuInfo;

#[cfg(target_os = "windows")]
#[tauri::command]
pub fn get_gpu_stats() -> GpuStats {
    use wmi::{COMLibrary, WMIConnection};
    use serde::Deserialize;

    #[derive(Deserialize)]
    struct VideoController {
        #[serde(rename = "Name")]
        name: String,
        #[serde(rename = "DriverVersion")]
        driver_version: Option<String>,
        #[serde(rename = "AdapterRAM")]
        adapter_ram: Option<u32>,
        #[serde(rename = "PNPDeviceID")]
        pnp_device_id: Option<String>,
    }

    // ── Try NVML first for NVIDIA GPUs (gives real stats) ──
    #[cfg(feature = "nvidia")]
    let mut nvml_gpus: Vec<GpuInfo> = Vec::new();
    #[cfg(feature = "nvidia")]
    let nvml_available = nvml_wrapper::Nvml::init().is_ok();
    #[cfg(feature = "nvidia")]
    let nvml_err = if !nvml_available {
        Some("NVML not available (NVIDIA driver not installed?)".to_string())
    } else {
        None
    };
    #[cfg(not(feature = "nvidia"))]
    let nvml_available = false;
    #[cfg(not(feature = "nvidia"))]
    let nvml_err: Option<String> = Some("NVIDIA support not compiled in (enable 'nvidia' feature)".to_string());

    #[cfg(feature = "nvidia")]
    if nvml_available {
        if let Ok(nvml) = nvml_wrapper::Nvml::init() {
            let count_result: Result<u32, nvml_wrapper::error::NvmlError> = nvml.device_count();
            if let Ok(count) = count_result {
                for i in 0..count {
                    if let Ok(device) = nvml.device_by_index(i) {
                        let name = device.name().unwrap_or_else(|_| format!("NVIDIA GPU {}", i));
                        let uuid = device.uuid().ok();

                        // Memory info
                        let (vram_total, vram_used, vram_pct) = device.memory_info()
                            .map(|m| {
                                let total = m.total;
                                let used = m.used;
                                let pct = if total > 0 { (used as f64 / total as f64 * 100.0) as f32 } else { 0.0 };
                                (total, used, pct)
                            })
                            .unwrap_or((0, 0, 0.0));

                        // Utilization
                        let gpu_usage = device.utilization_rates()
                            .map(|u| u.gpu as f32)
                            .unwrap_or(0.0);

                        // Temperature
                        let temperature = device.temperature(nvml_wrapper::enum_wrappers::device::TemperatureSensor::Gpu)
                            .ok()
                            .map(|t| t as f32);

                        // Power
                        let power_watts = device.power_usage()
                            .ok()
                            .map(|p| p as f32 / 1000.0);

                        // Clocks
                        let freq_mhz = device.clock_info(nvml_wrapper::enum_wrappers::device::Clock::Graphics).ok();
                        let max_freq_mhz = device.max_clock_info(nvml_wrapper::enum_wrappers::device::Clock::Graphics).ok();
                        let mem_freq_mhz = device.clock_info(nvml_wrapper::enum_wrappers::device::Clock::Memory).ok();

                        // Power limit
                        let power_limit_watts = device.power_management_limit()
                            .ok()
                            .map(|p| p as f32 / 1000.0);

                        // Fan speed (first fan, 0-100%)
                        let fan_speed_percent = device.fan_speed(0).ok();

                        nvml_gpus.push(GpuInfo {
                            index: i as usize,
                            name: name.to_string(),
                            vendor: "NVIDIA".to_string(),
                            driver: device.nvml().sys_driver_version().unwrap_or_default().to_string(),
                            vram_total_bytes: vram_total,
                            vram_used_bytes: vram_used,
                            vram_usage_percent: vram_pct,
                            gpu_usage_percent: gpu_usage,
                            temperature,
                            power_watts,
                            power_limit_watts,
                            freq_mhz,
                            max_freq_mhz,
                            mem_freq_mhz,
                            fan_speed_percent,
                            fan_rpm: None,
                            card_path: uuid.unwrap_or_default().to_string(),
                        });
                    }
                }
            }
        }
    }

    #[cfg(feature = "nvidia")]
    if !nvml_gpus.is_empty() {
        return GpuStats {
            gpus: nvml_gpus,
            platform_note: None,
        };
    }

    // ── WMI Fallback for AMD/Intel/Other ──
    let com = match COMLibrary::without_security() {
        Ok(c) => c,
        Err(e) => {
            let note = format!("WMI COM init failed: {e}. ");
            #[cfg(feature = "nvidia")]
            let note = format!("{}NVML: {}", note, nvml_err.as_deref().unwrap_or("NVIDIA GPUs not found"));
            #[cfg(not(feature = "nvidia"))]
            let note = format!("{}NVML not compiled in.", note);
            return GpuStats {
                gpus: vec![],
                platform_note: Some(note),
            };
        }
    };

    let wmi = match WMIConnection::new(com.into()) {
        Ok(w) => w,
        Err(e) => {
            let note = format!("WMI connection failed: {e}. ");
            #[cfg(feature = "nvidia")]
            let note = format!("{}NVML: {}", note, nvml_err.as_deref().unwrap_or("NVIDIA GPUs not found"));
            #[cfg(not(feature = "nvidia"))]
            let note = format!("{}NVML not compiled in.", note);
            return GpuStats {
                gpus: vec![],
                platform_note: Some(note),
            };
        }
    };

    let controllers: Vec<VideoController> = wmi
        .raw_query("SELECT Name, DriverVersion, AdapterRAM, PNPDeviceID FROM Win32_VideoController")
        .unwrap_or_default();

    if controllers.is_empty() {
        let note = "No GPUs detected via WMI. ".to_string();
        #[cfg(feature = "nvidia")]
        let note = format!("{}NVML: {}", note, nvml_err.as_deref().unwrap_or("NVIDIA GPUs not found"));
        #[cfg(not(feature = "nvidia"))]
        let note = format!("{}NVML not compiled in.", note);
        return GpuStats {
            gpus: vec![],
            platform_note: Some(note),
        };
    }

    let components = sysinfo::Components::new_with_refreshed_list();

    let gpus: Vec<GpuInfo> = controllers
        .into_iter()
        .filter(|g| {
            // Skip Microsoft Basic Display Adapter and Remote Desktop virtual GPUs
            !g.name.contains("Basic Display") && !g.name.contains("Remote Desktop")
        })
        .enumerate()
        .map(|(i, gpu)| {
            let pnp = gpu.pnp_device_id.as_deref().unwrap_or("");
            let vendor = if pnp.contains("VEN_10DE") || gpu.name.to_ascii_uppercase().contains("NVIDIA") {
                "NVIDIA".to_string()
            } else if pnp.contains("VEN_1002") || gpu.name.to_ascii_uppercase().contains("AMD") || gpu.name.to_ascii_uppercase().contains("RADEON") {
                "AMD".to_string()
            } else if pnp.contains("VEN_8086") || gpu.name.to_ascii_uppercase().contains("INTEL") {
                "Intel".to_string()
            } else {
                "Unknown".to_string()
            };

            // Try to match temperature from sysinfo components
            let temperature = components.iter()
                .find(|c| c.label().to_ascii_lowercase().contains("gpu"))
                .and_then(|c| c.temperature());

            // AdapterRAM is a uint32 in WMI — max 4 GB (limitation of Win32_VideoController)
            let vram_total = gpu.adapter_ram.unwrap_or(0) as u64;

            GpuInfo {
                index: i,
                name: gpu.name,
                vendor,
                driver: gpu.driver_version.unwrap_or_else(|| "—".to_string()),
                vram_total_bytes: vram_total,
                vram_used_bytes: 0,
                vram_usage_percent: 0.0,
                gpu_usage_percent: 0.0,
                temperature,
                power_watts: None,
                power_limit_watts: None,
                freq_mhz: None,
                max_freq_mhz: None,
                mem_freq_mhz: None,
                fan_speed_percent: None,
                fan_rpm: None,
                card_path: String::new(),
            }
        })
        .collect();

    let note = if gpus.is_empty() {
        Some("No physical GPUs detected. Virtual GPUs filtered out.".to_string())
    } else {
        None
    };

    GpuStats { gpus, platform_note: note }
}

// ── macOS / other ─────────────────────────────────────────────────────────────
#[cfg(not(any(target_os = "linux", target_os = "windows")))]
#[tauri::command]
pub fn get_gpu_stats() -> GpuStats {
    #[cfg(target_os = "macos")]
    let note = "GPU monitoring on macOS requires IOKit integration — coming soon.".to_string();
    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    let note = "GPU monitoring is not yet supported on this platform.".to_string();
    GpuStats { gpus: vec![], platform_note: Some(note) }
}

#[cfg(target_os = "linux")]
use std::fs;
#[cfg(target_os = "linux")]
use std::path::Path;
#[cfg(target_os = "linux")]
use crate::models::gpu::GpuInfo;

#[cfg(target_os = "linux")]
fn read_sysfs(path: &str) -> Option<String> {
    fs::read_to_string(path).ok().map(|s| s.trim().to_string())
}

#[cfg(target_os = "linux")]
fn read_sysfs_u64(path: &str) -> Option<u64> {
    read_sysfs(path)?.parse().ok()
}

#[cfg(target_os = "linux")]
fn read_sysfs_f32(path: &str) -> Option<f32> {
    read_sysfs(path)?.parse().ok()
}

#[cfg(target_os = "linux")]
fn pci_id_to_name(vendor_id: &str, device_id: &str) -> Option<String> {
    let vid = vendor_id.to_lowercase();
    let did = device_id.to_lowercase();

    let db_paths = [
        "/usr/share/misc/pci.ids",
        "/usr/share/hwdata/pci.ids",
        "/usr/share/pci.ids",
    ];
    for db in &db_paths {
        if let Ok(content) = fs::read_to_string(db) {
            let mut in_vendor = false;
            for line in content.lines() {
                // Skip comments and empty lines
                if line.starts_with('#') || line.is_empty() {
                    continue;
                }
                // Vendor line: 4 hex chars followed by spaces and name
                if !line.starts_with('\t') {
                    let parts: Vec<&str> = line.splitn(2, "  ").collect();
                    if parts.len() >= 1 {
                        in_vendor = parts[0].trim().to_lowercase() == vid;
                    }
                    continue;
                }
                if !in_vendor {
                    continue;
                }
                // Device line: \t + 4 hex chars + spaces + name
                if line.starts_with('\t') && !line.starts_with("\t\t") {
                    let trimmed = line.trim_start_matches('\t');
                    let parts: Vec<&str> = trimmed.splitn(2, "  ").collect();
                    if parts.len() == 2 && parts[0].trim().to_lowercase() == did {
                        return Some(parts[1].trim().to_string());
                    }
                }
            }
        }
    }
    None
}

#[cfg(target_os = "linux")]
fn gpu_name(card_path: &Path) -> String {
    let uevent_path = card_path.join("device/uevent");
    if let Some(ev) = read_sysfs(uevent_path.to_str().unwrap_or("")) {
        let mut pci_id_val = String::new();
        let mut slot = String::new();
        for line in ev.lines() {
            if let Some(v) = line.strip_prefix("PCI_ID=") {
                pci_id_val = v.to_string();
            }
            if let Some(v) = line.strip_prefix("PCI_SLOT_NAME=") {
                slot = v.to_string();
            }
        }
        // Try PCI ID lookup first
        if !pci_id_val.is_empty() {
            let parts: Vec<&str> = pci_id_val.splitn(2, ':').collect();
            if parts.len() == 2 {
                let vendor_prefix = match parts[0].to_uppercase().as_str() {
                    "8086" => "Intel",
                    "1002" => "AMD",
                    "10DE" => "NVIDIA",
                    _ => "",
                };
                if let Some(device_name) = pci_id_to_name(parts[0], parts[1]) {
                    // Only prepend vendor if not already in the name
                    if !vendor_prefix.is_empty() && !device_name.to_uppercase().contains(&vendor_prefix.to_uppercase()) {
                        return format!("{} {}", vendor_prefix, device_name);
                    }
                    return device_name;
                }
                // Generic fallback with readable IDs
                let vid_up = parts[0].to_uppercase();
                let did_up = parts[1].to_uppercase();
                if !vendor_prefix.is_empty() {
                    return format!("{} GPU [{vid_up}:{did_up}]", vendor_prefix);
                }
                return format!("GPU [{vid_up}:{did_up}]");
            }
        }
        if !slot.is_empty() {
            return format!("GPU @ {}", slot);
        }
    }
    card_path
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| "Unknown GPU".to_string())
}

#[cfg(target_os = "linux")]
fn gpu_vendor(card_path: &Path) -> String {
    let vendor_path = card_path.join("device/vendor");
    match read_sysfs(vendor_path.to_str().unwrap_or("")).as_deref() {
        Some("0x10de") => "NVIDIA".to_string(),
        Some("0x1002") => "AMD".to_string(),
        Some("0x8086") => "Intel".to_string(),
        Some(v) => v.to_string(),
        None => "Unknown".to_string(),
    }
}

#[cfg(target_os = "linux")]
fn gpu_driver(card_path: &Path) -> String {
    // Canonicalize resolves the relative symlink to absolute path, then take the last component
    let driver_path = card_path.join("device/driver");
    if let Ok(canonical) = fs::canonicalize(&driver_path) {
        if let Some(name) = canonical.file_name() {
            return name.to_string_lossy().to_string();
        }
    }
    "—".to_string()
}

#[cfg(target_os = "linux")]
fn gpu_vram(card_path: &Path) -> (u64, u64) {
    // AMD: mem_info_vram_total / mem_info_vram_used (bytes)
    let total_path = card_path.join("device/mem_info_vram_total");
    let used_path  = card_path.join("device/mem_info_vram_used");
    let total = read_sysfs_u64(total_path.to_str().unwrap_or("")).unwrap_or(0);
    let used  = read_sysfs_u64(used_path.to_str().unwrap_or("")).unwrap_or(0);
    // Intel iGPU: no dedicated VRAM — total stays 0
    (total, used)
}

#[cfg(target_os = "linux")]
fn gpu_usage(card_path: &Path) -> f32 {
    // AMD: gpu_busy_percent
    let busy_path = card_path.join("device/gpu_busy_percent");
    if let Some(v) = read_sysfs_f32(busy_path.to_str().unwrap_or("")) {
        return v;
    }
    // Intel i915: use act_freq / max_freq as proxy (gt_act_freq_mhz on card root)
    let act_path = card_path.join("gt_act_freq_mhz");
    let max_path = card_path.join("gt_RP0_freq_mhz");
    if let (Some(act), Some(max)) = (
        read_sysfs_f32(act_path.to_str().unwrap_or("")),
        read_sysfs_f32(max_path.to_str().unwrap_or("")),
    ) {
        if max > 0.0 {
            return (act / max * 100.0).clamp(0.0, 100.0);
        }
    }
    // Intel i915 gt/gt0 path
    let gt0_act = card_path.join("gt/gt0/rps_act_freq_mhz");
    let gt0_max = card_path.join("gt/gt0/rps_max_freq_mhz");
    if let (Some(act), Some(max)) = (
        read_sysfs_f32(gt0_act.to_str().unwrap_or("")),
        read_sysfs_f32(gt0_max.to_str().unwrap_or("")),
    ) {
        if max > 0.0 {
            return (act / max * 100.0).clamp(0.0, 100.0);
        }
    }
    0.0
}

#[cfg(target_os = "linux")]
fn gpu_freq_mhz(card_path: &Path) -> Option<u32> {
    // Intel: current clock frequency in MHz
    let paths = [
        card_path.join("gt_act_freq_mhz"),
        card_path.join("gt/gt0/rps_act_freq_mhz"),
        card_path.join("gt/gt0/rps_cur_freq_mhz"),
    ];
    for p in &paths {
        if let Some(v) = read_sysfs_u64(p.to_str().unwrap_or("")) {
            if v > 0 {
                return Some(v as u32);
            }
        }
    }
    None
}

#[cfg(target_os = "linux")]
fn gpu_max_freq_mhz(card_path: &Path) -> Option<u32> {
    let paths = [
        card_path.join("gt_RP0_freq_mhz"),
        card_path.join("gt/gt0/rps_max_freq_mhz"),
        card_path.join("gt/gt0/rps_RP0_freq_mhz"),
    ];
    for p in &paths {
        if let Some(v) = read_sysfs_u64(p.to_str().unwrap_or("")) {
            if v > 0 {
                return Some(v as u32);
            }
        }
    }
    None
}

#[cfg(target_os = "linux")]
fn gpu_temp(card_path: &Path) -> Option<f32> {
    // Try hwmon under device/hwmon/hwmon*/temp1_input (millidegrees)
    let hwmon_dir = card_path.join("device/hwmon");
    if let Ok(entries) = fs::read_dir(&hwmon_dir) {
        for entry in entries.flatten() {
            let temp_path = entry.path().join("temp1_input");
            if let Some(raw) = read_sysfs_f32(temp_path.to_str().unwrap_or("")) {
                return Some(raw / 1000.0);
            }
        }
    }
    // Also try direct hwmon under card
    let hwmon_direct = card_path.join("hwmon");
    if let Ok(entries) = fs::read_dir(&hwmon_direct) {
        for entry in entries.flatten() {
            let temp_path = entry.path().join("temp1_input");
            if let Some(raw) = read_sysfs_f32(temp_path.to_str().unwrap_or("")) {
                return Some(raw / 1000.0);
            }
        }
    }
    // Fallback: sysinfo components looking for GPU/edge temp labels
    let components = sysinfo::Components::new_with_refreshed_list();
    for c in components.iter() {
        let label = c.label().to_lowercase();
        if label.contains("gpu") || label.contains("edge") || label.contains("junction") {
            if let Some(t) = c.temperature() {
                return Some(t);
            }
        }
    }
    None
}

#[cfg(target_os = "linux")]
fn gpu_power(card_path: &Path) -> Option<f32> {
    // AMD: hwmon power1_average (microwatts)
    let hwmon_dir = card_path.join("device/hwmon");
    if let Ok(entries) = fs::read_dir(&hwmon_dir) {
        for entry in entries.flatten() {
            let power_path = entry.path().join("power1_average");
            if let Some(raw) = read_sysfs_f32(power_path.to_str().unwrap_or("")) {
                return Some(raw / 1_000_000.0);
            }
        }
    }
    None
}

#[cfg(target_os = "linux")]
fn gpu_power_limit(card_path: &Path) -> Option<f32> {
    // AMD: hwmon power1_cap (microwatts)
    let hwmon_dir = card_path.join("device/hwmon");
    if let Ok(entries) = fs::read_dir(&hwmon_dir) {
        for entry in entries.flatten() {
            let cap_path = entry.path().join("power1_cap");
            if let Some(raw) = read_sysfs_f32(cap_path.to_str().unwrap_or("")) {
                return Some(raw / 1_000_000.0);
            }
        }
    }
    None
}

#[cfg(target_os = "linux")]
fn gpu_mem_freq_mhz(card_path: &Path) -> Option<u32> {
    // AMD: pp_dpm_mclk — current memory clock (last line with * marker)
    let mclk_path = card_path.join("device/pp_dpm_mclk");
    if let Some(content) = read_sysfs(mclk_path.to_str().unwrap_or("")) {
        for line in content.lines().rev() {
            if line.contains('*') {
                // Format: "2: 1000Mhz *"
                if let Some(mhz) = line.split_whitespace()
                    .find(|s| s.to_lowercase().ends_with("mhz"))
                    .and_then(|s| s[..s.len()-3].parse::<u32>().ok())
                {
                    return Some(mhz);
                }
            }
        }
    }
    None
}

#[cfg(target_os = "linux")]
fn gpu_fan(card_path: &Path) -> (Option<u32>, Option<u32>) {
    // hwmon: fan1_input (RPM), pwm1 (0-255 → %)
    let hwmon_dir = card_path.join("device/hwmon");
    if let Ok(entries) = fs::read_dir(&hwmon_dir) {
        for entry in entries.flatten() {
            let base = entry.path();
            let rpm = read_sysfs_u64(base.join("fan1_input").to_str().unwrap_or(""))
                .map(|v| v as u32);
            let pct = read_sysfs_u64(base.join("pwm1").to_str().unwrap_or(""))
                .map(|v| (v * 100 / 255) as u32);
            if rpm.is_some() || pct.is_some() {
                return (pct, rpm);
            }
        }
    }
    (None, None)
}

#[cfg(target_os = "linux")]
#[tauri::command]
pub fn get_gpu_stats() -> GpuStats {
    let drm_path = Path::new("/sys/class/drm");
    let mut gpus: Vec<GpuInfo> = Vec::new();

    let mut entries: Vec<_> = fs::read_dir(drm_path)
        .map(|d| d.flatten().collect())
        .unwrap_or_default();
    entries.sort_by_key(|e| e.file_name());

    let mut index = 0usize;
    for entry in entries {
        let name = entry.file_name();
        let name_str = name.to_string_lossy();
        // Only top-level cardN entries, not cardN-* connectors
        if !name_str.starts_with("card") || name_str.contains('-') {
            continue;
        }

        let card_path = entry.path();

        // Skip virtual / non-GPU entries (no vendor file = virtual)
        let vendor_file = card_path.join("device/vendor");
        if !vendor_file.exists() {
            continue;
        }

        let vendor        = gpu_vendor(&card_path);
        let gpu_name_str  = gpu_name(&card_path);
        let driver        = gpu_driver(&card_path);
        let (vram_total, vram_used) = gpu_vram(&card_path);
        let vram_pct = if vram_total > 0 {
            (vram_used as f32 / vram_total as f32) * 100.0
        } else {
            0.0
        };
        let usage        = gpu_usage(&card_path);
        let temperature  = gpu_temp(&card_path);
        let power        = gpu_power(&card_path);
        let power_limit  = gpu_power_limit(&card_path);
        let freq_mhz     = gpu_freq_mhz(&card_path);
        let max_freq_mhz = gpu_max_freq_mhz(&card_path);
        let mem_freq_mhz = gpu_mem_freq_mhz(&card_path);
        let (fan_pct, fan_rpm) = gpu_fan(&card_path);

        gpus.push(GpuInfo {
            index,
            name: gpu_name_str,
            vendor,
            driver,
            vram_total_bytes: vram_total,
            vram_used_bytes: vram_used,
            vram_usage_percent: vram_pct,
            gpu_usage_percent: usage,
            temperature,
            power_watts: power,
            power_limit_watts: power_limit,
            freq_mhz,
            max_freq_mhz,
            mem_freq_mhz,
            fan_speed_percent: fan_pct,
            fan_rpm,
            card_path: card_path.to_string_lossy().to_string(),
        });
        index += 1;
    }

    GpuStats { gpus, platform_note: None }
}
