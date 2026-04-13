use tauri::State;
use sysinfo::{Signal, ProcessesToUpdate, ProcessRefreshKind};
use crate::models::process::ProcessInfo;
use crate::state::SysState;

#[tauri::command]
pub fn get_processes(state: State<SysState>) -> Vec<ProcessInfo> {
    let mut sys = state.sys.lock().unwrap();

    let refresh_kind = ProcessRefreshKind::everything();
    sys.refresh_processes_specifics(ProcessesToUpdate::All, true, refresh_kind);

    let cpu_count = sys.cpus().len().max(1) as f32;

    let mut procs: Vec<ProcessInfo> = sys.processes().iter().filter_map(|(pid, proc)| {
        // Skip all threads (kernel and userland) — only real processes
        if proc.thread_kind().is_some() { return None; }

        let name = proc.name().to_string_lossy().to_string();
        if name.is_empty() { return None; }

        let exe = proc.exe().map(|p| p.to_string_lossy().to_string()).unwrap_or_default();
        let user = proc.user_id()
            .map(|u| u.to_string())
            .unwrap_or_else(|| "—".to_string());

        Some(ProcessInfo {
            pid: pid.as_u32(),
            parent_pid: proc.parent().map(|p| p.as_u32()),
            name,
            exe,
            status: format!("{:?}", proc.status()),
            cpu_usage: proc.cpu_usage() / cpu_count,
            memory_bytes: proc.memory(),
            virtual_memory_bytes: proc.virtual_memory(),
            read_bytes: proc.disk_usage().read_bytes,
            written_bytes: proc.disk_usage().written_bytes,
            started_at: proc.start_time() as i64,
            user,
        })
    }).collect();

    procs.sort_by(|a, b| b.cpu_usage.partial_cmp(&a.cpu_usage).unwrap_or(std::cmp::Ordering::Equal));
    procs
}

#[tauri::command]
pub fn kill_process(state: State<SysState>, pid: u32) -> Result<(), String> {
    let sys = state.sys.lock().unwrap();
    let pid_obj = sysinfo::Pid::from_u32(pid);
    if let Some(process) = sys.process(pid_obj) {
        if process.kill_with(Signal::Kill).is_none() {
            process.kill();
        }
        Ok(())
    } else {
        Err(format!("Process with PID {} not found", pid))
    }
}
