use std::sync::Mutex;
use std::time::Instant;
use sysinfo::{System, Networks};

pub struct SysState {
    pub sys: Mutex<System>,
    pub net: Mutex<Networks>,
    net_last: Mutex<Instant>,
}

impl SysState {
    pub fn new() -> Self {
        let mut sys = System::new_all();
        sys.refresh_all();
        let net = Networks::new_with_refreshed_list();
        SysState {
            sys: Mutex::new(sys),
            net: Mutex::new(net),
            net_last: Mutex::new(Instant::now()),
        }
    }

    pub fn net_elapsed_secs(&self) -> f64 {
        let mut last = self.net_last.lock().unwrap();
        let elapsed = last.elapsed().as_secs_f64();
        *last = Instant::now();
        elapsed.max(0.1)
    }
}
