import { useMemo } from 'react';
import { useTicker } from './hooks';

const NODES = [
  { id: 'client', x: 60,  y: 220, label: 'client',   sub: '10.0.4.42',     kind: 'endpoint' },
  { id: 'sw01',   x: 220, y: 220, label: 'sw01',     sub: 'Catalyst 2960', kind: 'switch' },
  { id: 'fw',     x: 380, y: 140, label: 'fw',       sub: 'pfSense edge',  kind: 'fw' },
  { id: 'core',   x: 380, y: 300, label: 'core',     sub: 'router-core',   kind: 'router' },
  { id: 'wan',    x: 540, y: 220, label: 'wan',      sub: 'AS 64512',      kind: 'wan' },
  { id: 'isp',    x: 700, y: 220, label: 'isp-gw',   sub: '203.0.113.1',   kind: 'wan' },
  { id: 'world',  x: 860, y: 220, label: 'internet', sub: '0.0.0.0/0',     kind: 'cloud' },
  { id: 'dns',    x: 220, y: 90,  label: 'dns',      sub: 'resolver',      kind: 'service' },
  { id: 'ap1',    x: 60,  y: 90,  label: 'ap-01',    sub: 'wifi-corp',     kind: 'ap' },
  { id: 'nas',    x: 220, y: 360, label: 'nas',      sub: '10.0.4.20',     kind: 'service' },
];

const EDGES = [
  { from: 'ap1',    to: 'sw01',  weight: 1 },
  { from: 'client', to: 'sw01',  weight: 2 },
  { from: 'nas',    to: 'sw01',  weight: 1 },
  { from: 'dns',    to: 'sw01',  weight: 1 },
  { from: 'sw01',   to: 'fw',    weight: 2 },
  { from: 'sw01',   to: 'core',  weight: 2 },
  { from: 'fw',     to: 'wan',   weight: 2 },
  { from: 'core',   to: 'wan',   weight: 1 },
  { from: 'wan',    to: 'isp',   weight: 3 },
  { from: 'isp',    to: 'world', weight: 3 },
];

function nodeById(id: string) {
  return NODES.find((n) => n.id === id)!;
}

function NodeGlyph({ kind }: { kind: string }) {
  const sw = 1.2;
  switch (kind) {
    case 'endpoint':
      return <g fill="none" stroke="currentColor" strokeWidth={sw}><rect x="-9" y="-7" width="18" height="12" rx="1" /><line x1="-5" y1="7" x2="5" y2="7" /></g>;
    case 'switch':
      return <g fill="none" stroke="currentColor" strokeWidth={sw}><rect x="-12" y="-5" width="24" height="10" rx="1" /><line x1="-8" y1="0" x2="-8" y2="0.1" /><line x1="-4" y1="0" x2="-4" y2="0.1" /><line x1="0" y1="0" x2="0" y2="0.1" /><line x1="4" y1="0" x2="4" y2="0.1" /><line x1="8" y1="0" x2="8" y2="0.1" /></g>;
    case 'router':
      return <g fill="none" stroke="currentColor" strokeWidth={sw}><circle r="9" /><path d="M -5 -2 L 5 -2 M -5 2 L 5 2 M 4 -4 L 6 -2 L 4 0 M -4 0 L -6 2 L -4 4" /></g>;
    case 'fw':
      return <g fill="none" stroke="currentColor" strokeWidth={sw}><path d="M 0 -10 L 9 -5 L 9 4 C 9 8 5 10 0 10 C -5 10 -9 8 -9 4 L -9 -5 Z" /></g>;
    case 'wan':
      return <g fill="none" stroke="currentColor" strokeWidth={sw}><circle r="9" /><path d="M -9 0 L 9 0 M 0 -9 L 0 9 M -7 -5 C -3 -8 3 -8 7 -5 M -7 5 C -3 8 3 8 7 5" /></g>;
    case 'cloud':
      return <g fill="none" stroke="currentColor" strokeWidth={sw}><path d="M -10 4 C -14 4 -14 -3 -9 -3 C -8 -8 0 -10 3 -5 C 9 -7 13 0 9 4 Z" /></g>;
    case 'service':
      return <g fill="none" stroke="currentColor" strokeWidth={sw}><rect x="-8" y="-7" width="16" height="14" rx="1" /><line x1="-8" y1="-2" x2="8" y2="-2" /><line x1="-8" y1="3" x2="8" y2="3" /></g>;
    case 'ap':
      return <g fill="none" stroke="currentColor" strokeWidth={sw}><path d="M -9 4 C -5 -2 5 -2 9 4" /><path d="M -6 6 C -3 2 3 2 6 6" /><circle cx="0" cy="8" r="1.2" fill="currentColor" /></g>;
    default:
      return <circle r="6" fill="currentColor" />;
  }
}

export default function Topology() {
  const tick = useTicker(60);
  const t = tick * 0.06;

  const edges = useMemo(() =>
    EDGES.map((e, i) => {
      const a = nodeById(e.from);
      const b = nodeById(e.to);
      return { ...e, ax: a.x, ay: a.y, bx: b.x, by: b.y, idx: i };
    }), []);

  const packets = useMemo(() => {
    const out: { edgeIdx: number; phase: number; dir: number }[] = [];
    edges.forEach((e, ei) => {
      const count = e.weight + 1;
      for (let k = 0; k < count; k++) {
        const phase = (k / count + ei * 0.13) % 1;
        out.push({ edgeIdx: ei, phase, dir: ei % 3 === 0 ? -1 : 1 });
      }
    });
    return out;
  }, [edges]);

  return (
    <div className="ppc-topo">
      <div className="ppc-card-head">
        <span className="mono kicker">topology.live</span>
        <span className="ppc-card-meta">
          <span className="ppc-dot ppc-dot-ok" style={{ width: 8, height: 8 }} aria-hidden="true" />
          <span className="mono muted">10 nodes · 10 links · polling 1s</span>
        </span>
      </div>
      <svg viewBox="0 0 920 440" className="ppc-topo-svg" aria-label="animated network topology">
        <defs>
          <pattern id="topo-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--ppc-grid)" strokeWidth="0.5" />
          </pattern>
          <radialGradient id="node-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--ppc-accent)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--ppc-accent)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width="920" height="440" fill="url(#topo-grid)" />

        {edges.map((e) => (
          <g key={e.idx}>
            <line x1={e.ax} y1={e.ay} x2={e.bx} y2={e.by} stroke="var(--ppc-edge)" strokeWidth="1" />
            <line x1={e.ax} y1={e.ay} x2={e.bx} y2={e.by} stroke="var(--ppc-edge-strong)" strokeWidth="0.4" strokeDasharray="2 3" />
          </g>
        ))}

        {packets.map((p, i) => {
          const e = edges[p.edgeIdx];
          const speed = 0.18 + (e.weight - 1) * 0.04;
          let u = (p.phase + t * speed) % 1;
          if (p.dir < 0) u = 1 - u;
          const x = e.ax + (e.bx - e.ax) * u;
          const y = e.ay + (e.by - e.ay) * u;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="2.6" fill="var(--ppc-accent)" />
              <circle cx={x} cy={y} r="6" fill="var(--ppc-accent)" opacity="0.18" />
            </g>
          );
        })}

        {NODES.map((n) => (
          <g key={n.id} transform={`translate(${n.x} ${n.y})`} className="ppc-topo-node">
            <circle r="22" fill="url(#node-glow)" />
            <rect x="-26" y="-18" width="52" height="36" rx="2" fill="var(--ppc-surface-2)" stroke="var(--ppc-border)" />
            <g transform="translate(0 -2)" className="ppc-topo-glyph">
              <NodeGlyph kind={n.kind} />
            </g>
            <text y="14" textAnchor="middle" className="ppc-topo-label">{n.label}</text>
            <text y="32" textAnchor="middle" className="ppc-topo-sub">{n.sub}</text>
          </g>
        ))}

        <g transform="translate(20 410)">
          <circle r="3" fill="var(--ppc-accent)" />
          <text x="10" y="4" className="ppc-topo-legend">packet · in transit</text>
          <line x1="120" y1="0" x2="140" y2="0" stroke="var(--ppc-edge)" strokeWidth="1" />
          <text x="148" y="4" className="ppc-topo-legend">link</text>
        </g>
      </svg>
    </div>
  );
}
