// Generates Open Graph / Twitter share images (1200x630 PNG):
//   - public/og-default.png        sitewide default card
//   - public/og/<slug>.png         per-post card (title + tag)
//
// Run with `node scripts/generate-og.mjs` and commit the output. This is
// intentionally a manual/build-time script and is NOT wired into `astro build`,
// because `sharp` relies on native bindings that don't run in the Cloudflare
// Workers runtime. All cards are emitted at exactly 1200x630.
//
// Cards mirror the live NOC-console theme from src/styles/global.css.

import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, '..', 'public');
const OG_DIR = join(PUBLIC, 'og');

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

const escapeXml = (s) =>
	s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Greedy word-wrap to a max character width. */
function wrap(text, maxChars) {
	const words = text.split(/\s+/);
	const lines = [];
	let line = '';
	for (const w of words) {
		if (line && (line + ' ' + w).length > maxChars) {
			lines.push(line);
			line = w;
		} else {
			line = line ? line + ' ' + w : w;
		}
	}
	if (line) lines.push(line);
	return lines;
}

/** Shared terminal-window chrome + grid background. */
function frame(titleBar) {
	return `
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>
  <rect x="64" y="80" width="${W - 128}" height="${H - 160}" rx="6" fill="${SURFACE}" stroke="${BORDER}" stroke-width="1.5"/>
  <rect x="64" y="80" width="${W - 128}" height="44" rx="6" fill="#0a0e1a"/>
  <rect x="64" y="116" width="${W - 128}" height="8" fill="#0a0e1a"/>
  <circle cx="92" cy="102" r="6" fill="${DOWN}"/>
  <circle cx="114" cy="102" r="6" fill="${WARN}"/>
  <circle cx="136" cy="102" r="6" fill="${OK}"/>
  <text x="168" y="107" font-family="'JetBrains Mono', monospace" font-size="15" fill="${MUTED}">${escapeXml(titleBar)}</text>`;
}

const defs = `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${BG}"/>
      <stop offset="100%" stop-color="#050810"/>
    </linearGradient>
    <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
      <path d="M32 0 L0 0 0 32" fill="none" stroke="rgba(110,130,150,0.08)" stroke-width="1"/>
    </pattern>
  </defs>`;

/** Sitewide default card. */
function defaultCard() {
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${defs}
  ${frame('~/packetpilot — noc-console')}
  <text x="112" y="232" font-family="'JetBrains Mono', monospace" font-size="34" fill="${ACCENT}">$</text>
  <text x="150" y="232" font-family="'JetBrains Mono', monospace" font-size="34" fill="${TEXT}">packet</text>
  <text x="278" y="232" font-family="'JetBrains Mono', monospace" font-size="34" fill="${ACCENT}" font-weight="600">pilot</text>
  <text x="372" y="232" font-family="'JetBrains Mono', monospace" font-size="34" fill="${MUTED}">.ai</text>
  <text x="112" y="320" font-family="Inter, system-ui, sans-serif" font-size="56" font-weight="700" fill="${TEXT}">AI for network admins.</text>
  <text x="112" y="388" font-family="Inter, system-ui, sans-serif" font-size="56" font-weight="700" fill="${TEXT}">Automate the boring,</text>
  <text x="112" y="456" font-family="Inter, system-ui, sans-serif" font-size="56" font-weight="700" fill="${ACCENT}">solve the hard.</text>
  <text x="112" y="520" font-family="'JetBrains Mono', monospace" font-size="18" fill="${MUTED}"><tspan fill="${OK}">[ok]</tspan> guides · troubleshooting · prompt-pack · packetpilotai.com</text>
</svg>`;
}

/** Per-post card: brand eyebrow, wrapped title, tag/footer line. */
function postCard({ title, tag }) {
	const lines = wrap(title, 24);
	const fontSize = lines.length <= 2 ? 54 : lines.length === 3 ? 46 : 40;
	const lineHeight = Math.round(fontSize * 1.18);
	// Vertically center the title block in the body area (~y 180..470).
	const blockHeight = lines.length * lineHeight;
	let y = 300 - blockHeight / 2 + fontSize;
	const titleTspans = lines
		.map((l, i) => `<text x="112" y="${y + i * lineHeight}" font-family="Inter, system-ui, sans-serif" font-size="${fontSize}" font-weight="700" fill="${TEXT}">${escapeXml(l)}</text>`)
		.join('\n  ');

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${defs}
  ${frame('~/packetpilot — /blog')}
  <text x="112" y="200" font-family="'JetBrains Mono', monospace" font-size="22" fill="${ACCENT}">$ packetpilot.ai <tspan fill="${MUTED}">/blog</tspan></text>
  ${titleTspans}
  <text x="112" y="520" font-family="'JetBrains Mono', monospace" font-size="18" fill="${MUTED}"><tspan fill="${ACCENT}">[${escapeXml(tag)}]</tspan> · network admin guide · packetpilotai.com</text>
</svg>`;
}

// slug -> { title, tag } for every published post.
const POSTS = {
	'5-free-network-troubleshooting-tools-2026': { title: '5 Free Network Troubleshooting Tools Every Admin Should Have in 2026', tag: 'tools' },
	'ai-generate-network-configs': { title: 'How to Use AI to Generate Network Configurations', tag: 'ai' },
	'claude-prompt-pack-network-admins': { title: 'Introducing the Claude Prompt Pack for Network Admins', tag: 'pack' },
	'diagnose-dns-failures-fast': { title: 'How to Diagnose DNS Failures Fast', tag: 'dns' },
	'diagnose-packet-loss': { title: 'How to Diagnose Packet Loss Fast', tag: 'troubleshooting' },
	'find-what-saturates-your-wan': { title: "How to Find What's Saturating Your WAN", tag: 'wan' },
	'troubleshoot-slow-network-performance': { title: 'Troubleshoot Slow Network Performance Step-by-Step', tag: 'performance' },
	'using-claude-to-audit-firewall-rules': { title: 'Using Claude to Audit Firewall Rules', tag: 'security' },
};

mkdirSync(OG_DIR, { recursive: true });

await sharp(Buffer.from(defaultCard())).png().toFile(join(PUBLIC, 'og-default.png'));
console.log('Wrote public/og-default.png');

for (const [slug, data] of Object.entries(POSTS)) {
	await sharp(Buffer.from(postCard(data))).png().toFile(join(OG_DIR, `${slug}.png`));
	console.log(`Wrote public/og/${slug}.png`);
}
