import { useState, useEffect, useMemo } from 'react';

const LINES = [
  '[ 0.001 ] kernel.boot: packetpilot.console',
  '[ 0.014 ] mod.load: telemetry, traceroute, copilot',
  '[ 0.028 ] link.up:  edge-sfo-01 / 10G',
  '[ 0.041 ] route.up: 0.0.0.0/0 via wan',
  '[ 0.055 ] copilot.up: claude-sonnet · ready',
  '[ 0.061 ] ready.',
];

export default function HeroBoot() {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setShown((s) => (s >= LINES.length ? s : s + 1));
    }, 110);
    return () => clearInterval(id);
  }, []);

  return (
    <pre className="ppc-hero-boot mono">
      {LINES.slice(0, shown).join('\n')}
      <span className="ppc-caret blink">▮</span>
    </pre>
  );
}
