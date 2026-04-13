# System Monitor

> Modern, open-source replacement for Task Manager, htop and btop — built with Tauri v2 + React 18 + Rust.

**Website:** https://xsaitox.dev/en/system-monitor  
**License:** MIT  
**Platform:** Linux · Windows · macOS

![GitHub release](https://img.shields.io/github/v/release/XSaitoKungX/System-Monitor?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)
![Tauri](https://img.shields.io/badge/Tauri-v2-yellow?style=flat-square)
![Rust](https://img.shields.io/badge/Rust-stable-orange?style=flat-square)

---

## Features

| Page | Description |
|------|-------------|
| **Dashboard** | System health score, uptime, CPU / RAM / Disk / Network overview cards |
| **CPU** | Total + per-core usage, frequency, temperature, 60-point history chart |
| **Memory** | RAM & Swap usage with history chart |
| **GPU** | Usage arc, clock frequency, temperature, VRAM (AMD) — Linux only via sysfs / PCI DB |
| **Disk** | Capacity, usage ring, read/write I/O per partition, removable device detection |
| **Network** | Upload/download speed, per-interface stats, bandwidth history chart (B/s → GB/s) |
| **Speedtest** | Multi-stream download/upload, real ping via Cloudflare edge RTT, connection quality scores |
| **Processes** | Sortable list, kill process (double-confirm), search by name / PID |
| **Settings** | Theme switcher, refresh interval, alert thresholds |

### Themes
`Default` · `Dark` · `Light` · `Space` · `Dev` (glassmorphism)

---

## Platform Support

| Feature | Linux | Windows | macOS |
|---------|-------|---------|-------|
| CPU / Memory / Disk / Network | ✅ | ✅ | ✅ |
| Processes | ✅ | ✅ | ✅ |
| GPU monitoring | ✅ sysfs (AMD / Intel) | ⏳ planned (DXGI/NVML) | ⏳ planned (IOKit) |
| Temperature sensors | ✅ | ✅ | ✅ |
| Speedtest | ✅ | ✅ | ✅ |
| Build output | `.deb` `.rpm` `.AppImage` | `.exe` `.msi` | `.dmg` `.app` |

> **Note:** GPU monitoring on Windows and macOS is not yet implemented. The tab will show a platform note instead of crashing.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Tauri v2 |
| Backend | Rust · sysinfo 0.33 · tokio · chrono · nvml-wrapper (optional) |
| Frontend | React 19 · TypeScript (strict) |
| Styling | TailwindCSS v4 · Radix UI · Framer Motion |
| Charts | Recharts |
| State | Zustand |
| Build | Vite 7 · Bun |

---

## Getting Started

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Rust | stable | [rustup.rs](https://rustup.rs/) |
| Bun | ≥ 1.0 | [bun.sh](https://bun.sh/) |

**Linux — additional system dependencies:**
```bash
sudo apt install libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
```

**macOS — Xcode command line tools:**
```bash
xcode-select --install
```

**Windows** — no extra steps required beyond Rust + Bun.

### Installation

```bash
git clone https://github.com/XSaitoKungX/System-Monitor.git
cd System-Monitor
bun install
```

### Development

```bash
bun run dev          # Tauri dev mode — Rust + Vite HMR, hot reload on both sides
```

> **Note:** The first `bun run dev` will compile all Rust dependencies from scratch — this can take 2–5 minutes. Subsequent starts are fast.

### Build (Release)

```bash
bun run build        # Full optimised release build + platform bundles
```

> **Warning:** `bun run build` uses `lto = true` + `codegen-units = 1` for maximum binary optimisation. On a mid-range machine this takes **5–15 minutes** for the Rust compilation step. This is expected behaviour, not a hang.

**Faster local build** (no LTO, less optimised, but ~3× faster to compile):
```bash
bunx tauri build -- --profile release-fast
```

Output locations:
- Linux: `src-tauri/target/release/bundle/` → `.deb`, `.rpm`, `.AppImage`
- Windows: `src-tauri/target/release/bundle/` → `.exe` (NSIS), `.msi`
- macOS: `src-tauri/target/release/bundle/` → `.dmg`, `.app`

---

## Scripts

| Script | Description |
|--------|-------------|
| `bun run dev` | `tauri dev` — full app with HMR |
| `bun run build` | `tauri build` — optimised release bundles |
| `bun run typecheck` | `tsc --noEmit` — TypeScript check without emit |
| `bun run lint` | ESLint over `src/` |
| `bun run vite:dev` | Vite dev server only (no Tauri shell) |
| `bun run vite:build` | Vite production build only |

---

## GPU Monitoring

GPU stats are read from the Linux DRM sysfs interface (`/sys/class/drm/cardN/`):

| Metric | Source | AMD | Intel | NVIDIA (open) |
|--------|--------|-----|-------|---------------|
| GPU name | `/usr/share/misc/pci.ids` PCI DB | ✅ | ✅ | ✅ |
| Driver | `device/driver` symlink | ✅ | ✅ | ✅ |
| GPU load % | `device/gpu_busy_percent` | ✅ | ⚠️ freq proxy | ❌ |
| Clock / Max | `gt_act_freq_mhz` / `gt_RP0_freq_mhz` | — | ✅ | — |
| Temperature | `device/hwmon/*/temp1_input` | ✅ | ❌ | ❌ |
| Power | `device/hwmon/*/power1_average` | ✅ | ❌ | ❌ |
| VRAM | `device/mem_info_vram_*` | ✅ | ❌ shared RAM | ❌ |

> **NVIDIA proprietary driver:** The `nvidia` driver does not expose sysfs entries compatible with the DRM interface by default. Enable the optional `nvidia` feature to use `nvml-wrapper` instead:
> ```bash
> bunx tauri build --features nvidia
> ```

> **Intel iGPU:** No dedicated VRAM — the app shows "Shared system RAM" and displays clock frequency instead of VRAM stats. GPU load is approximated from current / max clock ratio.

---

## Release

Releases are automated via GitHub Actions. Push a semver tag to trigger a cross-platform build:

```bash
git tag v0.2.0
git push --tags
```

The workflow builds on:
- `ubuntu-24.04` → `.deb`, `.rpm`, `.AppImage`
- `windows-latest` → `.exe`, `.msi`
- `macos-latest (arm64)` → `.dmg` (Apple Silicon)
- `macos-latest (x64)` → `.dmg` (Intel Mac)

All artefacts are uploaded as a **draft** GitHub Release. Review and publish manually.

> **Cross-compilation note:** Tauri does **not** support cross-compiling across platforms (e.g. building a `.exe` on Linux). Each platform must build natively. This is handled by the CI matrix above.

---

## Project Structure

```
System-Monitor/
├── .github/
│   └── workflows/
│       └── release.yml         # Cross-platform CI/CD (Linux · Windows · macOS)
├── public/                     # Static assets
├── src/                        # React frontend (TypeScript strict)
│   ├── components/
│   │   ├── charts/             # LineChart (Recharts wrapper)
│   │   ├── layout/             # Sidebar, Header, Layout
│   │   ├── ui/                 # Radix UI primitives
│   │   └── widgets/            # GaugeChart, StatCard, UsageBar …
│   ├── hooks/                  # useSystemStats, useCpuStats, useGpuStats …
│   ├── lib/
│   │   └── utils.ts            # formatBytes, formatBytesPerSec, getUsageColor …
│   ├── pages/                  # Dashboard, CPU, Memory, GPU, Disk, Network,
│   │                           #   Speedtest, Processes, Settings
│   ├── store/                  # Zustand stores (theme, settings, alerts)
│   ├── styles/
│   │   └── globals.css         # CSS custom properties — 5 themes
│   └── types/
│       └── index.ts            # TypeScript interfaces for all Rust responses
├── src-tauri/
│   ├── capabilities/           # Tauri v2 capability definitions
│   ├── icons/                  # App icons (all sizes)
│   ├── src/
│   │   ├── commands/           # cpu, memory, disk, network, gpu, processes, system
│   │   ├── models/             # Rust structs with serde (cpu, memory, disk, …, gpu)
│   │   └── lib.rs              # Tauri app entry — registers all commands
│   ├── build.rs
│   ├── Cargo.lock              # Tracked intentionally (binary crate)
│   ├── Cargo.toml
│   └── tauri.conf.json
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Warnings & Known Limitations

> **Build time:** Full release builds take 5–15 minutes due to Rust LTO. Use `--profile release-fast` for local testing.

> **GPU on Windows/macOS:** Not yet implemented. The GPU tab shows a placeholder message on non-Linux platforms.

> **NVIDIA proprietary driver on Linux:** Requires the optional `nvidia` Cargo feature and the `nvml` library. Without it, NVIDIA GPUs may show N/A for most stats.

> **Intel iGPU load:** Reported as a frequency ratio (current / max clock), not actual render engine utilisation. This is a sysfs limitation — Intel does not expose `gpu_busy_percent` on i915/Xe.

> **Speedtest accuracy:** Uses Cloudflare's `speed.cloudflare.com`. Ping is measured from the `server-timing` response header (Cloudflare edge RTT), not ICMP. Results reflect the connection to the nearest Cloudflare datacenter, not your ISP's peering.

> **Process kill:** Requires appropriate OS permissions. Killing system processes may cause instability. A double-confirmation dialog is shown before any kill is executed.

> **`pci.ids` database:** GPU names are resolved at runtime from `/usr/share/misc/pci.ids` (or `/usr/share/hwdata/pci.ids`). If neither file is present, a generic `Vendor GPU [XXXX:YYYY]` fallback is shown. Install `pciutils` to ensure the database is available.

---

## Custom App Icon

To replace the default Tauri icon with your own:

1. Prepare a **1024×1024 PNG** with transparency (e.g. `my-icon.png`)
2. Run the Tauri icon generator — it produces all required sizes automatically:
   ```bash
   bunx tauri icon ./my-icon.png
   ```
3. This overwrites all files in `src-tauri/icons/` (`.ico`, `.icns`, all `Square*.png`, etc.)
4. Rebuild the app — the new icon appears in the title bar, taskbar, installer and system tray

> The tray icon is loaded at startup from `app.default_window_icon()` set by the bundle config.

## System Tray

The app minimises to the system tray when you close the window (×). It does **not** exit.

| Action | Result |
|--------|--------|
| Click × (close button) | Hides to tray |
| Left-click tray icon | Shows & focuses window |
| Tray → **Show Window** | Shows & focuses window |
| Tray → **Quit System Monitor** | Exits the app completely |

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) or [Windsurf](https://codeium.com/windsurf)
- Extensions: [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) · [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer) · [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) · [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Run `bun run typecheck` and `bun run lint` — both must pass
4. Commit with a descriptive message
5. Open a Pull Request against `main`

---

## License

MIT © [XSaitoKungX](https://github.com/XSaitoKungX)
