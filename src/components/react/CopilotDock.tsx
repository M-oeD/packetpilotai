import { useState, useEffect, useRef } from 'react';
import { useTypewriter } from './hooks';

const QA = [
  {
    q: 'diagnose 6% packet loss to the gateway',
    tags: ['troubleshoot', 'L1'],
    blocks: [
      { kind: 'thought', text: 'loss to gateway = local segment. skip ISP.' },
      { kind: 'step',    text: '1 · ping the gateway 100x to confirm' },
      { kind: 'code',    lang: 'sh',  text: 'ping 192.168.1.1 -n 100' },
      { kind: 'step',    text: '2 · check the switch interface for CRC + duplex' },
      { kind: 'code',    lang: 'ios', text: 'show interfaces Gi0/4\nshow interfaces Gi0/4 | include duplex|speed' },
      { kind: 'step',    text: '3 · if CRC > 0 → swap the cable, then the SFP' },
      { kind: 'verdict', text: 'most-likely cause: bad cable or duplex mismatch on Gi0/4' },
    ],
  },
  {
    q: 'generate a guest VLAN config for Cisco IOS',
    tags: ['config', 'cisco'],
    blocks: [
      { kind: 'thought', text: 'scope: VLAN 20 access, isolate from corp + mgmt.' },
      { kind: 'code',    lang: 'ios', text: 'vlan 20\n name GUEST\ninterface range Gi0/9 - 16\n switchport mode access\n switchport access vlan 20\n spanning-tree portfast\nip access-list extended GUEST_RESTRICT\n deny  ip 192.168.20.0 0.0.0.255 192.168.10.0 0.0.0.255\n permit ip 192.168.20.0 0.0.0.255 any' },
      { kind: 'verdict', text: 'deployable. lab it in EVE-NG before pushing to prod.' },
    ],
  },
  {
    q: 'why is DNS slow only on Wi-Fi?',
    tags: ['troubleshoot', 'dns'],
    blocks: [
      { kind: 'thought', text: 'scope it: wired vs wireless, internal vs external.' },
      { kind: 'step',    text: '1 · resolve from a wired host — same resolver' },
      { kind: 'code',    lang: 'sh', text: 'dig @192.168.1.1 example.com +stats' },
      { kind: 'step',    text: '2 · if wifi-only is slow → check AP DHCP/option 6' },
      { kind: 'verdict', text: 'common: AP handing out a stale resolver via option 6' },
    ],
  },
  {
    q: "find what's saturating my WAN",
    tags: ['analysis', 'wan'],
    blocks: [
      { kind: 'thought', text: 'need flow-level visibility. interface counters won\'t tell you who.' },
      { kind: 'code',    lang: 'ios', text: 'show interfaces Gi0/0 | include rate\nshow ip cache flow' },
      { kind: 'step',    text: '→ pair with nfdump / pmacct for top-talkers' },
      { kind: 'verdict', text: 'top-talker is usually 1 host doing backup at 16:00 UTC' },
    ],
  },
];

type Block = { kind: string; text: string; lang?: string };

function CopilotBlock({ block }: { block: Block }) {
  const { text } = useTypewriter(block.text, { speed: 6 });
  if (block.kind === 'thought') return (
    <div className="ppc-cop-block thought mono"><span className="muted">~ thought</span> {text}</div>
  );
  if (block.kind === 'step') return (
    <div className="ppc-cop-block step mono"><span className="ppc-cop-marker">▸</span> {text}</div>
  );
  if (block.kind === 'code') return (
    <pre className="ppc-cop-block code mono">
      <span className="ppc-cop-codelang">{block.lang}</span>
      {text}
    </pre>
  );
  if (block.kind === 'verdict') return (
    <div className="ppc-cop-block verdict mono"><span className="ppc-cop-marker ok">✓</span> {text}</div>
  );
  return null;
}

export default function CopilotDock() {
  const [open, setOpen] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth >= 1100
  );
  const [activeIdx, setActiveIdx] = useState(0);
  const [revealed, setRevealed] = useState(0);
  const [thinking, setThinking] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => { if (window.innerWidth < 980) setOpen(false); };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const active = QA[activeIdx];

  useEffect(() => {
    setRevealed(0);
    setThinking(true);
    const t1 = setTimeout(() => setThinking(false), 700);
    const t2 = setTimeout(() => {
      let i = 0;
      const id = setInterval(() => {
        i += 1;
        setRevealed(i);
        if (i >= active.blocks.length) clearInterval(id);
      }, 380);
      return () => clearInterval(id);
    }, 750);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [activeIdx, active.blocks.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [revealed]);

  return (
    <aside className={`ppc-copilot${open ? ' is-open' : ' is-closed'}`}>
      <header className="ppc-copilot-head">
        <span className="ppc-copilot-title">
          <span className="ppc-copilot-glyph" aria-hidden="true">◆</span>
          <span className="mono">co-pilot</span>
          <span className="ppc-pill ok">claude · sonnet</span>
        </span>
        <div className="ppc-copilot-actions">
          <span className="mono muted">⌘ /</span>
          <button
            className="ppc-copilot-toggle"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'collapse co-pilot' : 'expand co-pilot'}
          >
            {open ? '—' : '▸'}
          </button>
        </div>
      </header>

      {open && (
        <>
          <div className="ppc-copilot-questions">
            {QA.map((qa, i) => (
              <button
                key={i}
                className={`ppc-copilot-chip${i === activeIdx ? ' is-active' : ''}`}
                onClick={() => setActiveIdx(i)}
              >
                <span className="ppc-copilot-chip-q mono">{qa.q}</span>
                <span className="ppc-copilot-chip-tags">
                  {qa.tags.map((tg) => (
                    <span key={tg} className="ppc-copilot-tag">{tg}</span>
                  ))}
                </span>
              </button>
            ))}
          </div>

          <div className="ppc-copilot-stream" ref={scrollRef}>
            <div className="ppc-copilot-prompt mono">
              <span className="muted">you ›</span> {active.q}
            </div>
            {thinking && (
              <div className="ppc-copilot-thinking mono">
                <span className="ppc-spin">◐</span> thinking
                <span className="ppc-dots">
                  <span>.</span><span>.</span><span>.</span>
                </span>
              </div>
            )}
            {!thinking && active.blocks.slice(0, revealed).map((b, i) => (
              <CopilotBlock key={i} block={b} />
            ))}
            {!thinking && revealed >= active.blocks.length && (
              <div className="ppc-copilot-done mono">
                <span className="ppc-caret blink">▮</span> answer ready · 4 actions available
              </div>
            )}
          </div>

          <div className="ppc-copilot-input">
            <span className="ppc-copilot-input-prompt">›</span>
            <input className="mono" placeholder="ask packet-pilot anything…" readOnly />
            <span className="ppc-pill muted mono">enter</span>
          </div>
        </>
      )}
    </aside>
  );
}
