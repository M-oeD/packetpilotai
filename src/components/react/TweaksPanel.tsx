import { useState, useEffect } from 'react';

type Theme = 'dark' | 'midnight' | 'amber';
type Density = 'compact' | 'cozy';

const THEMES: { id: Theme; label: string }[] = [
  { id: 'dark', label: 'Dark' },
  { id: 'midnight', label: 'Midnight' },
  { id: 'amber', label: 'Amber CRT' },
];

const DENSITIES: { id: Density; label: string }[] = [
  { id: 'compact', label: 'Compact' },
  { id: 'cozy', label: 'Cozy' },
];

function loadSaved() {
  try {
    const raw = localStorage.getItem('ppc-tweaks');
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function applyTweaks(theme: Theme, accent: string, density: Density) {
  const el = document.documentElement;
  el.setAttribute('data-theme', theme);
  el.setAttribute('data-density', density);
  // Override --ppc-accent inline for themes where accent differs from CSS default
  el.style.setProperty('--ppc-accent', accent);
  // accent-soft is rgba of accent at 14%
  const r = parseInt(accent.slice(1, 3), 16);
  const g = parseInt(accent.slice(3, 5), 16);
  const b = parseInt(accent.slice(5, 7), 16);
  el.style.setProperty('--ppc-accent-soft', `rgba(${r},${g},${b},0.14)`);
}

export default function TweaksPanel() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>('amber');
  const [accent, setAccent] = useState('#ff0000');
  const [density, setDensity] = useState<Density>('compact');

  useEffect(() => {
    const saved = loadSaved();
    if (saved) {
      setTheme(saved.theme ?? 'amber');
      setAccent(saved.accent ?? '#ff0000');
      setDensity(saved.density ?? 'compact');
    }
  }, []);

  useEffect(() => {
    applyTweaks(theme, accent, density);
    try {
      localStorage.setItem('ppc-tweaks', JSON.stringify({ theme, accent, density }));
    } catch {}
  }, [theme, accent, density]);

  return (
    <div className="ppc-tweaks">
      <div className="ppc-tweaks-head" onClick={() => setOpen((o) => !o)} role="button" tabIndex={0} aria-expanded={open}>
        <span className="ppc-tweaks-label">theme</span>
        <span className="mono muted" style={{ fontSize: 10 }}>{open ? '▾' : '▸'}</span>
      </div>
      {open && (
        <div className="ppc-tweaks-body">
          <div className="ppc-tweaks-row">
            <span className="ppc-tweaks-row-label">Theme</span>
            <div className="ppc-tweaks-options">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  className={`ppc-tweaks-option${theme === t.id ? ' is-active' : ''}`}
                  onClick={() => setTheme(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="ppc-tweaks-row">
            <span className="ppc-tweaks-row-label">Accent</span>
            <div className="ppc-tweaks-color">
              <input
                type="color"
                className="ppc-tweaks-swatch"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
              />
              <span className="mono muted" style={{ fontSize: 10 }}>{accent}</span>
            </div>
          </div>
          <div className="ppc-tweaks-row">
            <span className="ppc-tweaks-row-label">Density</span>
            <div className="ppc-tweaks-options">
              {DENSITIES.map((d) => (
                <button
                  key={d.id}
                  className={`ppc-tweaks-option${density === d.id ? ' is-active' : ''}`}
                  onClick={() => setDensity(d.id)}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
