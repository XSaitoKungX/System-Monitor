import { useState } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useAppStore } from "@/store/useAppStore";
import type { Theme } from "@/types";
import {
  GitBranch, Globe, Bug, Sparkles, Shield, Lock, RefreshCw,
  Code2, ExternalLink, Cpu, Zap, Package,
} from "lucide-react";
import appIcon from "/icon.png";
import saitoIcon from "/saito-icon.png";

type Tab = "settings" | "about";

const THEMES: { value: Theme; label: string; desc: string; dot: string }[] = [
  { value: "default", label: "Default", desc: "Dark blue-grey", dot: "#5b8dee" },
  { value: "dark",    label: "Dark",    desc: "Pure dark",      dot: "#888" },
  { value: "light",   label: "Light",   desc: "Clean light",    dot: "#333" },
  { value: "space",   label: "Space",   desc: "Deep space",     dot: "#9d7ee8" },
  { value: "dev",     label: "Dev",     desc: "Terminal green", dot: "#39ff14" },
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
  { icon: Package, label: "Tauri v2",   desc: "Desktop runtime" },
  { icon: Cpu,     label: "Rust + sysinfo", desc: "Backend & system access" },
  { icon: Zap,     label: "React 18 + TS", desc: "Frontend framework" },
];

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
  const { theme, setTheme, refreshInterval, setRefreshInterval } = useAppStore();

  return (
    <div className="space-y-5">
      {/* Theme */}
      <div className="glass p-5 space-y-4">
        <h2 className="text-sm font-semibold text-primary">Appearance</h2>
        <div className="grid grid-cols-5 gap-2">
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
              <span className="text-xs text-muted leading-tight text-center">{t.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Refresh interval */}
      <div className="glass p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-primary">Refresh Interval</h2>
          <p className="text-xs text-muted mt-0.5">How often stats are fetched from the backend. Lower = more CPU.</p>
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

      {/* Tech stack */}
      <div className="glass p-5 space-y-4">
        <h2 className="text-sm font-semibold text-primary">Tech Stack</h2>
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
                v0.1.0
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
