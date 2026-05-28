// Generates the default Open Graph / Twitter share image (1200x630) as a PNG.
//
// Run once with `node scripts/generate-og.mjs` and commit the output to
// public/og-default.png. This is intentionally a build-time/manual script and
// is NOT wired into `astro build`, because `sharp` relies on native bindings
// that do not run in the Cloudflare Workers runtime.
//
// The image mirrors the live NOC-console theme (dark slate background, cyan
// accent, JetBrains-mono-style terminal framing).

import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'public', 'og-default.png');

const W = 1200;
const H = 630;

// Theme tokens lifted from src/styles/global.css.
const BG = '#07090f';
const SURFACE = '#0e1424';
const BORDER = '#1e2a44';
const ACCENT = '#39d0d8';
const TEXT = '#e6edf3';
const MUTED = '#8b949e';
const OK = '#3fb950';
const DOWN = '#f85149';
const WARN = '#d29922';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${BG}"/>
      <stop offset="100%" stop-color="#050810"/>
    </linearGradient>
    <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
      <path d="M32 0 L0 0 0 32" fill="none" stroke="rgba(110,130,150,0.08)" stroke-width="1"/>
    </pattern>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>

  <!-- terminal window frame -->
  <rect x="64" y="80" width="${W - 128}" height="${H - 160}" rx="6"
        fill="${SURFACE}" stroke="${BORDER}" stroke-width="1.5"/>
  <rect x="64" y="80" width="${W - 128}" height="44" rx="6" fill="#0a0e1a"/>
  <rect x="64" y="116" width="${W - 128}" height="8" fill="#0a0e1a"/>
  <circle cx="92" cy="102" r="6" fill="${DOWN}"/>
  <circle cx="114" cy="102" r="6" fill="${WARN}"/>
  <circle cx="136" cy="102" r="6" fill="${OK}"/>
  <text x="168" y="107" font-family="'JetBrains Mono', monospace" font-size="15"
        fill="${MUTED}">~/packetpilot — noc-console</text>

  <!-- brand wordmark -->
  <text x="112" y="232" font-family="'JetBrains Mono', monospace" font-size="34" fill="${ACCENT}">$</text>
  <text x="150" y="232" font-family="'JetBrains Mono', monospace" font-size="34" fill="${TEXT}">packet</text>
  <text x="278" y="232" font-family="'JetBrains Mono', monospace" font-size="34" fill="${ACCENT}" font-weight="600">pilot</text>
  <text x="372" y="232" font-family="'JetBrains Mono', monospace" font-size="34" fill="${MUTED}">.ai</text>

  <!-- headline -->
  <text x="112" y="320" font-family="Inter, system-ui, sans-serif" font-size="56" font-weight="700" fill="${TEXT}">AI for network admins.</text>
  <text x="112" y="388" font-family="Inter, system-ui, sans-serif" font-size="56" font-weight="700" fill="${TEXT}">Automate the boring,</text>
  <text x="112" y="456" font-family="Inter, system-ui, sans-serif" font-size="56" font-weight="700" fill="${ACCENT}">solve the hard.</text>

  <!-- status line -->
  <text x="112" y="520" font-family="'JetBrains Mono', monospace" font-size="18" fill="${MUTED}">
    <tspan fill="${OK}">[ok]</tspan> guides · troubleshooting · prompt-pack · packetpilotai.com
  </text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile(OUT);
console.log(`Wrote ${OUT}`);
