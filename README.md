<div align="center">

# System Monitor

**Modern, open-source replacement for Task Manager, htop and btop**

Built with Tauri v2 · React 19 · Rust

[![GitHub release](https://img.shields.io/github/v/release/XSaitoKungX/System-Monitor?style=flat-square&logo=github)](https://github.com/XSaitoKungX/System-Monitor/releases/latest)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
[![Tauri](https://img.shields.io/badge/Tauri-v2-FFC131?style=flat-square&logo=tauri&logoColor=white)](https://tauri.app)
[![Rust](https://img.shields.io/badge/Rust-stable-CE422B?style=flat-square&logo=rust&logoColor=white)](https://rustup.rs)
[![Platform](https://img.shields.io/badge/platform-Linux%20%7C%20Windows%20%7C%20macOS-lightgrey?style=flat-square)](https://github.com/XSaitoKungX/System-Monitor/releases/latest)

**[Website](https://xsaitox.dev/en/system-monitor) · [Releases](https://github.com/XSaitoKungX/System-Monitor/releases) · [Changelog](CHANGELOG.md)**

</div>

---

## Features

| Page | Description |
|------|-------------|
| **Dashboard** | System health score, uptime, CPU / RAM / Disk / Network overview |
| **CPU** | Total + per-core usage, frequency, temperature, 60-point history chart |
| **Memory** | RAM & Swap usage with history chart |
| **GPU** | Usage, clock frequency, temperature, VRAM — Linux via sysfs / NVML |
| **Disk** | Capacity, usage ring, read/write I/O per partition, removable device detection |
| **Network** | Upload/download speed, per-interface stats, bandwidth history (B/s → GB/s) |
| **Speedtest** | Multi-stream download/upload, real ping via Cloudflare edge RTT |
| **Processes** | Sortable list, kill process (double-confirm), search by name / PID |
| **Settings** | Theme switcher, refresh interval, alert thresholds, auto-updater |

**Themes:** `Default` · `Dark` · `Light` · `Space` · `Dev` (glassmorphism)

---

## Platform Support

| Feature | Linux | Windows | macOS |
|---------|:-----:|:-------:|:-----:|
| CPU / Memory / Disk / Network | ✅ | ✅ | ✅ |
| Processes | ✅ | ✅ | ✅ |
| Temperature sensors | ✅ | ✅ | ✅ |
| Speedtest | ✅ | ✅ | ✅ |
| GPU monitoring | ✅ sysfs + NVML | ✅ WMI | ⏳ planned |
| Build output | `.deb` `.rpm` `.AppImage` | `.exe` `.msi` | `.dmg` `.app` |

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

### Install & Run

```bash
git clone https://github.com/XSaitoKungX/System-Monitor.git
cd System-Monitor
bun install
bun run dev        # Tauri dev mode — Rust + Vite HMR
```

> The first `bun run dev` compiles all Rust dependencies from scratch — this takes 2–5 minutes. Subsequent starts are fast.

### Release Build

```bash
bun run build      # Optimised release build + platform bundles
```

**Faster local build** (~3× faster, less optimised):
```bash
bunx tauri build -- --profile release-fast
```

Output: `src-tauri/target/release/bundle/`

---

## Scripts

| Script | Description |
|--------|-------------|
| `bun run dev` | Tauri dev mode with HMR |
| `bun run build` | Optimised release bundles |
| `bun run typecheck` | TypeScript check without emit |
| `bun run lint` | ESLint over `src/` |
| `bun run vite:dev` | Vite dev server only (no Tauri shell) |
| `bun run vite:build` | Vite production build only |

---

## GPU Monitoring

GPU stats are read from the Linux DRM sysfs interface (`/sys/class/drm/cardN/`):

| Metric | AMD | Intel | NVIDIA (open) |
|--------|:---:|:-----:|:-------------:|
| GPU name (PCI DB) | ✅ | ✅ | ✅ |
| GPU load % | ✅ | ⚠️ freq proxy | ❌ |
| Clock / Max | — | ✅ | — |
| Temperature | ✅ | ❌ | ❌ |
| Power | ✅ | ❌ | ❌ |
| VRAM | ✅ | ❌ shared RAM | ❌ |

> **NVIDIA proprietary driver:** Enable the optional `nvidia` feature to use `nvml-wrapper`:
> ```bash
> bunx tauri build --features nvidia
> ```

> **Intel iGPU:** No dedicated VRAM. GPU load is approximated from current / max clock ratio.

---

## Release

Releases are automated via GitHub Actions. Push a semver tag:

```bash
git tag v0.3.0
git push --tags
```

The workflow builds on:
- `ubuntu-24.04` → `.deb`, `.rpm`, `.AppImage`
- `windows-2025` → `.exe`, `.msi`
- `macos-15 (arm64)` → `.dmg` (Apple Silicon)
- `macos-15 (x64)` → `.dmg` (Intel Mac)

The CHANGELOG is generated automatically from conventional commits and attached to the GitHub Release.

---

## Project Structure

```
System-Monitor/
├── .github/
│   └── workflows/
│       └── release.yml         # Cross-platform CI/CD
├── src/                        # React frontend (TypeScript strict)
│   ├── components/
│   │   ├── charts/             # LineChart (Recharts wrapper)
│   │   ├── layout/             # Sidebar, Header, Layout
│   │   ├── ui/                 # Radix UI primitives
│   │   └── widgets/            # GaugeChart, StatCard, UsageBar …
│   ├── hooks/                  # useSystemStats, useCpuStats, useGpuStats …
│   ├── lib/utils.ts            # formatBytes, formatBytesPerSec, getUsageColor …
│   ├── pages/                  # Dashboard, CPU, Memory, GPU, Disk, Network,
│   │                           #   Speedtest, Processes, Settings
│   ├── store/                  # Zustand stores (theme, settings, alerts)
│   ├── styles/globals.css      # CSS custom properties — 5 themes
│   └── types/index.ts          # TypeScript interfaces for all Rust responses
├── src-tauri/
│   ├── capabilities/           # Tauri v2 capability definitions
│   ├── icons/                  # App icons (all sizes)
│   ├── src/
│   │   ├── commands/           # cpu, memory, disk, network, gpu, processes, system
│   │   ├── models/             # Rust structs with serde
│   │   └── lib.rs              # Tauri app entry — registers all commands
│   ├── Cargo.lock
│   ├── Cargo.toml
│   └── tauri.conf.json
├── CHANGELOG.md
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Known Limitations

- **GPU on macOS:** Not yet implemented — tab shows a placeholder.
- **NVIDIA on Linux:** Requires `nvidia` Cargo feature + `nvml` library. Without it, most stats show N/A.
- **Intel iGPU load:** Reported as frequency ratio, not actual render engine utilisation (sysfs limitation).
- **Speedtest:** Uses Cloudflare `speed.cloudflare.com`. Ping reflects Cloudflare edge RTT, not ICMP.
- **Process kill:** Requires appropriate OS permissions. Double-confirmation dialog shown before any kill.
- **`pci.ids` database:** GPU names resolved from `/usr/share/misc/pci.ids`. Install `pciutils` if GPU shows a generic fallback.

---

## System Tray

The app minimises to the system tray when the window is closed — it does **not** exit.

| Action | Result |
|--------|--------|
| Click × (close button) | Hides to tray |
| Left-click tray icon | Shows & focuses window |
| Tray → **Show Window** | Shows & focuses window |
| Tray → **Quit System Monitor** | Exits the app |

---

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) or [Windsurf](https://codeium.com/windsurf) with:
[Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) · [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer) · [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) · [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Run `bun run typecheck` and `bun run lint` — both must pass
4. Commit with [conventional commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:` …)
5. Open a Pull Request against `main`

---

## License

MIT © [XSaitoKungX](https://github.com/XSaitoKungX)
