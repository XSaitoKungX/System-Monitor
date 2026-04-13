import { useState, useCallback, useRef, useEffect } from "react";
import { ArrowDown, ArrowUp, Activity, RotateCcw, Globe, Wifi, Monitor, Gamepad2, Play, Video } from "lucide-react";

type Phase = "idle" | "ping" | "warmup" | "download" | "upload" | "done";

interface Result {
  ping: number | null;
  jitter: number | null;
  download: number | null;
  upload: number | null;
}

const CF_BASE = "https://speed.cloudflare.com";
const PING_ROUNDS = 10;

type Quality = "Bad" | "Ok" | "Good" | "Great";

interface ConnectionInfo {
  ip: string;
  isp: string;
  city: string;
  country: string;
}

interface QualityScores {
  browsing: Quality;
  gaming: Quality;
  streaming: Quality;
  video: Quality;
}

function scoreQuality(
  downloadMbps: number,
  uploadMbps: number,
  pingMs: number,
  jitterMs: number
): QualityScores {
  const browsing: Quality =
    downloadMbps >= 25 && pingMs <= 100 ? "Great" :
    downloadMbps >= 10 && pingMs <= 150 ? "Good" :
    downloadMbps >= 3 ? "Ok" : "Bad";

  const gaming: Quality =
    pingMs <= 20 && jitterMs <= 5 && downloadMbps >= 25 ? "Great" :
    pingMs <= 50 && jitterMs <= 15 && downloadMbps >= 10 ? "Good" :
    pingMs <= 100 && downloadMbps >= 5 ? "Ok" : "Bad";

  const streaming: Quality =
    downloadMbps >= 25 ? "Great" :
    downloadMbps >= 10 ? "Good" :
    downloadMbps >= 5 ? "Ok" : "Bad";

  const video: Quality =
    downloadMbps >= 50 && uploadMbps >= 10 ? "Great" :
    downloadMbps >= 25 && uploadMbps >= 5 ? "Good" :
    downloadMbps >= 10 ? "Ok" : "Bad";

  return { browsing, gaming, streaming, video };
}

const QUALITY_COLOR: Record<Quality, string> = {
  Bad: "rgb(var(--error))",
  Ok: "rgb(var(--warning, 220 150 50))",
  Good: "rgb(var(--info))",
  Great: "rgb(var(--success))",
};

/**
 * Parse the cfL4 rtt field from Cloudflare's server-timing header.
 * Value is in microseconds — represents true network RTT at the edge.
 */
function parseCfRttMs(resp: Response): number | null {
  const st = resp.headers.get("server-timing");
  if (!st) return null;
  const m = st.match(/rtt=(\d+)/);
  if (!m) return null;
  return parseInt(m[1], 10) / 1000;
}

function bitsPerSec(bytes: number, ms: number): number {
  return (bytes * 8) / (ms / 1000);
}

function formatMbps(bps: number | null): string {
  if (bps === null) return "—";
  return (bps / 1_000_000).toFixed(2);
}

function formatMs(ms: number | null): string {
  if (ms === null) return "—";
  return ms.toFixed(1);
}

/**
 * Download one stream, return total bytes received.
 * Calls onProgress(bytes, elapsedMs) on each chunk.
 */
async function downloadStream(
  bytes: number,
  signal: AbortSignal,
  onProgress: (b: number, ms: number) => void
): Promise<{ bytes: number; ms: number }> {
  const t0 = performance.now();
  const resp = await fetch(`${CF_BASE}/__down?bytes=${bytes}`, {
    cache: "no-store",
    signal,
  });
  if (!resp.body) return { bytes: 0, ms: 1 };
  const reader = resp.body.getReader();
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    onProgress(received, performance.now() - t0);
  }
  return { bytes: received, ms: performance.now() - t0 };
}

/**
 * Upload one chunk, return { bytes, ms }.
 */
async function uploadChunk(
  data: Uint8Array,
  signal: AbortSignal
): Promise<{ bytes: number; ms: number }> {
  const t0 = performance.now();
  await fetch(`${CF_BASE}/__up`, {
    method: "POST",
    body: data.slice(0) as unknown as BodyInit,
    cache: "no-store",
    signal,
  });
  return { bytes: data.byteLength, ms: performance.now() - t0 };
}

function SpeedGauge({ value, max, color, label }: { value: number | null; max: number; color: string; label: string }) {
  const pct = value !== null ? Math.min((value / 1_000_000 / max) * 100, 100) : 0;
  const circumference = 2 * Math.PI * 54;
  const dash = (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" strokeWidth="8"
            style={{ stroke: "rgb(var(--bg-hover))" }} />
          <circle cx="60" cy="60" r="54" fill="none" strokeWidth="8"
            strokeLinecap="round"
            style={{
              stroke: color,
              strokeDasharray: `${dash} ${circumference - dash}`,
              transition: "stroke-dasharray 0.3s ease",
            }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-primary">
            {value !== null ? (value / 1_000_000).toFixed(0) : "—"}
          </span>
          <span className="text-xs text-muted">Mbps</span>
        </div>
      </div>
      <span className="text-sm font-medium text-secondary">{label}</span>
    </div>
  );
}

export function Speedtest() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<Result>({ ping: null, jitter: null, download: null, upload: null });
  const [liveDownload, setLiveDownload] = useState<number | null>(null);
  const [liveUpload, setLiveUpload] = useState<number | null>(null);
  const [livePing, setLivePing] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [connInfo, setConnInfo] = useState<ConnectionInfo | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetch(`${CF_BASE}/meta`)
      .then((r) => r.json())
      .then((d) => setConnInfo({
        ip: d.clientIp ?? "—",
        isp: d.asOrganization ?? "—",
        city: d.city ?? "—",
        country: d.country ?? "",
      }))
      .catch(() => {});
  }, []);

  const measurePing = useCallback(async (signal: AbortSignal): Promise<{ ping: number; jitter: number }> => {
    const rtts: number[] = [];
    for (let i = 0; i < PING_ROUNDS; i++) {
      const resp = await fetch(`${CF_BASE}/__down?bytes=0`, { method: "GET", cache: "no-store", signal });
      const cfRtt = parseCfRttMs(resp);
      if (cfRtt !== null) {
        rtts.push(cfRtt);
      } else {
        // Fallback: measure responseStart timing via Performance API
        const entries = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
        const entry = entries[entries.length - 1];
        if (entry && entry.responseStart > 0 && entry.requestStart > 0) {
          rtts.push(entry.responseStart - entry.requestStart);
        }
      }
      if (rtts.length > 0) {
        setLivePing(rtts.reduce((a, b) => a + b) / rtts.length);
      }
    }
    if (rtts.length === 0) return { ping: 0, jitter: 0 };
    const avg = rtts.reduce((a, b) => a + b, 0) / rtts.length;
    const jitter = Math.sqrt(rtts.reduce((s, t) => s + (t - avg) ** 2, 0) / rtts.length);
    return { ping: avg, jitter };
  }, []);

  /**
   * Parallel multi-stream download with progressive sizes.
   * Mimics Cloudflare's approach: multiple concurrent streams to saturate bandwidth.
   * Round 1 (warmup): 1×1 MB
   * Round 2: 4×10 MB in parallel
   * Round 3: 6×25 MB in parallel  → peak measurement
   */
  const measureDownload = useCallback(async (signal: AbortSignal): Promise<number> => {
    // Warmup: 1 stream × 1 MB
    setPhase("warmup");
    setProgress(28);
    await downloadStream(1_000_000, signal, () => {});

    setPhase("download");

    // Round A: 4 × 5 MB in parallel — each stream tracks its own progress
    const roundAStart = performance.now();
    const roundABytes = new Array(4).fill(0);
    await Promise.all(
      Array.from({ length: 4 }, (_, idx) =>
        downloadStream(5_000_000, signal, (b) => {
          roundABytes[idx] = b;
          const total = roundABytes.reduce((s, v) => s + v, 0);
          const elapsed = performance.now() - roundAStart;
          setLiveDownload(bitsPerSec(total, elapsed));
        })
      )
    );
    setProgress(45);

    // Round B: 6 × 25 MB in parallel — peak measurement
    const peakStart = performance.now();
    // Track total received across all 6 streams in real-time
    const streamBytes = new Array(6).fill(0);
    const peakResults = await Promise.all(
      Array.from({ length: 6 }, (_, idx) =>
        downloadStream(25_000_000, signal, (b) => {
          streamBytes[idx] = b;
          const totalSoFar = streamBytes.reduce((s, v) => s + v, 0);
          const elapsed = performance.now() - peakStart;
          setLiveDownload(bitsPerSec(totalSoFar, elapsed));
        })
      )
    );
    const peakMs = performance.now() - peakStart;
    const peakBytes = peakResults.reduce((s, r) => s + r.bytes, 0);
    setLiveDownload(bitsPerSec(peakBytes, peakMs));
    setProgress(65);

    return bitsPerSec(peakBytes, peakMs);
  }, []);

  /**
   * Parallel multi-stream upload.
   * Round 1: 4 × 1 MB warmup
   * Round 2: 6 × 5 MB peak
   */
  const measureUpload = useCallback(async (signal: AbortSignal): Promise<number> => {
    // Pre-generate random data once
    const pool = new Uint8Array(5_000_000);
    crypto.getRandomValues(pool.slice(0, 65536)); // randomize first 64K, rest zeros is fine for throughput

    // Warmup: 4 × 1 MB
    await Promise.all(
      Array.from({ length: 4 }, () => uploadChunk(pool.slice(0, 1_000_000), signal))
    );
    setProgress(75);

    // Peak: 6 × 5 MB in parallel
    const peakStart = performance.now();
    const peakResults = await Promise.all(
      Array.from({ length: 6 }, () => uploadChunk(pool, signal))
    );
    const peakMs = performance.now() - peakStart;
    const peakBytes = peakResults.reduce((s, r) => s + r.bytes, 0);
    setLiveUpload(bitsPerSec(peakBytes, peakMs));
    setProgress(100);

    return bitsPerSec(peakBytes, peakMs);
  }, []);

  const run = useCallback(async () => {
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;
    setResult({ ping: null, jitter: null, download: null, upload: null });
    setLiveDownload(null);
    setLiveUpload(null);
    setLivePing(null);
    setProgress(0);

    try {
      setPhase("ping");
      setProgress(5);
      const { ping, jitter } = await measurePing(signal);
      setResult((r) => ({ ...r, ping, jitter }));
      setProgress(25);

      const download = await measureDownload(signal);
      setResult((r) => ({ ...r, download }));

      setPhase("upload");
      const upload = await measureUpload(signal);
      setResult((r) => ({ ...r, upload }));

      setPhase("done");
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        console.error("Speedtest error", e);
      }
      setPhase("idle");
    }
  }, [measurePing, measureDownload, measureUpload]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setPhase("idle");
    setResult({ ping: null, jitter: null, download: null, upload: null });
    setLiveDownload(null);
    setLiveUpload(null);
    setLivePing(null);
    setProgress(0);
  }, []);

  const isRunning = phase !== "idle" && phase !== "done";
  const displayDownload = (phase === "download" || phase === "warmup") ? liveDownload : result.download;
  const displayUpload = phase === "upload" ? liveUpload : result.upload;

  const quality: QualityScores | null =
    result.download !== null && result.upload !== null && result.ping !== null && result.jitter !== null
      ? scoreQuality(result.download / 1_000_000, result.upload / 1_000_000, result.ping, result.jitter)
      : null;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary">Speedtest</h1>
        {(phase === "done" || phase === "idle") && result.download !== null && (
          <button
            onClick={reset}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-default text-secondary hover:text-primary transition-colors"
          >
            <RotateCcw size={12} />
            Reset
          </button>
        )}
      </div>

      {/* Gauges */}
      <div className="glass p-6">
        <div className="flex items-center justify-center gap-12">
          <div className="flex flex-col items-center gap-1">
            <ArrowDown size={16} style={{ color: "rgb(var(--success))" }} />
            <SpeedGauge
              value={displayDownload}
              max={1000}
              color="rgb(var(--success))"
              label="Download"
            />
          </div>
          <div className="flex flex-col items-center gap-1">
            <ArrowUp size={16} style={{ color: "rgb(var(--accent))" }} />
            <SpeedGauge
              value={displayUpload}
              max={1000}
              color="rgb(var(--accent))"
              label="Upload"
            />
          </div>
        </div>

        {/* Ping row */}
        <div className="flex justify-center gap-8 mt-4 text-sm">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xs text-muted">Ping</span>
            <span className="font-semibold text-primary">
              {formatMs(livePing ?? result.ping)} <span className="text-xs text-muted font-normal">ms</span>
            </span>
          </div>
          {result.jitter !== null && (
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-xs text-muted">Jitter</span>
              <span className="font-semibold text-primary">
                {formatMs(result.jitter)} <span className="text-xs text-muted font-normal">ms</span>
              </span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {isRunning && (
          <div className="mt-5 space-y-1.5">
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgb(var(--bg-hover))" }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%`, background: "rgb(var(--accent))" }}
              />
            </div>
            <p className="text-xs text-center text-muted capitalize">{phase}ing…</p>
          </div>
        )}

        {/* Result summary */}
        {phase === "done" && (
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-lg p-3 text-center" style={{ background: "rgb(var(--bg-hover))" }}>
              <p className="text-xs text-muted mb-0.5">Download</p>
              <p className="text-xl font-bold" style={{ color: "rgb(var(--success))" }}>
                {formatMbps(result.download)} <span className="text-sm font-normal text-muted">Mbps</span>
              </p>
            </div>
            <div className="rounded-lg p-3 text-center" style={{ background: "rgb(var(--bg-hover))" }}>
              <p className="text-xs text-muted mb-0.5">Upload</p>
              <p className="text-xl font-bold" style={{ color: "rgb(var(--accent))" }}>
                {formatMbps(result.upload)} <span className="text-sm font-normal text-muted">Mbps</span>
              </p>
            </div>
          </div>
        )}

        {/* Start button */}
        <div className="flex justify-center mt-6">
          {!isRunning ? (
            <button
              onClick={run}
              className="relative w-24 h-24 rounded-full font-bold text-lg transition-transform hover:scale-105 active:scale-95"
              style={{
                background: "radial-gradient(circle at 40% 40%, rgb(var(--accent)/0.9), rgb(var(--accent)/0.6))",
                boxShadow: "0 0 32px rgb(var(--accent)/0.35)",
                color: "white",
              }}
            >
              <span className="flex items-center justify-center gap-1">
                <Activity size={18} />
                GO
              </span>
            </button>
          ) : (
            <button
              onClick={reset}
              className="w-24 h-24 rounded-full font-medium text-sm border-2 transition-colors"
              style={{ borderColor: "rgb(var(--accent)/0.4)", color: "rgb(var(--text-secondary))" }}
            >
              Stop
            </button>
          )}
        </div>
      </div>

      {/* Quality scores */}
      {quality && (
        <div className="glass p-4">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Connection Quality</p>
          <div className="grid grid-cols-4 gap-3">
            {([
              { label: "Browsing", key: "browsing" as const, icon: <Globe size={16} /> },
              { label: "Gaming", key: "gaming" as const, icon: <Gamepad2 size={16} /> },
              { label: "Streaming", key: "streaming" as const, icon: <Play size={16} /> },
              { label: "Video Call", key: "video" as const, icon: <Video size={16} /> },
            ]).map(({ label, key, icon }) => (
              <div key={key} className="flex flex-col items-center gap-1.5 p-3 rounded-lg"
                style={{ background: "rgb(var(--bg-hover))" }}>
                <span style={{ color: QUALITY_COLOR[quality[key]] }}>{icon}</span>
                <span className="text-xs font-semibold" style={{ color: QUALITY_COLOR[quality[key]] }}>
                  {quality[key]}
                </span>
                <span className="text-xs text-muted">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Connection info */}
      <div className="glass p-4">
        <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Connection</p>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-start gap-2">
            <Wifi size={14} className="mt-0.5 shrink-0" style={{ color: "rgb(var(--accent))" }} />
            <div>
              <p className="text-xs text-muted">IP Address</p>
              <p className="text-sm font-medium text-primary font-mono">{connInfo?.ip ?? "—"}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Globe size={14} className="mt-0.5 shrink-0" style={{ color: "rgb(var(--accent))" }} />
            <div>
              <p className="text-xs text-muted">Provider (ISP)</p>
              <p className="text-sm font-medium text-primary">{connInfo?.isp ?? "—"}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Monitor size={14} className="mt-0.5 shrink-0" style={{ color: "rgb(var(--accent))" }} />
            <div>
              <p className="text-xs text-muted">Location</p>
              <p className="text-sm font-medium text-primary">
                {connInfo ? `${connInfo.city}${connInfo.country ? ", " + connInfo.country : ""}` : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-center text-muted">
        Test uses <span className="font-medium">speed.cloudflare.com</span> — {connInfo?.isp && <span>via {connInfo.isp} · </span>}results reflect connection to nearest PoP
      </p>
    </div>
  );
}
