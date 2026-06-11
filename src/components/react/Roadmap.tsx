import { useState, useEffect, useCallback } from 'react';
import { ROADMAP, ROADMAP_NODE_COUNT } from '../../data/roadmap';

const STORE_KEY = 'ppc-roadmap-progress-v1';
const SEGMENTS = 24;

export default function Roadmap() {
  // `learned` is empty on the server render and on first client render (matches SSR),
  // then hydrated from localStorage in the effect below — avoids a hydration mismatch.
  const [learned, setLearned] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) setLearned(new Set(JSON.parse(raw) as string[]));
    } catch {
      /* localStorage unavailable — progress just won't persist */
    }
  }, []);

  const toggleLearned = useCallback((id: string) => {
    setLearned((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify([...next]));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const copyPrompt = useCallback((text: string) => {
    try {
      navigator.clipboard?.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      });
    } catch {
      /* clipboard unavailable */
    }
  }, []);

  // Resolve the selected node + its domain.
  let sel: (typeof ROADMAP)[number]['nodes'][number] | null = null;
  let selDomain: (typeof ROADMAP)[number] | null = null;
  for (const d of ROADMAP) {
    const found = d.nodes.find((n) => n.id === selected);
    if (found) {
      sel = found;
      selDomain = d;
      break;
    }
  }

  const doneCount = mounted ? learned.size : 0;
  const total = ROADMAP_NODE_COUNT;
  const filled = Math.round((doneCount / total) * SEGMENTS);
  const bar = '▓'.repeat(filled) + '░'.repeat(Math.max(0, SEGMENTS - filled));
  const pct = Math.round((doneCount / total) * 100);
  const selLearned = sel != null && mounted && learned.has(sel.id);

  return (
    <div className="rm-root">
      <div className="rm-progress">
        <span className="rm-prog-label">progress</span>
        <span className="rm-prog-bar" aria-hidden="true">{bar}</span>
        <span className="rm-prog-count">{doneCount}/{total} · {pct}%</span>
      </div>

      <div className="rm-grid">
        <div className="rm-tree">
          {ROADMAP.map((d) => {
            const dDone = mounted ? d.nodes.filter((n) => learned.has(n.id)).length : 0;
            return (
              <section className="rm-domain" key={d.key}>
                <header className="rm-domain-head">
                  <span className="rm-domain-glyph">{d.glyph}</span>
                  <span className="rm-domain-name">{d.name}</span>
                  <span className="rm-domain-count">{dDone}/{d.nodes.length}</span>
                </header>
                <ul className="rm-nodes">
                  {d.nodes.map((n, i) => {
                    const last = i === d.nodes.length - 1;
                    const isLearned = mounted && learned.has(n.id);
                    const isSel = selected === n.id;
                    return (
                      <li className="rm-node" key={n.id}>
                        <span className="rm-conn" aria-hidden="true">{last ? '└─' : '├─'}</span>
                        <button
                          type="button"
                          className={`rm-mark ${n.postSlug ? 'has-post' : 'prompt-only'} ${isLearned ? 'learned' : ''}`}
                          onClick={() => toggleLearned(n.id)}
                          aria-pressed={isLearned}
                          title={isLearned ? 'learned — click to unmark' : 'mark as learned'}
                        >
                          {isLearned ? '✓' : n.postSlug ? '●' : '○'}
                        </button>
                        <button
                          type="button"
                          className={`rm-label ${isSel ? 'is-sel' : ''} ${isLearned ? 'learned' : ''}`}
                          onClick={() => setSelected(n.id)}
                        >
                          {n.label}
                        </button>
                        {n.postSlug ? (
                          <a className="rm-hint rm-hint-link" href={`/blog/${n.postSlug}/`}>guide ↗</a>
                        ) : (
                          <span className="rm-hint">prompt</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}

          <div className="rm-legend">
            <span><span className="rm-lg accent">{'●'}</span> guide live</span>
            <span><span className="rm-lg muted">{'○'}</span> prompt only</span>
            <span><span className="rm-lg ok">{'✓'}</span> learned · saved in your browser</span>
          </div>
        </div>

        <aside className="rm-console" aria-live="polite">
          {sel && selDomain ? (
            <div className="rm-con-inner">
              <div className="rm-con-head">
                <span className="rm-con-kick">{selDomain.glyph} {selDomain.name}</span>
                <span className={`rm-con-badge ${sel.postSlug ? 'accent' : 'muted'}`}>
                  {sel.postSlug ? 'guide live' : 'prompt only'}
                </span>
              </div>
              <h3 className="rm-con-title">{sel.label}</h3>
              <p className="rm-con-blurb">{sel.blurb}</p>

              <div className="rm-prompt">
                <div className="rm-prompt-bar">
                  <span className="rm-prompt-lang">claude prompt</span>
                  <button type="button" className={`rm-copy ${copied ? 'copied' : ''}`} onClick={() => copyPrompt(sel!.prompt)}>
                    {copied ? '✓ copied' : '⎜ copy'}
                  </button>
                </div>
                <pre className="rm-prompt-body">{sel.prompt}</pre>
              </div>

              <div className="rm-con-actions">
                {sel.postSlug ? (
                  <a className="rm-btn primary" href={`/blog/${sel.postSlug}/`}>read the guide {'↗'}</a>
                ) : (
                  <span className="rm-con-note">Guide in flight — the prompt works today.</span>
                )}
                <button type="button" className="rm-btn" onClick={() => toggleLearned(sel!.id)}>
                  {selLearned ? '✓ learned' : 'mark learned'}
                </button>
              </div>

              <div className="rm-con-foot">
                <a href="/prompt-pack">60+ field-tested prompts like this {'→'} the pack · $29</a>
              </div>
            </div>
          ) : (
            <div className="rm-con-empty">
              <p className="rm-con-empty-line"><span className="rm-con-sigil">$</span> select a node to load its console</p>
              <p className="rm-con-empty-sub">
                Every topic ships with a copy-paste Claude prompt. {'●'} = full guide live · {'○'} = prompt only (for now).
                Mark what you know — progress saves to this browser.
              </p>
            </div>
          )}
        </aside>
      </div>

      <style>{`
        .rm-root { font-family: var(--ppc-mono); color: var(--ppc-text-2); }

        .rm-progress {
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 22px; padding: 10px 14px;
          border: 1px solid var(--ppc-border); background: var(--ppc-bg-2);
          border-radius: var(--ppc-radius); font-size: 12px;
        }
        .rm-prog-label { color: var(--ppc-muted); text-transform: uppercase; letter-spacing: 0.12em; font-size: 10px; white-space: nowrap; }
        .rm-prog-bar { color: var(--ppc-accent); letter-spacing: 1px; flex: 1; overflow: hidden; white-space: nowrap; }
        .rm-prog-count { color: var(--ppc-text); white-space: nowrap; }

        .rm-grid { display: grid; grid-template-columns: 1fr 360px; gap: 24px; align-items: start; }
        .rm-tree { min-width: 0; }

        .rm-domain { margin-bottom: 22px; }
        .rm-domain-head {
          display: flex; align-items: center; gap: 10px;
          padding-bottom: 8px; margin-bottom: 6px;
          border-bottom: 1px dashed var(--ppc-border-soft);
        }
        .rm-domain-glyph { color: var(--ppc-accent); font-size: 12px; }
        .rm-domain-name { color: var(--ppc-text); font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; flex: 1; }
        .rm-domain-count { color: var(--ppc-muted); font-size: 11px; }

        .rm-nodes { list-style: none; margin: 0; padding: 0; }
        .rm-node { display: flex; align-items: center; gap: 8px; padding: 3px 0; }
        .rm-conn { color: var(--ppc-muted-2); user-select: none; font-size: 13px; }

        .rm-mark {
          background: transparent; border: 0; cursor: pointer;
          font-size: 12px; width: 18px; padding: 0; line-height: 1;
        }
        .rm-mark.has-post { color: var(--ppc-accent); }
        .rm-mark.prompt-only { color: var(--ppc-muted); }
        .rm-mark.learned { color: var(--ppc-ok); }
        .rm-mark:hover { filter: brightness(1.35); }

        .rm-label {
          background: transparent; border: 0; cursor: pointer;
          color: var(--ppc-text-2); font-family: inherit; font-size: 13px;
          padding: 2px 6px; text-align: left; border-radius: var(--ppc-radius);
          flex: 1; min-width: 0;
        }
        .rm-label:hover { color: var(--ppc-text); background: var(--ppc-surface); }
        .rm-label.is-sel { color: var(--ppc-accent); background: var(--ppc-accent-soft); }
        .rm-label.learned { color: var(--ppc-muted); text-decoration: line-through; text-decoration-color: var(--ppc-muted-2); }

        .rm-hint { color: var(--ppc-muted-2); font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; white-space: nowrap; }
        .rm-hint-link { color: var(--ppc-muted); text-decoration: none; }
        .rm-hint-link:hover { color: var(--ppc-accent); text-decoration: underline; text-underline-offset: 2px; }

        .rm-legend {
          display: flex; gap: 16px; flex-wrap: wrap;
          margin-top: 8px; padding-top: 12px;
          border-top: 1px dashed var(--ppc-border-soft);
          font-size: 11px; color: var(--ppc-muted);
        }
        .rm-lg { margin-right: 5px; }
        .rm-lg.accent { color: var(--ppc-accent); }
        .rm-lg.ok { color: var(--ppc-ok); }
        .rm-lg.muted { color: var(--ppc-muted); }

        .rm-console {
          position: sticky; top: 80px;
          border: 1px solid var(--ppc-border); background: var(--ppc-surface);
          border-radius: var(--ppc-radius); min-height: 200px;
        }
        .rm-con-inner { padding: 16px; }
        .rm-con-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 10px; }
        .rm-con-kick { color: var(--ppc-muted); font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; }
        .rm-con-badge { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; padding: 1px 6px; border-radius: var(--ppc-radius); border: 1px solid; white-space: nowrap; }
        .rm-con-badge.accent { color: var(--ppc-accent); border-color: var(--ppc-accent); background: var(--ppc-accent-soft); }
        .rm-con-badge.muted { color: var(--ppc-muted); border-color: var(--ppc-border); }
        .rm-con-title { font-family: var(--ppc-sans); font-size: 18px; font-weight: 600; color: var(--ppc-text); margin: 0 0 8px; letter-spacing: -0.01em; line-height: 1.25; }
        .rm-con-blurb { font-size: 12.5px; line-height: 1.6; color: var(--ppc-text-2); margin: 0 0 14px; }

        .rm-prompt {
          border: 1px solid var(--ppc-border-soft); border-left: 2px solid var(--ppc-accent);
          background: var(--ppc-bg-2); border-radius: var(--ppc-radius); margin-bottom: 14px;
        }
        .rm-prompt-bar { display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; border-bottom: 1px solid var(--ppc-border-soft); }
        .rm-prompt-lang { font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--ppc-muted-2); }
        .rm-copy { background: transparent; border: 1px solid var(--ppc-border-soft); color: var(--ppc-muted); cursor: pointer; font-family: inherit; font-size: 10px; padding: 2px 8px; border-radius: var(--ppc-radius); }
        .rm-copy:hover { color: var(--ppc-accent); border-color: var(--ppc-accent); }
        .rm-copy.copied { color: var(--ppc-ok); border-color: var(--ppc-ok); }
        .rm-prompt-body { margin: 0; padding: 10px 12px; font-size: 11.5px; line-height: 1.6; color: var(--ppc-text-2); white-space: pre-wrap; word-break: break-word; font-family: var(--ppc-mono); }

        .rm-con-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-bottom: 14px; }
        .rm-btn {
          display: inline-flex; align-items: center; padding: 7px 12px;
          border: 1px solid var(--ppc-border); background: var(--ppc-surface); color: var(--ppc-text);
          font-family: inherit; font-size: 12px; border-radius: var(--ppc-radius); cursor: pointer; text-decoration: none;
        }
        .rm-btn:hover { border-color: var(--ppc-accent); color: var(--ppc-accent); text-decoration: none; }
        .rm-btn.primary { background: var(--ppc-accent); color: var(--ppc-bg); border-color: var(--ppc-accent); }
        .rm-btn.primary:hover { background: var(--ppc-bg); color: var(--ppc-accent); }
        .rm-con-note { font-size: 11px; color: var(--ppc-muted); }

        .rm-con-foot { border-top: 1px dashed var(--ppc-border-soft); padding-top: 10px; }
        .rm-con-foot a { color: var(--ppc-accent); font-size: 11px; }

        .rm-con-empty { padding: 20px 16px; color: var(--ppc-muted); font-size: 12px; }
        .rm-con-empty-line { margin: 0; }
        .rm-con-sigil { color: var(--ppc-accent); margin-right: 6px; }
        .rm-con-empty-sub { font-size: 11px; line-height: 1.6; color: var(--ppc-muted-2); margin: 10px 0 0; }

        @media (max-width: 860px) {
          .rm-grid { grid-template-columns: 1fr; }
          .rm-console { position: relative; top: 0; }
        }
      `}</style>
    </div>
  );
}
