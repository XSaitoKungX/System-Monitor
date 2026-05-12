use tauri::State;
use crate::models::cpu::CpuStats;
use crate::state::SysState;

#[tauri::command]
pub fn get_cpu_stats(state: State<SysState>) -> CpuStats {
    let mut sys = state.sys.lock().unwrap();
    sys.refresh_cpu_all();

    let cpus = sys.cpus();
    let usage_per_core: Vec<f32> = cpus.iter().map(|c| c.cpu_usage()).collect();

    // global_cpu_usage() is more accurate than averaging per-core values because
    // sysinfo derives it from the global /proc/stat tick counters directly.
    let usage_total = sys.global_cpu_usage();

    // Report the maximum frequency across all cores (avoids showing a single
    // potentially-idle core as representative of the whole CPU).
    let frequency_mhz = cpus.iter().map(|c| c.frequency()).max().unwrap_or(0);
    let brand = cpus.first().map(|c| c.brand().to_string()).unwrap_or_default();
    let vendor = cpus.first().map(|c| c.vendor_id().to_string()).unwrap_or_default();
    let physical_cores = sys.physical_core_count().unwrap_or(0);
    let logical_cores = cpus.len();

    // Reuse the shared Components from state instead of allocating a new list
    // on every call — prevents OS handle exhaustion and reduces overhead.
    let temperature = {
        let mut components = state.components.lock().unwrap();
        components.refresh(false);
        components
            .iter()
            .find(|c| {
                let l = c.label().to_lowercase();
                l.contains("cpu") || l.contains("tdie") || l.contains("tctl") || l.contains("core")
            })
            .and_then(|c| c.temperature())
    };

    let architecture = std::env::consts::ARCH.to_string();

    // ── raw-cpuid: cache sizes + feature flags (x86/x86_64 only) ─────────────
    #[cfg(any(target_arch = "x86", target_arch = "x86_64"))]
    let (cache_l1_kb, cache_l2_kb, cache_l3_kb, features) = {
        let cpuid = raw_cpuid::CpuId::new();
        let (mut l1, mut l2, mut l3) = (None::<u32>, None::<u32>, None::<u32>);
        if let Some(mut params) = cpuid.get_cache_parameters() {
            while let Some(p) = params.next() {
                use raw_cpuid::CacheType;
                if p.cache_type() == CacheType::Null { break; }
                // guard against zero-values that would give bogus KB counts
                let sets = p.sets() as u32;
                let assoc = p.associativity() as u32;
                let line = p.coherency_line_size() as u32;
                if sets == 0 || assoc == 0 || line == 0 { continue; }
                let kb = sets * assoc * line / 1024;
                match p.level() {
                    1 => { l1 = Some(l1.unwrap_or(0) + kb); }
                    2 => { l2 = Some(l2.unwrap_or(0) + kb); }
                    3 => { l3 = Some(l3.unwrap_or(0) + kb); }
                    _ => {}
                }
            }
        }
        let mut feats: Vec<String> = cpuid.get_feature_info().map(|f| {
            let mut v = Vec::new();
            if f.has_sse()   { v.push("SSE".to_string()); }
            if f.has_sse2()  { v.push("SSE2".to_string()); }
            if f.has_sse3()  { v.push("SSE3".to_string()); }
            if f.has_sse41() { v.push("SSE4.1".to_string()); }
            if f.has_sse42() { v.push("SSE4.2".to_string()); }
            if f.has_avx()   { v.push("AVX".to_string()); }
            if f.has_fma()   { v.push("FMA".to_string()); }
            if f.has_aesni() { v.push("AES-NI".to_string()); }
            if f.has_movbe() { v.push("MOVBE".to_string()); }
            v
        }).unwrap_or_default();
        // AVX2 and AVX-512 are in extended feature flags, not basic feature info
        if let Some(ef) = cpuid.get_extended_feature_info() {
            if ef.has_avx2()    { feats.push("AVX2".to_string()); }
            if ef.has_avx512f() { feats.push("AVX-512F".to_string()); }
        }
        (l1, l2, l3, feats)
    };

    #[cfg(not(any(target_arch = "x86", target_arch = "x86_64")))]
    let (cache_l1_kb, cache_l2_kb, cache_l3_kb, features) =
        (None::<u32>, None::<u32>, None::<u32>, Vec::<String>::new());

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
