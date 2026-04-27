import { useMemo } from 'react';
import { useTicker } from './hooks';

export default function FooterBar() {
  const tick = useTicker(1000);

  const uptime = useMemo(() => {
    const base = 60 * 60 * 24 * 412 + 3600 * 7 + 23 * 60;
    const now = base + tick;
    const d = Math.floor(now / 86400);
    const h = Math.floor((now % 86400) / 3600);
    const m = Math.floor((now % 3600) / 60);
    const s = now % 60;
    return `${d}d ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, [tick]);

  return (
    <footer className="ppc-footer">
      <div className="ppc-footer-row">
        <span className="ppc-footer-cell">
          <span className="ppc-dot ppc-dot-ok" style={{ width: 8, height: 8 }} aria-hidden="true" />
          <span className="muted">node</span>
          <span className="mono">edge-sfo-01</span>
        </span>
        <span className="ppc-footer-cell">
          <span className="muted">uptime</span>
          <span className="mono">{uptime}</span>
        </span>
        <span className="ppc-footer-cell">
          <span className="muted">build</span>
          <span className="mono">2026.04.26-r7c2</span>
        </span>
        <span className="ppc-footer-cell">
          <span className="muted">© packetpilot.ai —</span>
          <span className="mono">all configs are examples; verify in lab</span>
        </span>
      </div>
    </footer>
  );
}
