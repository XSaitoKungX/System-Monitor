import { useState, useEffect } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch, exit } from "@tauri-apps/plugin-process";
import { invoke } from "@tauri-apps/api/core";
import { useAppStore } from "@/store/useAppStore";
import type { Theme } from "@/types";
import {
  GitBranch, Globe, Bug, Sparkles, Shield, Lock, RefreshCw,
  Code2, ExternalLink, Cpu, Zap, Package, Download, CheckCircle, AlertCircle,
  Monitor, Layers, Bell, Trash2, PowerOff,
} from "lucide-react";
import appIcon from "/icon.png";
import saitoIcon from "/saito-icon.png";

type Tab = "settings" | "about";
type UpdateStatus = "idle" | "checking" | "available" | "downloading" | "uptodate" | "error";

const THEMES: { value: Theme; label: string; desc: string; dot: string }[] = [
  { value: "default",  label: "Default",   desc: "Dark blue-grey",  dot: "#6366f1" },
  { value: "dark",     label: "Dark",      desc: "Pure dark",        dot: "#555" },
  { value: "light",    label: "Light",     desc: "Clean light",      dot: "#bbc" },
  { value: "space",    label: "Space",     desc: "Deep space",       dot: "#8b5cf6" },
  { value: "dev",      label: "Dev",       desc: "Terminal green",   dot: "#22c55e" },
  { value: "midnight", label: "Midnight", desc: "Deep ocean blue",  dot: "#38bdf8" },
  { value: "rose",     label: "Rose",     desc: "Dark rose red",    dot: "#f43f5e" },
  { value: "nord",     label: "Nord",     desc: "Arctic palette",   dot: "#81a1c1" },
];

const INTERVALS = [
  { value: 500,   label: "0.5s" },
  { value: 1000,  label: "1s"   },
  { value: 2000,  label: "2s"   },
  { value: 3000,  label: "3s"   },
  { value: 5000,  label: "5s"   },
  { value: 10000, label: "10s"  },
];

const LINKS = [
  {
    icon: GitBranch,
    label: "GitHub Repository",
    description: "View source code & releases",
    href: "https://github.com/XSaitoKungX/System-Monitor",
  },
  {
    icon: Globe,
    label: "Website",
    description: "xsaitox.dev/en/system-monitor",
    href: "https://xsaitox.dev/en/system-monitor",
  },
  {
    icon: Bug,
    label: "Report a Bug",
    description: "Open a GitHub issue",
    href: "https://github.com/XSaitoKungX/System-Monitor/issues/new?template=bug_report.md",
  },
  {
    icon: Sparkles,
    label: "Request a Feature",
    description: "Share your idea",
    href: "https://github.com/XSaitoKungX/System-Monitor/issues/new?template=feature_request.md",
  },
];

const PRIVACY_ITEMS = [
  { icon: Lock,     text: "No data leaves your machine — all stats are local" },
  { icon: Shield,   text: "No telemetry, no analytics, no tracking" },
  { icon: RefreshCw, text: "Updates via GitHub Releases only" },
  { icon: Code2,    text: "100% open source — audit every line yourself" },
];

const TECH_STACK = [
  { icon: Package, label: "Tauri v2",        desc: "Desktop runtime" },
  { icon: Cpu,     label: "Rust + sysinfo",  desc: "Backend & system access" },
  { icon: Zap,     label: "React 18 + TS",   desc: "Frontend framework" },
];

const ALERT_METRICS: { key: "cpu" | "memory" | "disk" | "network"; label: string; unit: string; default: number }[] = [
  { key: "cpu",     label: "CPU Usage",    unit: "%",    default: 90 },
  { key: "memory",  label: "Memory Usage", unit: "%",    default: 85 },
  { key: "disk",    label: "Disk Usage",   unit: "%",    default: 90 },
  { key: "network", label: "Net Rx/s",     unit: "MB/s", default: 50 },
];

function AlertThresholds() {
  const { alerts, addAlert, removeAlert } = useAppStore();

  const getAlert = (key: typeof ALERT_METRICS[0]["key"]) =>
    alerts.find((a) => a.metric === key);

  const toggle = (m: typeof ALERT_METRICS[0]) => {
    const existing = getAlert(m.key);
    if (existing) {
      removeAlert(existing.id);
    } else {
      addAlert({
        id: `${m.key}-${Date.now()}`,
        metric: m.key,
        threshold: m.default,
        label: m.label,
        enabled: true,
      });
    }
  };

  const setThreshold = (id: string, value: number) => {
    const { alerts: cur } = useAppStore.getState();
    const updated = cur.map((a) => (a.id === id ? { ...a, threshold: value } : a));
    useAppStore.setState({ alerts: updated });
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">Enable alerts to get notified when a metric exceeds its threshold.</p>
      {ALERT_METRICS.map((m) => {
        const alert = getAlert(m.key);
        return (
          <div key={m.key} className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-primary">{m.label}</span>
              <Toggle value={!!alert} onChange={() => toggle(m)} label="" />
            </div>
            {alert && (
              <div className="flex items-center gap-3 pl-1">
                <input
                  type="range"
                  min={10}
                  max={m.key === "network" ? 1000 : 100}
                  step={m.key === "network" ? 10 : 5}
                  value={alert.threshold}
                  onChange={(e) => setThreshold(alert.id, Number(e.target.value))}
                  className="flex-1 accent-[rgb(var(--accent))]"
                />
                <span className="text-xs font-mono text-muted w-16 text-right shrink-0">
                  {alert.threshold} {m.unit}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function LinkRow({ icon: Icon, label, description, href }: typeof LINKS[0]) {
  return (
    <button
      onClick={() => openUrl(href)}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all group text-left"
      style={{ borderColor: "rgb(var(--border)/0.5)", background: "rgb(var(--bg-secondary))" }}
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors"
        style={{ background: "rgb(var(--accent)/0.12)" }}>
        <Icon size={15} style={{ color: "rgb(var(--accent))" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-primary">{label}</p>
        <p className="text-xs text-muted">{description}</p>
      </div>
      <ExternalLink size={13} className="text-muted opacity-50 group-hover:opacity-100 transition-opacity shrink-0" />
    </button>
  );
}

function SettingsTab() {
  const {
    theme, setTheme,
    refreshInterval, setRefreshInterval,
    compactMode, setCompactMode,
    startMinimized, setStartMinimized,
    closeToTray, setCloseToTray,
  } = useAppStore();

  // Sync window behavior with Rust when it changes
  useEffect(() => {
    invoke("update_window_behavior", {
      behavior: {
        close_to_tray: closeToTray,
      },
    }).catch(() => {});
  }, [closeToTray]);

  return (
    <div className="space-y-5">
      {/* Theme */}
      <div className="glass p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Monitor size={14} style={{ color: "rgb(var(--accent))" }} />
          <h2 className="text-sm font-semibold text-primary">Appearance</h2>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {THEMES.map((t) => (
            <button
              key={t.value}
              onClick={() => setTheme(t.value)}
              className="flex flex-col items-center gap-2 p-3 rounded-xl border transition-all"
              style={{
                borderColor: theme === t.value ? "rgb(var(--accent))" : "rgb(var(--border)/0.4)",
                background: theme === t.value ? "rgb(var(--accent)/0.1)" : "transparent",
              }}
            >
              <span className="w-4 h-4 rounded-full border-2 border-white/20 shrink-0"
                style={{ background: t.dot }} />
              <span className="text-xs font-medium text-primary leading-tight">{t.label}</span>
              <span className="text-[10px] text-muted leading-tight text-center">{t.desc}</span>
            </button>
          ))}
        </div>
        <div className="pt-2 border-t" style={{ borderColor: "rgb(var(--border)/0.3)" }}>
          <Toggle
            value={compactMode}
            onChange={setCompactMode}
            label="Compact Mode"
            description="Reduce padding and font sizes for more data density"
          />
        </div>
      </div>

      {/* Refresh interval */}
      <div className="glass p-5 space-y-4">
        <div className="flex items-center gap-2">
          <RefreshCw size={14} style={{ color: "rgb(var(--accent))" }} />
          <div>
            <h2 className="text-sm font-semibold text-primary">Refresh Interval</h2>
            <p className="text-xs text-muted mt-0.5">How often stats are fetched from the backend. Lower = more CPU.</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {INTERVALS.map((iv) => (
            <button
              key={iv.value}
              onClick={() => setRefreshInterval(iv.value)}
              className="px-4 py-2 rounded-lg text-sm border transition-all font-medium"
              style={{
                borderColor: refreshInterval === iv.value ? "rgb(var(--accent))" : "rgb(var(--border)/0.4)",
                background: refreshInterval === iv.value ? "rgb(var(--accent)/0.12)" : "transparent",
                color: refreshInterval === iv.value ? "rgb(var(--accent))" : "rgb(var(--text-secondary))",
              }}
            >
              {iv.label}
            </button>
          ))}
        </div>
      </div>

      {/* Window behaviour */}
      <div className="glass p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Layers size={14} style={{ color: "rgb(var(--accent))" }} />
          <h2 className="text-sm font-semibold text-primary">Window Behaviour</h2>
        </div>
        <div className="space-y-4">
          <Toggle
            value={startMinimized}
            onChange={setStartMinimized}
            label="Start minimized"
            description="Launch directly to system tray without showing the window"
          />
          <Toggle
            value={closeToTray}
            onChange={setCloseToTray}
            label="Close to tray"
            description="Clicking × minimizes to tray instead of quitting"
          />
        </div>
      </div>

      {/* Alerts */}
      <div className="glass p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Bell size={14} style={{ color: "rgb(var(--accent))" }} />
          <h2 className="text-sm font-semibold text-primary">Alert Thresholds</h2>
        </div>
        <AlertThresholds />
      </div>

      {/* Updates */}
      <UpdateSection />

      {/* Danger */}
      <DangerSection />
    </div>
  );
}

function Toggle({ value, onChange, label, description }: { value: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-primary">{label}</p>
        {description && <p className="text-xs text-muted mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className="relative w-10 h-5.5 rounded-full transition-colors shrink-0"
        style={{ background: value ? "rgb(var(--accent))" : "rgb(var(--bg-hover))" }}
      >
        <span
          className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
          style={{ transform: value ? "translateX(18px)" : "translateX(0)" }}
        />
      </button>
    </div>
  );
}

function UpdateSection() {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>("idle");
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateProgress, setUpdateProgress] = useState<number>(0);

  const handleCheckUpdate = async () => {
    setUpdateStatus("checking");
    setUpdateError(null);
    setUpdateVersion(null);
    try {
      const update = await check();
      if (update?.available) {
        setUpdateVersion(update.version);
        setUpdateStatus("available");
      } else {
        setUpdateStatus("uptodate");
        setTimeout(() => setUpdateStatus("idle"), 3000);
      }
    } catch (e) {
      setUpdateError(String(e));
      setUpdateStatus("error");
    }
  };

  const handleInstallUpdate = async () => {
    setUpdateStatus("downloading");
    setUpdateProgress(0);
    try {
      const update = await check();
      if (!update?.available) return;
      let downloaded = 0;
      let total = 0;
      await update.downloadAndInstall((event) => {
        if (event.event === "Started") { total = event.data.contentLength ?? 0; }
        if (event.event === "Progress") {
          downloaded += event.data.chunkLength;
          if (total > 0) setUpdateProgress(Math.round((downloaded / total) * 100));
        }
      });
      await relaunch();
    } catch (e) {
      setUpdateError(String(e));
      setUpdateStatus("error");
    }
  };

  return (
    <div className="glass p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RefreshCw size={14} style={{ color: "rgb(var(--accent))" }} />
          <h2 className="text-sm font-semibold text-primary">Updates</h2>
        </div>
        {updateStatus === "idle" && (
          <button
            onClick={handleCheckUpdate}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
            style={{ borderColor: "rgb(var(--accent)/0.4)", color: "rgb(var(--accent))", background: "rgb(var(--accent)/0.08)" }}
          >
            Check for Updates
          </button>
        )}
        {updateStatus === "checking" && (
          <span className="text-xs text-muted flex items-center gap-1.5">
            <RefreshCw size={12} className="animate-spin" /> Checking…
          </span>
        )}
        {updateStatus === "uptodate" && (
          <span className="text-xs flex items-center gap-1.5" style={{ color: "rgb(var(--success))" }}>
            <CheckCircle size={12} /> Up to date
          </span>
        )}
        {updateStatus === "error" && (
          <span className="text-xs flex items-center gap-1.5" style={{ color: "rgb(var(--danger))" }}>
            <AlertCircle size={12} /> Error
          </span>
        )}
      </div>
      {updateStatus === "available" && updateVersion && (
        <div className="rounded-lg p-3 flex items-center justify-between gap-3"
          style={{ background: "rgb(var(--accent)/0.08)", border: "1px solid rgb(var(--accent)/0.2)" }}>
          <div>
            <p className="text-sm font-medium text-primary">v{updateVersion} available</p>
            <p className="text-xs text-muted">A new version is ready to install</p>
          </div>
          <button
            onClick={handleInstallUpdate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium shrink-0"
            style={{ background: "rgb(var(--accent))", color: "rgb(var(--accent-fg))" }}
          >
            <Download size={12} /> Install
          </button>
        </div>
      )}
      {updateStatus === "downloading" && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted">
            <span>Downloading update…</span>
            <span>{updateProgress}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgb(var(--bg-hover))" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${updateProgress}%`, background: "rgb(var(--accent))" }} />
          </div>
        </div>
      )}
      {updateStatus === "error" && updateError && (
        <p className="text-xs" style={{ color: "rgb(var(--danger))" }}>{updateError}</p>
      )}
    </div>
  );
}

function DangerSection() {
  const [confirmQuit, setConfirmQuit] = useState(false);

  return (
    <div className="glass p-5 space-y-3" style={{ borderColor: "rgb(var(--danger)/0.25)" }}>
      <div className="flex items-center gap-2 mb-1">
        <Trash2 size={14} style={{ color: "rgb(var(--danger))" }} />
        <h2 className="text-sm font-semibold" style={{ color: "rgb(var(--danger))" }}>Danger Zone</h2>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Reset all settings</p>
          <p className="text-xs text-muted">Clears theme, interval and all preferences. App will restart.</p>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem("system-monitor-settings");
            relaunch();
          }}
          className="px-3 py-1.5 rounded-lg text-xs font-medium border shrink-0 transition-all"
          style={{ borderColor: "rgb(var(--danger)/0.4)", color: "rgb(var(--danger))", background: "rgb(var(--danger)/0.08)" }}
        >
          Reset
        </button>
      </div>
      <div className="border-t pt-3" style={{ borderColor: "rgb(var(--border)/0.3)" }}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">Quit application</p>
            <p className="text-xs text-muted">Completely exit System Monitor (also from tray).</p>
          </div>
          {!confirmQuit ? (
            <button
              onClick={() => setConfirmQuit(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border shrink-0 transition-all"
              style={{ borderColor: "rgb(var(--danger)/0.4)", color: "rgb(var(--danger))", background: "rgb(var(--danger)/0.08)" }}
            >
              <PowerOff size={12} /> Quit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmQuit(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                style={{ borderColor: "rgb(var(--border)/0.5)", color: "rgb(var(--text-secondary))" }}
              >
                Cancel
              </button>
              <button
                onClick={() => exit(0)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-all"
                style={{ background: "rgb(var(--danger))", color: "#fff" }}
              >
                Confirm Quit
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AboutTab() {
  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="glass p-6 overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at top right, rgb(var(--accent)/0.07), transparent 60%)" }} />
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 shadow-lg"
            style={{ outline: "1px solid rgb(var(--border)/0.5)" }}>
            <img src={appIcon} alt="System Monitor" className="w-full h-full object-cover" />
          </div>
          <div className="space-y-1.5 min-w-0">
            <h1 className="text-2xl font-bold text-primary tracking-tight">System Monitor</h1>
            <p className="text-sm text-muted">Real-time system metrics for your desktop</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-medium"
                style={{ background: "rgb(var(--accent)/0.15)", color: "rgb(var(--accent))" }}>
                v0.2.1
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium"
                style={{ background: "rgb(var(--success)/0.12)", color: "rgb(var(--success))" }}>
                MIT License
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium text-muted"
                style={{ background: "rgb(var(--bg-hover))" }}>
                Open Source
              </span>
            </div>
          </div>
        </div>
        <p className="mt-4 text-sm text-secondary leading-relaxed">
          A free, open source desktop app to monitor CPU, memory, disk, network, and processes in real time.
          Built with Tauri v2 + Rust — lightweight, fast, and native.
        </p>
      </div>

      {/* Privacy */}
      <div className="rounded-xl p-5 space-y-3 border"
        style={{ background: "rgb(var(--success)/0.04)", borderColor: "rgb(var(--success)/0.2)" }}>
        <div className="flex items-center gap-2">
          <Shield size={14} style={{ color: "rgb(var(--success))" }} />
          <h2 className="text-sm font-semibold" style={{ color: "rgb(var(--success))" }}>Privacy &amp; Security</h2>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {PRIVACY_ITEMS.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2.5 text-xs text-muted">
              <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                style={{ background: "rgb(var(--success)/0.12)" }}>
                <Icon size={11} style={{ color: "rgb(var(--success))" }} />
              </div>
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* Tech Stack */}
      <div className="glass p-5 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">Tech Stack</p>
        <div className="grid grid-cols-3 gap-3">
          {TECH_STACK.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex flex-col gap-1.5 p-3 rounded-lg"
              style={{ background: "rgb(var(--bg-secondary))" }}>
              <Icon size={15} style={{ color: "rgb(var(--accent))" }} />
              <p className="text-xs font-semibold text-primary">{label}</p>
              <p className="text-xs text-muted">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Links */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted px-1">Links</p>
        <div className="space-y-1.5">
          {LINKS.map((l) => <LinkRow key={l.href} {...l} />)}
        </div>
      </div>

      {/* Developer */}
      <div className="glass p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-4">Developer</p>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full overflow-hidden shrink-0"
            style={{ boxShadow: "0 0 0 2px rgb(var(--accent)/0.3)" }}>
            <img src={saitoIcon} alt="XSaitoKungX" className="w-full h-full object-cover object-top" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-primary">XSaitoKungX</p>
            <p className="text-xs text-muted">Apprentice Developer · Hobby Project</p>
            <button
              onClick={() => openUrl("https://xsaitox.dev")}
              className="text-xs mt-1 inline-block transition-colors hover:underline"
              style={{ color: "rgb(var(--accent))" }}
            >
              xsaitox.dev →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Settings() {
  const [tab, setTab] = useState<Tab>("settings");

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Tab bar */}
      <div className="flex items-center gap-1 p-1 rounded-xl w-fit"
        style={{ background: "rgb(var(--bg-secondary))" }}>
        {(["settings", "about"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-5 py-1.5 rounded-lg text-sm font-medium transition-all capitalize"
            style={{
              background: tab === t ? "rgb(var(--accent)/0.15)" : "transparent",
              color: tab === t ? "rgb(var(--accent))" : "rgb(var(--text-secondary))",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "settings" ? <SettingsTab /> : <AboutTab />}
    </div>
  );
}
