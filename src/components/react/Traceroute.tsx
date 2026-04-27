import { useState, useEffect, useMemo } from 'react';
import { useTicker } from './hooks';

const TARGETS = [
  {
    id: 'google', label: '8.8.8.8', name: 'google-public-dns',
    hops: [
      { host: '192.168.1.1',    rtt: 1.2,  asn: '—',       loss: 0,  region: 'lan' },
      { host: '10.0.0.1',       rtt: 3.4,  asn: 'AS64512', loss: 0,  region: 'edge' },
      { host: '203.0.113.1',    rtt: 8.9,  asn: 'AS7922',  loss: 0,  region: 'isp' },
      { host: '72.14.236.34',   rtt: 14.2, asn: 'AS15169', loss: 0,  region: 'transit' },
      { host: '108.170.245.97', rtt: 13.8, asn: 'AS15169', loss: 0,  region: 'transit' },
      { host: '8.8.8.8',        rtt: 12.4, asn: 'AS15169', loss: 0,  region: 'dest' },
    ],
  },
  {
    id: 'cloudflare', label: '1.1.1.1', name: 'cloudflare-resolver',
    hops: [
      { host: '192.168.1.1',  rtt: 1.1,  asn: '—',       loss: 0,    region: 'lan' },
      { host: '10.0.0.1',     rtt: 3.6,  asn: 'AS64512', loss: 0,    region: 'edge' },
      { host: '203.0.113.1',  rtt: 9.3,  asn: 'AS7922',  loss: 14.0, region: 'isp', issue: 'loss' },
      { host: '141.101.65.0', rtt: 18.6, asn: 'AS13335', loss: 0,    region: 'transit' },
      { host: '1.1.1.1',      rtt: 11.7, asn: 'AS13335', loss: 0,    region: 'dest' },
    ],
  },
  {
    id: 'github', label: 'github.com', name: '140.82.121.4',
    hops: [
      { host: '192.168.1.1',   rtt: 1.0,  asn: '—',       loss: 0, region: 'lan' },
      { host: '10.0.0.1',      rtt: 3.2,  asn: 'AS64512', loss: 0, region: 'edge' },
      { host: '203.0.113.1',   rtt: 8.1,  asn: 'AS7922',  loss: 0, region: 'isp' },
      { host: '129.250.4.18',  rtt: 22.5, asn: 'AS2914',  loss: 0, region: 'transit' },
      { host: '129.250.2.207', rtt: 41.8, asn: 'AS2914',  loss: 0, region: 'transit' },
      { host: '140.82.121.4',  rtt: 42.1, asn: 'AS36459', loss: 0, region: 'dest' },
    ],
  },
];

type Hop = (typeof TARGETS)[0]['hops'][0] & { issue?: string };

export default function Traceroute() {
  const [targetId, setTargetId] = useState('cloudflare');
  const [revealedHops, setRevealedHops] = useState(0);
  const pingTick = useTicker(700);

  const target = useMemo(() => TARGETS.find((t) => t.id === targetId)!, [targetId]);

  useEffect(() => {
    setRevealedHops(0);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setRevealedHops(i);
      if (i >= target.hops.length) clearInterval(id);
    }, 320);
    return () => clearInterval(id);
  }, [targetId, target.hops.length]);

  const wobble = (seed: number) => Math.sin(pingTick * 0.6 + seed) * 0.6;

  return (
    <div className="ppc-trace">
      <div className="ppc-card-head">
        <span className="mono kicker">traceroute.realtime</span>
        <div className="ppc-trace-targets">
          {TARGETS.map((t) => (
            <button
              key={t.id}
              className={`ppc-trace-tab${targetId === t.id ? ' is-active' : ''}`}
              onClick={() => setTargetId(t.id)}
            >
              <span className="mono">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="ppc-trace-cmd">
        <span className="ppc-trace-prompt">
          <span className="muted">[ops@edge-sfo-01]$</span>{' '}
          mtr -r -c 100 {target.label}
        </span>
        <span className="mono muted">{revealedHops}/{target.hops.length} hops · running</span>
      </div>

      <div className="ppc-trace-rows">
        <div className="ppc-trace-head">
          <span>#</span>
          <span>host</span>
          <span>asn</span>
          <span>loss</span>
          <span>rtt</span>
          <span className="ppc-trace-graph">latency</span>
        </div>

        {target.hops.map((h: Hop, i) => {
          const visible = i < revealedHops;
          const rtt = (h.rtt + (visible ? wobble(i + 1) : 0)).toFixed(1);
          const pct = Math.min(100, (parseFloat(rtt) / 50) * 100);
          return (
            <div
              key={i}
              className={`ppc-trace-row${visible ? '' : ' is-pending'}${h.issue ? ' has-issue' : ''}`}
            >
              <span className="mono muted">{String(i + 1).padStart(2, '0')}</span>
              <span className="mono">
                {visible ? h.host : <span className="ppc-spin">▣ resolving…</span>}
              </span>
              <span className="mono muted">{visible ? h.asn : '—'}</span>
              <span className={`mono${h.loss > 0 ? ' warn' : ''}`}>
                {visible ? `${h.loss.toFixed(1)}%` : '—'}
              </span>
              <span className="mono">{visible ? `${rtt}ms` : '—'}</span>
              <span className="ppc-trace-graph">
                <span
                  className={`ppc-trace-bar${h.issue === 'loss' ? ' warn' : ''}`}
                  style={{ width: visible ? `${pct}%` : '0%' }}
                />
                {h.issue === 'loss' && visible ? (
                  <span className="ppc-trace-flag">↑ packet loss · ISP-side</span>
                ) : null}
              </span>
            </div>
          );
        })}
      </div>

      <div className="ppc-trace-foot">
        <span
          className={`ppc-dot ${target.hops.some((h: Hop) => h.issue) ? 'ppc-dot-warn' : 'ppc-dot-ok'}`}
          style={{ width: 6, height: 6 }}
          aria-hidden="true"
        />
        {target.hops.some((h: Hop) => h.issue)
          ? 'path degradation detected at hop 3 — opening ticket draft…'
          : `path is clean — ${target.hops.length} hops to ${target.label}`}
      </div>
    </div>
  );
}
