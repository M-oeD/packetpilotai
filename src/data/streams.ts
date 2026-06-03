// PacketPilot AI — content stream definitions.
// Single source of truth for the editorial backbone.
// Each blog post may belong to one stream (via frontmatter `stream` field, see content.config.ts).
// New streams require: (1) entry in STREAMS, (2) accent variant in global.css if novel,
// (3) the dynamic /series/[stream]/index.astro route picks them up automatically.

export type StreamKey = 'failure-library' | 'showdown' | 'migration' | 'potw' | 'acr' | 'loadout';

export type StreamAccent = 'ok' | 'warn' | 'down' | 'accent' | 'info';

export type Stream = {
  key: StreamKey;
  name: string;          // Full display name
  short: string;         // Short label for chips/pills
  description: string;   // Lede for series landing pages and meta description
  accent: StreamAccent;  // Maps to .ppc-pill.<accent> in global.css
  glyph: string;         // Terminal-native ASCII marker
  cadence: string;       // Editorial cadence label (informational)
  slugPrefix: string;    // URL slug prefix for pillar/numbered posts
};

export const STREAMS: Record<StreamKey, Stream> = {
  'failure-library': {
    key: 'failure-library',
    name: 'The Failure Library',
    short: 'failure',
    description:
      'Real production incidents, told as stories. Each one ends with the Claude prompt that triages it.',
    accent: 'down',
    glyph: '[!]',
    cadence: 'bi-weekly',
    slugPrefix: 'failure',
  },
  showdown: {
    key: 'showdown',
    name: 'AI Head-to-Head Showdown',
    short: 'showdown',
    description:
      'Claude vs ChatGPT vs Gemini on the same network task. Who lies, who hallucinates CLI flags, who actually ships.',
    accent: 'warn',
    glyph: '[vs]',
    cadence: 'monthly',
    slugPrefix: 'showdown',
  },
  migration: {
    key: 'migration',
    name: 'Migration Playbook',
    short: 'migration',
    description:
      'Vendor-to-vendor migration playbooks with Claude as your translator. Decision trees, gotchas, rollback plans.',
    accent: 'accent',
    glyph: '[→]',
    cadence: 'monthly',
    slugPrefix: 'migration',
  },
  potw: {
    key: 'potw',
    name: 'Packet of the Week',
    short: 'potw',
    description:
      'Weekly pcap puzzle. Here is the capture — what broke? Reveal, root cause, and the prompt that solves it.',
    accent: 'ok',
    glyph: '[?]',
    cadence: 'weekly',
    slugPrefix: 'potw',
  },
  acr: {
    key: 'acr',
    name: 'AI Configs Reviewed',
    short: 'acr',
    description:
      'AI-generated configs pulled from the wild, audited with Claude. Half of them explode. We name names.',
    accent: 'info',
    glyph: '[~]',
    cadence: 'monthly',
    slugPrefix: 'acr',
  },
  loadout: {
    key: 'loadout',
    name: 'The Loadout',
    short: 'loadout',
    description:
      'How real operators actually wield AI — setup, prompts, and the moves the posers skipped. Less hype, more loadout.',
    accent: 'accent',
    glyph: '[>]',
    cadence: 'ongoing',
    slugPrefix: 'loadout',
  },
};

// Ordered list for iteration (filter chips, series index, etc.).
// Order roughly reflects editorial priority — POTW is the cadence engine.
export const STREAM_LIST: Stream[] = [
  STREAMS.potw,
  STREAMS['failure-library'],
  STREAMS.showdown,
  STREAMS.migration,
  STREAMS.acr,
  STREAMS.loadout,
];

export function getStream(key: string | null | undefined): Stream | undefined {
  if (!key) return undefined;
  return STREAMS[key as StreamKey];
}

export function isStreamKey(value: unknown): value is StreamKey {
  return typeof value === 'string' && value in STREAMS;
}
