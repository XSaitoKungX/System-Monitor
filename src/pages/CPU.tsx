import { useMemo } from "react";
import { useCpuStats } from "@/hooks/useSystemStats";
import { GaugeChart } from "@/components/charts/GaugeChart";
import { LineChart } from "@/components/charts/LineChart";
import { formatFrequency, getUsageClass } from "@/lib/utils";

export function CPU() {
  const { data, history } = useCpuStats();

  const chartData = useMemo(
    () => history.map((v, i) => ({ t: i, cpu: v })),
    [history]
  );

  if (!data) {
    return <div className="text-muted text-sm">Loading CPU data...</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-primary">CPU</h1>
      <p className="text-sm text-muted -mt-2">{data.brand} · {data.vendor}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass p-4 text-center">
          <GaugeChart value={data.usage_total} size={110} sublabel="Total" />
        </div>
        <div className="glass p-4 flex flex-col justify-center gap-2">
          <div>
            <p className="text-xs text-muted">Frequency</p>
            <p className="text-lg font-semibold text-primary">{formatFrequency(data.frequency_mhz)}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Physical Cores</p>
            <p className="text-base font-medium text-primary">{data.physical_cores}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Logical Cores</p>
            <p className="text-base font-medium text-primary">{data.logical_cores}</p>
          </div>
        </div>
        <div className="glass p-4 flex flex-col justify-center gap-2">
          <div>
            <p className="text-xs text-muted">Temperature</p>
            <p className="text-lg font-semibold text-primary">
              {data.temperature != null ? `${data.temperature.toFixed(1)} °C` : "N/A"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Architecture</p>
            <p className="text-base font-medium text-primary">x86_64</p>
          </div>
        </div>
        <div className="glass p-4 text-center">
          <p className="text-xs text-muted mb-2">Usage</p>
          <p className={`text-4xl font-bold ${getUsageClass(data.usage_total)}`}>
            {data.usage_total.toFixed(1)}<span className="text-xl">%</span>
          </p>
        </div>
      </div>

      <div className="glass p-4">
        <p className="text-sm font-medium text-primary mb-3">CPU Usage History</p>
        <LineChart
          data={chartData}
          lines={[{ key: "cpu", color: "rgb(var(--accent))", name: "CPU %" }]}
          height={160}
          unit="%"
          domain={[0, 100]}
        />
      </div>

      <div className="glass p-4">
        <p className="text-sm font-medium text-primary mb-3">Per-Core Usage</p>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {data.usage_per_core.map((usage, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <GaugeChart value={usage} size={72} unit="%" />
              <span className="text-xs text-muted">Core {i}</span>
              <span className={`text-xs font-medium ${getUsageClass(usage)}`}>
                {usage.toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
