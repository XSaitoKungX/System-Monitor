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

    // ── raw-cpuid: cache sizes, architecture, feature flags ──────────────────
    let cpuid = raw_cpuid::CpuId::new();

    let architecture = std::env::consts::ARCH.to_string();

    let (cache_l1_kb, cache_l2_kb, cache_l3_kb) = cpuid
        .get_cache_parameters()
        .map(|mut params| {
            let mut l1: Option<u32> = None;
            let mut l2: Option<u32> = None;
            let mut l3: Option<u32> = None;
            while let Some(p) = params.next() {
                use raw_cpuid::CacheType;
                if p.cache_type() == CacheType::Null { break; }
                let kb = p.sets() as u32 * p.associativity() as u32 * p.coherency_line_size() as u32 / 1024;
                match p.level() {
                    1 => { l1 = Some(l1.unwrap_or(0) + kb); }
                    2 => { l2 = Some(l2.unwrap_or(0) + kb); }
                    3 => { l3 = Some(l3.unwrap_or(0) + kb); }
                    _ => {}
                }
            }
            (l1, l2, l3)
        })
        .unwrap_or((None, None, None));

    let features: Vec<String> = cpuid.get_feature_info().map(|f| {
        let mut feats = Vec::new();
        if f.has_avx()   { feats.push("AVX".to_string()); }
        if f.has_sse()   { feats.push("SSE".to_string()); }
        if f.has_sse2()  { feats.push("SSE2".to_string()); }
        if f.has_sse3()  { feats.push("SSE3".to_string()); }
        if f.has_sse41() { feats.push("SSE4.1".to_string()); }
        if f.has_sse42() { feats.push("SSE4.2".to_string()); }
        if f.has_fma()   { feats.push("FMA".to_string()); }
        if f.has_aesni() { feats.push("AES-NI".to_string()); }
        if f.has_movbe() { feats.push("MOVBE".to_string()); }
        feats
    }).unwrap_or_default();

    CpuStats {
        usage_total,
        usage_per_core,
        frequency_mhz,
        physical_cores,
        logical_cores,
        brand,
        vendor,
        temperature,
        architecture,
        cache_l1_kb,
        cache_l2_kb,
        cache_l3_kb,
        features,
    }
}
