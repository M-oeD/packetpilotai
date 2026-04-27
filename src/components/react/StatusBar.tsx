import { useMemo } from 'react';
import { useTicker } from './hooks';

function smoothNoise(t: number, seed = 1) {
  return (
    Math.sin(t * 0.7 + seed) * 0.5 +
    Math.sin(t * 1.7 + seed * 1.3) * 0.3 +
    Math.sin(t * 0.31 + seed * 2.1) * 0.2
  );
}

function StatusDot({ status = 'ok', size = 8 }: { status?: string; size?: number }) {
  return (
    <span
      className={`ppc-dot ppc-dot-${status}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}

function Chip({
  label,
  value,
  status = 'ok',
  live = false,
}: {
  label: string;
  value: string;
  status?: string;
  live?: boolean;
}) {
  return (
    <div className={`ppc-chip ppc-chip-${status}`}>
      <span className="ppc-chip-label">{label}</span>
      <span className="ppc-chip-value mono">
        {live ? <StatusDot status={status} size={6} /> : null}
        {value}
      </span>
    </div>
  );
}

export default function StatusBar() {
  const tick = useTicker(900);

  const metrics = useMemo(() => {
    const t = tick;
    const latency = (12 + smoothNoise(t, 1) * 4 + Math.max(0, smoothNoise(t, 5)) * 6).toFixed(1);
    const loss = Math.max(0, smoothNoise(t, 3) * 0.6 + 0.05).toFixed(2);
    const jitter = (1.2 + Math.abs(smoothNoise(t, 7)) * 2.4).toFixed(2);
    const ingress = (840 + smoothNoise(t, 11) * 120).toFixed(0);
    const egress = (612 + smoothNoise(t, 13) * 90).toFixed(0);
    const sessions = 1247 + Math.round(smoothNoise(t, 17) * 30);
    return { latency, loss, jitter, ingress, egress, sessions };
  }, [tick]);

  const lossStatus = parseFloat(metrics.loss) > 0.5 ? 'warn' : 'ok';
  const latencyStatus = parseFloat(metrics.latency) > 18 ? 'warn' : 'ok';

  const [utc, setUtc] = useMemo(() => {
    const now = new Date().toISOString().slice(11, 19);
    return [now, null];
  }, [tick]);

  return (
    <div className="ppc-statusbar" role="status" aria-label="live network telemetry">
      <div className="ppc-statusbar-inner">
        <div className="ppc-statusbar-left">
          <span className="ppc-status-mode">
            <StatusDot status="ok" />
            <span className="mono">SYS</span>
            <span className="ppc-pill ok">OPERATIONAL</span>
          </span>
        </div>
        <div className="ppc-statusbar-metrics">
          <Chip label="rtt" value={`${metrics.latency}ms`} status={latencyStatus} live />
          <Chip label="loss" value={`${metrics.loss}%`} status={lossStatus} live />
          <Chip label="jitter" value={`${metrics.jitter}ms`} status="ok" live />
          <Chip label="in" value={`${metrics.ingress}Mb/s`} status="ok" />
          <Chip label="out" value={`${metrics.egress}Mb/s`} status="ok" />
          <Chip label="sessions" value={metrics.sessions.toLocaleString()} status="ok" />
        </div>
        <div className="ppc-statusbar-right">
          <span className="mono muted">UTC</span>
          <span className="mono">{utc}</span>
        </div>
      </div>
    </div>
  );
}
