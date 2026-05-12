use std::collections::HashMap;
use std::sync::Mutex;
use std::time::Instant;
use sysinfo::{System, Networks, Components, Disks};

pub struct SysState {
    pub sys: Mutex<System>,
    pub net: Mutex<Networks>,
    pub components: Mutex<Components>,
    pub disks: Mutex<Disks>,
    /// (read_bytes, write_bytes) snapshot taken at the last disk poll
    pub disk_io_prev: Mutex<HashMap<String, (u64, u64)>>,
    net_last: Mutex<Instant>,
    disk_last: Mutex<Instant>,
}

impl SysState {
    pub fn new() -> Self {
        let mut sys = System::new_all();
        sys.refresh_all();
        let net = Networks::new_with_refreshed_list();
        let components = Components::new_with_refreshed_list();
        let disks = Disks::new_with_refreshed_list();
        SysState {
            sys: Mutex::new(sys),
            net: Mutex::new(net),
            components: Mutex::new(components),
            disks: Mutex::new(disks),
            disk_io_prev: Mutex::new(HashMap::new()),
            net_last: Mutex::new(Instant::now()),
            disk_last: Mutex::new(Instant::now()),
        }
    }

    /// Returns seconds elapsed since the last network refresh and resets the clock.
    pub fn net_elapsed_secs(&self) -> f64 {
        let mut last = self.net_last.lock().unwrap();
        let elapsed = last.elapsed().as_secs_f64();
        *last = Instant::now();
        elapsed.max(0.1)
    }

    /// Returns seconds elapsed since the last disk I/O refresh and resets the clock.
    pub fn disk_elapsed_secs(&self) -> f64 {
        let mut last = self.disk_last.lock().unwrap();
        let elapsed = last.elapsed().as_secs_f64();
        *last = Instant::now();
        elapsed.max(0.1)
    }
}
