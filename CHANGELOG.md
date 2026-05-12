# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> From v0.3.0 onwards this file is generated automatically on each release via `git-cliff`.

---

## [0.3.0] - 2026-05-11

### Fixed
- **cpu**: `usage_total` now uses `global_cpu_usage()` (accurate tick-based global average) instead of manual per-core average which over-counted idle cores
- **cpu**: `Components` list was re-allocated on every call — now shared via `SysState` (prevents OS handle exhaustion)
- **cpu**: cache KB calculation guarded against zero `sets`/`associativity`/`line_size` values that produced bogus results
- **disk**: `read_bytes_per_sec` / `write_bytes_per_sec` were always `0` — now computed from delta between refreshes
- **disk**: switched from a fresh `Disks::new_with_refreshed_list()` each call to the shared `Disks` in `SysState`
- **memory**: `parse_meminfo_kb("Cached:", …)` matched `CachedSwap:` and `CachedFiles:` lines — fixed to require exact key + colon
- **memory**: usage percent computed with `f64` intermediate to avoid precision loss on large RAM values
- **network**: primary `rx/tx` fallback was erroneously set to `total_rx/tx` when no primary interface found — now `(0, 0)`
- **network**: `wlan`/`wifi` prefix variants added to interface-type detection
- **network**: `bond` and `team` added to virtual-interface blocklist
- **processes**: `status` used `{:?}` debug formatting producing `"Run(Run)"` — replaced with proper human-readable match
- **gpu (Windows)**: NVML was initialised twice (availability check + inner block) — rewritten to initialise exactly once and reuse the handle
- **gpu (Windows)**: `#[cfg(feature)]` applied to bare `if` expression caused syntax errors — moved into a properly scoped `cfg` block
- **lib**: `get_disk_stats()` call was missing its `State<SysState>` argument (compile error)
- **lib**: `interval_state` mutex lock was held across the entire stats-collection loop — now dropped immediately after reading
- **lib**: `update_window_behavior` called `app.manage()` which panics on second invocation — replaced with a managed `Arc<Mutex<bool>>`

### Added
- **cpu**: AVX2 and AVX-512F feature flags (from extended CPUID leaf, not basic)
- **cpu**: `frequency_mhz` now reports the maximum across all cores instead of first-core value
- **cpu**: temperature label matching extended to `tdie`/`tctl` (AMD Ryzen sensors)
- **disk**: `disk_type` field (`NVMe` / `SSD` / `HDD` / `eMMC` / `Unknown`)
- **network**: `errors_on_received` and `errors_on_transmitted` per interface
- **processes**: `run_time_secs` (process uptime in seconds) and `cmd` (full command-line argv)
- **system**: `username` (from `$USER`/`$USERNAME`) and `locale` (from `$LANG`/`$LC_ALL`)
- **gpu**: `encoder_percent` and `decoder_percent` fields (populated via NVML on NVIDIA GPUs)
- **state**: shared `Components` and `Disks` in `SysState`; disk I/O prev-snapshot map and elapsed-time tracking

---

## [0.2.2] - 2026-04-14

### Fixed
- CI: simplify workflow — `tauri-action@v0.6.2` handles release deduplication internally
- CI: fix output key mismatch `release_id` + gh CLI for `create-release`
- aarch64 build + CI race condition

### Added
- GPU fan speed, power draw, memory clock
- CPU cache size, architecture info, feature flags
- RAM detail breakdown (used / available / cached / buffers)
- Tauri Push-Events refactor for lower CPU overhead

---

## [0.2.1] - 2026-04-14

### Fixed
- GPU NVML struct casing on Windows (`NVML` → `Nvml`) + E0282 type annotation

### Added
- Auto-updater with signing via `tauri-plugin-updater`
- Updater UI in Settings page
- GPU monitoring on Windows via WMI

### Changed
- CI: switched to `ubuntu-24.04` LTS, dropped pinned Rust 1.85 (use `stable`)
- CI: upgraded `tauri-action` to v0.6 (Node.js 24)

---

## [0.2.0] - 2026-04-13

### Added
- System tray support — app hides to tray on window close
- Windows GPU monitoring via DXGI/WMI
- Security hardening (Tauri v2 capabilities)
- Installer configuration (NSIS / WiX)

### Fixed
- Tray / close button behaviour on all platforms

---

## [0.1.0] - 2026-04-13

### Added
- Initial release
- Dashboard with system health score and overview cards
- CPU monitoring — total + per-core, frequency, temperature, history chart
- Memory monitoring — RAM & Swap with history chart
- GPU monitoring — Linux sysfs (AMD / Intel) + optional NVML (NVIDIA)
- Disk monitoring — capacity, usage, read/write I/O per partition
- Network monitoring — upload/download speed, per-interface stats
- Speedtest — Cloudflare-based download/upload/ping
- Process list — sortable, searchable, kill with double-confirm
- Settings — theme switcher, refresh interval, alert thresholds
- 5 themes: Default, Dark, Light, Space, Dev (glassmorphism)
- Cross-platform builds: Linux (`.deb` `.rpm` `.AppImage`), Windows (`.exe` `.msi`), macOS (`.dmg` `.app`)

[0.3.0]: https://github.com/XSaitoKungX/System-Monitor/compare/v0.2.2...v0.3.0
[0.2.2]: https://github.com/XSaitoKungX/System-Monitor/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/XSaitoKungX/System-Monitor/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/XSaitoKungX/System-Monitor/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/XSaitoKungX/System-Monitor/releases/tag/v0.1.0
