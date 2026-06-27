# Funnel Audit - 2026-06-25

Scope: `src/content/blog/`, `src/pages/index.astro`, `src/components/Nav.astro`, `src/pages/prompt-pack.astro`, `src/layouts/BlogPost.astro`, `src/components/NewsletterBar.astro`, and page files that render Beehiiv.

Blog post count: 26 Markdown files in `src/content/blog/`.

Word-count basis: approximate body word count after excluding frontmatter, code fences, inline code, HTML tags, Markdown link URLs, and image syntax.

## 1. Blog Inventory

No file in `src/content/blog/` contains `beehiiv` or `subscribe-forms.beehiiv.com`. The newsletter CTA column below reports newsletter/subscribe CTA text inside the Markdown file.

| filename | title | pubDate | series/prefix | primary topic in 3-5 words | contains a Gumroad/product CTA link? (yes/no + URL) | contains a Beehiiv/newsletter CTA? | approx word count |
|---|---|---:|---|---|---|---|---:|
| `src/content/blog/5-free-network-troubleshooting-tools-2026.md` | 5 Free Network Troubleshooting Tools Every Admin Should Have in 2026 | 2026-04-24 | other | free troubleshooting tools | no | no | 1458 |
| `src/content/blog/acr-01-reddit-bgp-configs.md` | AI Configs Reviewed #01: The BGP Config That Comes Up and Black-Holes Your Traffic | 2026-05-31 | acr | BGP config review | yes: `/prompt-pack?utm_source=packetpilotai&utm_medium=blog&utm_campaign=acr-01-reddit-bgp-configs` | yes | 926 |
| `src/content/blog/acr-02-pfsense-nat-from-the-wild.md` | AI Configs Reviewed #02: The pfSense Port Forward That Put RDP on the Internet | 2026-05-31 | acr | pfSense NAT exposure | yes: `/prompt-pack?utm_source=packetpilotai&utm_medium=blog&utm_campaign=acr-02-pfsense-nat-from-the-wild` | yes | 867 |
| `src/content/blog/ai-generate-network-configs.md` | How to Use AI to Generate Network Configurations | 2026-04-18 | other | AI network configs | no | no | 1023 |
| `src/content/blog/claude-prompt-pack-network-admins.md` | Introducing the Claude Prompt Pack for Network Admins | 2026-04-19 | other | Claude prompt pack | yes: `https://packetpilotai.gumroad.com/l/vepip?utm_source=packetpilotai&utm_medium=blog&utm_campaign=claude-prompt-pack-network-admins` | no | 885 |
| `src/content/blog/diagnose-dns-failures-fast.md` | How to Diagnose DNS Failures Fast | 2026-04-24 | other | DNS failure diagnosis | no | no | 1243 |
| `src/content/blog/diagnose-packet-loss.md` | How to Diagnose Packet Loss Fast | 2026-04-18 | other | packet loss diagnosis | no | no | 1231 |
| `src/content/blog/failure-01-spanning-tree-loop-at-3am.md` | Failure Library #01: The Spanning-Tree Loop That Hit at 3:14 AM | 2026-05-20 | failure | spanning-tree loop outage | yes: `/prompt-pack?utm_source=packetpilotai&utm_medium=blog&utm_campaign=failure-01-spanning-tree-loop-at-3am` | yes | 1132 |
| `src/content/blog/failure-02-forgotten-hosts-file.md` | Failure Library #02: The DNS Outage That Wasn't DNS | 2026-05-31 | failure | hosts file DNS outage | yes: `/prompt-pack?utm_source=packetpilotai&utm_medium=blog&utm_campaign=failure-02-forgotten-hosts-file` | yes | 995 |
| `src/content/blog/failure-03-the-outage-that-was-a-clock.md` | Failure Library #03: The Authentication Outage That Was a Clock | 2026-05-31 | failure | clock authentication outage | yes: `/prompt-pack?utm_source=packetpilotai&utm_medium=blog&utm_campaign=failure-03-the-outage-that-was-a-clock` | yes | 1032 |
| `src/content/blog/find-what-saturates-your-wan.md` | How to Find What's Saturating Your WAN | 2026-04-24 | other | WAN saturation diagnosis | no | no | 1437 |
| `src/content/blog/migration-cisco-asa-to-pfsense.md` | Migration Playbook: Cisco ASA -> pfSense, With Claude as Your Translator | 2026-05-31 | migration | ASA to pfSense migration | yes: `/prompt-pack?utm_source=packetpilotai&utm_medium=blog&utm_campaign=migration-cisco-asa-to-pfsense` | yes | 1441 |
| `src/content/blog/migration-fortigate-to-opnsense.md` | Migration Playbook: FortiGate -> OPNsense, With Claude as Your Translator | 2026-05-31 | migration | FortiGate to OPNsense migration | yes: `/prompt-pack?utm_source=packetpilotai&utm_medium=blog&utm_campaign=migration-fortigate-to-opnsense` | yes | 1244 |
| `src/content/blog/network-incident-checklist.md` | The Network Incident Checklist: 8 Steps in the First 5 Minutes | 2026-05-29 | other | network incident checklist | yes: `/prompt-pack` | no | 1028 |
| `src/content/blog/potw-01-truncated-dns-query.md` | Packet of the Week #01: The Truncated DNS Query | 2026-05-20 | potw | truncated DNS query | yes: `/prompt-pack?utm_source=packetpilotai&utm_medium=blog&utm_campaign=potw-01-truncated-dns-query` | yes | 629 |
| `src/content/blog/potw-02-one-byte-then-silence.md` | Packet of the Week #02: One Byte, Then Silence | 2026-05-31 | potw | TCP one-byte stall | yes: `/prompt-pack?utm_source=packetpilotai&utm_medium=blog&utm_campaign=potw-02-one-byte-then-silence` | yes | 766 |
| `src/content/blog/potw-03-duplicate-ip-arp-war.md` | Packet of the Week #03: The Host That Blinks | 2026-05-31 | potw | duplicate IP ARP | yes: `/prompt-pack?utm_source=packetpilotai&utm_medium=blog&utm_campaign=potw-03-duplicate-ip-arp-war` | yes | 733 |
| `src/content/blog/potw-04-asymmetric-routing-stateful-drop.md` | Packet of the Week #04: Ping Works, TCP Doesn't | 2026-05-31 | potw | asymmetric routing drop | yes: `/prompt-pack?utm_source=packetpilotai&utm_medium=blog&utm_campaign=potw-04-asymmetric-routing-stateful-drop` | yes | 868 |
| `src/content/blog/potw-05-dhcp-snooping-blackhole.md` | Packet of the Week #05: The Rogue DHCP Server That Wasn't | 2026-05-31 | potw | DHCP snooping blackhole | yes: `/prompt-pack?utm_source=packetpilotai&utm_medium=blog&utm_campaign=potw-05-dhcp-snooping-blackhole` | yes | 711 |
| `src/content/blog/potw-06-duplex-mismatch.md` | Packet of the Week #06: The Uplink That Only Ran Downhill | 2026-06-05 | potw | duplex mismatch uplink | yes: `/prompt-pack?utm_source=packetpilotai&utm_medium=blog&utm_campaign=potw-06-duplex-mismatch` | yes | 1113 |
| `src/content/blog/setting-up-claude-for-real-work.md` | Setting Up Claude for Real Work | 2026-06-03 | other | Claude work setup | yes: `https://packetpilotai.gumroad.com/l/vepip` | no | 699 |
| `src/content/blog/showdown-01-claude-vs-chatgpt-vs-gemini-bgp.md` | AI Showdown #01: Can Claude, ChatGPT, and Gemini Configure BGP Without Leaking Routes? | 2026-05-31 | showdown | AI BGP showdown | yes: `/prompt-pack?utm_source=packetpilotai&utm_medium=blog&utm_campaign=showdown-01-claude-vs-chatgpt-vs-gemini-bgp` | yes | 1320 |
| `src/content/blog/showdown-02-claude-vs-chatgpt-vs-gemini-netmiko.md` | AI Showdown #02: Can Claude, ChatGPT, and Gemini Write a Netmiko Script That Survives 50 Switches? | 2026-05-31 | showdown | AI Netmiko showdown | yes: `/prompt-pack?utm_source=packetpilotai&utm_medium=blog&utm_campaign=showdown-02-claude-vs-chatgpt-vs-gemini-netmiko` | yes | 918 |
| `src/content/blog/troubleshoot-slow-network-performance.md` | Troubleshoot Slow Network Performance Step-by-Step | 2026-04-18 | other | slow network troubleshooting | no | no | 1109 |
| `src/content/blog/using-claude-to-audit-firewall-rules.md` | Using Claude to Audit Firewall Rules | 2026-04-24 | other | firewall rule auditing | no | no | 1563 |
| `src/content/blog/why-claude-gives-wrong-network-configs.md` | Why Claude Gives Wrong Network Configs (And the Fix That Takes 2 Minutes) | 2026-05-29 | other | wrong AI configs | yes: `/prompt-pack` | no | 900 |

## 2. Homepage Product Surfacing

Source files checked: `src/pages/index.astro` and imported component `src/components/Nav.astro`.

The product is linked from the homepage.

Source-order positions:

| source order | file | source location | destination | CTA text |
|---:|---|---|---|---|
| 1 | `src/components/Nav.astro`, rendered by `src/pages/index.astro:73` | `src/components/Nav.astro:9-15`, `src/components/Nav.astro:32-35` | `/prompt-pack` | `/prompt-pack` |
| 2 | `src/pages/index.astro` | `src/pages/index.astro:101-103` | `https://packetpilotai.gumroad.com/l/vepip` | `▸ get prompt pack $29` |
| 3 | `src/pages/index.astro` | `src/pages/index.astro:198-235` | `https://packetpilotai.gumroad.com/l/vepip` | `▸ get the pack · $29` |

Exact source for the shared nav product link:

```astro
const NAV_ITEMS = [
  { href: '/', label: '/home' },
  { href: '/blog', label: '/blog' },
  { href: '/prompt-pack', label: '/prompt-pack' },
  { href: '/roadmap', label: '/roadmap' },
  { href: '/tools', label: '/tools' },
  { href: '/about', label: '/about' },
];
```

```astro
<nav class="ppc-nav-items">
  {NAV_ITEMS.map((it) => (
    <a href={it.href} class:list={["ppc-nav-item", { "is-active": isActive(it.href) }]}>{it.label}</a>
  ))}
</nav>
```

Exact homepage hero Gumroad markup:

```astro
<a class="ppc-btn ghost mono" href="https://packetpilotai.gumroad.com/l/vepip" target="_blank" rel="noopener">
  ▸ get prompt pack <span class="muted">$29</span>
</a>
```

Exact homepage prompt-pack section Gumroad markup:

```astro
<a class="ppc-btn primary" href="https://packetpilotai.gumroad.com/l/vepip" target="_blank" rel="noopener">
  <span class="mono">▸ get the pack · $29</span>
</a>
```

The homepage prompt-pack section includes this displayed product block at `src/pages/index.astro:209-220`:

```astro
<pre class="ppc-pack-ascii mono">{`┌─ PROMPT PACK v1 ──────────────────────────────┐
│                                                │
│  ⚙  config-generation       ×  7 prompts      │
│  🔍  troubleshooting         ×  7 prompts      │
│  🐍  python & automation     ×  6 prompts      │
│  📄  documentation           ×  5 prompts      │
│  🔒  security & audit        ×  5 prompts      │
│  🤖  ai workflows            × 10 prompts      │
│  ⚡  quick-fire              × 10 prompts      │
│                                                │
│  packetpilot.ai/pack            ──── $29 ──── │
└────────────────────────────────────────────────┘`}</pre>
```

## 3. Product Page Facts

Product sources checked: `src/content/blog/claude-prompt-pack-network-admins.md`, `src/pages/prompt-pack.astro`, and `products/claude-prompt-pack-v1/claude-prompt-pack-network-admins.md`.

### Prompt Categories And Counts

`src/content/blog/claude-prompt-pack-network-admins.md:8` states `60 production-ready prompts`. Its frontmatter display at `src/content/blog/claude-prompt-pack-network-admins.md:10-16` lists these counted categories:

| category as written | count |
|---|---:|
| Config Generation | 7 |
| Troubleshooting | 7 |
| Python Automation | 6 |
| Documentation | 5 |
| Security & Auditing | 5 |
| AI Workflows | 10 |
| Quick-Fire | 10 |

`src/pages/prompt-pack.astro:11-29` and `src/pages/prompt-pack.astro:84-90` list these counted categories:

| category as written | count |
|---|---:|
| Config Generation | 7 |
| Troubleshooting | 7 |
| Python & Automation | 6 |
| Documentation | 5 |
| Security & Audit | 5 |
| AI Workflows | 10 |
| Quick-Fire | 10 |

Unclear: `src/content/blog/claude-prompt-pack-network-admins.md:62-64` lists `Wireless Networks` and `AI-Assisted Workflows` in the body without counts:

```md
**Wireless Networks** — Site survey planning, Wi-Fi troubleshooting, 802.1X/RADIUS configuration.

**AI-Assisted Workflows** — Root cause analysis from logs, NOC weekly summaries, vendor escalation emails, RFP evaluation, budget justifications, post-mortem facilitation.
```

Unclear: the counted category rows in `src/content/blog/claude-prompt-pack-network-admins.md:10-16`, `src/pages/prompt-pack.astro:11-29`, and `src/pages/prompt-pack.astro:84-90` sum to 50, while `src/content/blog/claude-prompt-pack-network-admins.md:8`, `src/content/blog/claude-prompt-pack-network-admins.md:44`, `src/pages/prompt-pack.astro:41`, `src/pages/prompt-pack.astro:61`, and `products/claude-prompt-pack-v1/claude-prompt-pack-network-admins.md:2` state 60 prompts.

The product Markdown file `products/claude-prompt-pack-v1/claude-prompt-pack-network-admins.md` contains prompt headings `PROMPT 01` through `PROMPT 50`, and `products/claude-prompt-pack-v1/claude-prompt-pack-network-admins.md:1111` contains `## BONUS: 10 Quick-Fire Prompts`.

### List Price

| file | source location | stated price |
|---|---|---:|
| `src/content/blog/claude-prompt-pack-network-admins.md` | `:18`, `:95`, `:97` | `$29` |
| `src/pages/prompt-pack.astro` | `:32`, `:41`, `:61`, `:164` | `$29` |
| `src/pages/index.astro` | `:203`, `:219`, `:234` | `$29` |

### Vendors Covered

| file | source location | vendor/platform text |
|---|---|---|
| `src/content/blog/claude-prompt-pack-network-admins.md` | `:22` | `Cisco IOS, pfSense, and Linux infrastructure work` |
| `src/content/blog/claude-prompt-pack-network-admins.md` | `:72` | `Cisco, pfSense, Linux-based infrastructure` |
| `src/content/blog/claude-prompt-pack-network-admins.md` | `:113` | `Cisco IOS and IOS-XE are the primary platforms, with coverage for pfSense, Juniper JunOS, and Linux-based infrastructure.` |
| `src/pages/prompt-pack.astro` | `:141` | `Cisco IOS, pfSense, Linux (Debian/RHEL), Junos, and MikroTik.` |
| `src/pages/index.astro` | `:229` | `Cisco IOS, pfSense, Linux, Junos` |

### Buy Links

| file | source location | exact link | UTM params in source |
|---|---|---|---|
| `src/content/blog/claude-prompt-pack-network-admins.md` | `:97` | `https://packetpilotai.gumroad.com/l/vepip?utm_source=packetpilotai&utm_medium=blog&utm_campaign=claude-prompt-pack-network-admins` | `utm_source=packetpilotai`, `utm_medium=blog`, `utm_campaign=claude-prompt-pack-network-admins` |
| `src/pages/prompt-pack.astro` | `:163` | `https://packetpilotai.gumroad.com/l/vepip` | none in `href` |
| `src/pages/index.astro` | `:101` | `https://packetpilotai.gumroad.com/l/vepip` | none in `href` |
| `src/pages/index.astro` | `:233` | `https://packetpilotai.gumroad.com/l/vepip` | none in `href` |

`src/pages/prompt-pack.astro:174-188` contains UTM pass-through JavaScript. It reads inbound `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, and `utm_term`, then appends them to every `a[href*="gumroad.com/l/vepip"]` on that page.

```astro
var keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
```

```astro
document.querySelectorAll('a[href*="gumroad.com/l/vepip"]').forEach(function (a) {
  a.href += (a.href.indexOf('?') === -1 ? '?' : '&') + qs;
});
```

## 4. Internal Linking Map

`src/pages/blog/[...slug].astro:1-18` renders every blog post through `src/layouts/BlogPost.astro`.

`src/layouts/BlogPost.astro:14-20` fetches related slugs from `POSTS_META[id].related`, and `src/layouts/BlogPost.astro:153-170` renders them as links to `/blog/${post.slug}`.

Counts from Markdown content only:

| item | count |
|---|---:|
| Blog Markdown files with a Gumroad or `/prompt-pack` product link | 19 of 26 |
| Blog Markdown files without a Gumroad or `/prompt-pack` product link | 7 of 26 |
| Blog Markdown files with newsletter/subscribe CTA text | 15 of 26 |
| Blog Markdown files without newsletter/subscribe CTA text | 11 of 26 |
| Blog Markdown files containing Beehiiv script or URL | 0 of 26 |
| Blog Markdown files with direct links to other `/blog/` posts | 4 of 26 |
| Blog Markdown files without direct links to other `/blog/` posts | 22 of 26 |

Counts from rendered blog template:

| item | count |
|---|---:|
| Rendered blog posts with Beehiiv form from `src/layouts/BlogPost.astro` | 26 of 26 |
| Blog posts with a `POSTS_META.related` array | 26 of 26 |

Per-post map:

| blog file | product link in Markdown | newsletter | other-post links |
|---|---|---|---|
| `src/content/blog/5-free-network-troubleshooting-tools-2026.md` | no | content CTA text: no; rendered Beehiiv form: yes via `src/layouts/BlogPost.astro` | none in Markdown; related metadata: `diagnose-packet-loss`, `diagnose-dns-failures-fast`, `find-what-saturates-your-wan` |
| `src/content/blog/acr-01-reddit-bgp-configs.md` | yes: `/prompt-pack?utm_source=packetpilotai&utm_medium=blog&utm_campaign=acr-01-reddit-bgp-configs` | content CTA text: yes; rendered Beehiiv form: yes via `src/layouts/BlogPost.astro` | `/blog/showdown-01-claude-vs-chatgpt-vs-gemini-bgp`; related metadata: `showdown-01-claude-vs-chatgpt-vs-gemini-bgp`, `ai-generate-network-configs`, `using-claude-to-audit-firewall-rules` |
| `src/content/blog/acr-02-pfsense-nat-from-the-wild.md` | yes: `/prompt-pack?utm_source=packetpilotai&utm_medium=blog&utm_campaign=acr-02-pfsense-nat-from-the-wild` | content CTA text: yes; rendered Beehiiv form: yes via `src/layouts/BlogPost.astro` | `/blog/migration-cisco-asa-to-pfsense`, `/blog/failure-02-forgotten-hosts-file`; related metadata: `acr-01-reddit-bgp-configs`, `using-claude-to-audit-firewall-rules`, `migration-cisco-asa-to-pfsense` |
| `src/content/blog/ai-generate-network-configs.md` | no | content CTA text: no; rendered Beehiiv form: yes via `src/layouts/BlogPost.astro` | none in Markdown; related metadata: `using-claude-to-audit-firewall-rules`, `claude-prompt-pack-network-admins`, `troubleshoot-slow-network-performance` |
| `src/content/blog/claude-prompt-pack-network-admins.md` | yes: `https://packetpilotai.gumroad.com/l/vepip?utm_source=packetpilotai&utm_medium=blog&utm_campaign=claude-prompt-pack-network-admins` | content CTA text: no; rendered Beehiiv form: yes via `src/layouts/BlogPost.astro` | none in Markdown; related metadata: `ai-generate-network-configs`, `using-claude-to-audit-firewall-rules`, `troubleshoot-slow-network-performance` |
| `src/content/blog/diagnose-dns-failures-fast.md` | no | content CTA text: no; rendered Beehiiv form: yes via `src/layouts/BlogPost.astro` | none in Markdown; related metadata: `troubleshoot-slow-network-performance`, `diagnose-packet-loss`, `5-free-network-troubleshooting-tools-2026` |
| `src/content/blog/diagnose-packet-loss.md` | no | content CTA text: no; rendered Beehiiv form: yes via `src/layouts/BlogPost.astro` | none in Markdown; related metadata: `troubleshoot-slow-network-performance`, `5-free-network-troubleshooting-tools-2026`, `find-what-saturates-your-wan` |
| `src/content/blog/failure-01-spanning-tree-loop-at-3am.md` | yes: `/prompt-pack?utm_source=packetpilotai&utm_medium=blog&utm_campaign=failure-01-spanning-tree-loop-at-3am` | content CTA text: yes; rendered Beehiiv form: yes via `src/layouts/BlogPost.astro` | none in Markdown; related metadata: `troubleshoot-slow-network-performance`, `diagnose-packet-loss`, `find-what-saturates-your-wan` |
| `src/content/blog/failure-02-forgotten-hosts-file.md` | yes: `/prompt-pack?utm_source=packetpilotai&utm_medium=blog&utm_campaign=failure-02-forgotten-hosts-file` | content CTA text: yes; rendered Beehiiv form: yes via `src/layouts/BlogPost.astro` | none in Markdown; related metadata: `diagnose-dns-failures-fast`, `potw-01-truncated-dns-query`, `failure-01-spanning-tree-loop-at-3am` |
| `src/content/blog/failure-03-the-outage-that-was-a-clock.md` | yes: `/prompt-pack?utm_source=packetpilotai&utm_medium=blog&utm_campaign=failure-03-the-outage-that-was-a-clock` | content CTA text: yes; rendered Beehiiv form: yes via `src/layouts/BlogPost.astro` | none in Markdown; related metadata: `failure-02-forgotten-hosts-file`, `failure-01-spanning-tree-loop-at-3am`, `diagnose-dns-failures-fast` |
| `src/content/blog/find-what-saturates-your-wan.md` | no | content CTA text: no; rendered Beehiiv form: yes via `src/layouts/BlogPost.astro` | none in Markdown; related metadata: `diagnose-packet-loss`, `troubleshoot-slow-network-performance`, `5-free-network-troubleshooting-tools-2026` |
| `src/content/blog/migration-cisco-asa-to-pfsense.md` | yes: `/prompt-pack?utm_source=packetpilotai&utm_medium=blog&utm_campaign=migration-cisco-asa-to-pfsense` | content CTA text: yes; rendered Beehiiv form: yes via `src/layouts/BlogPost.astro` | `/blog/using-claude-to-audit-firewall-rules`; related metadata: `using-claude-to-audit-firewall-rules`, `ai-generate-network-configs`, `claude-prompt-pack-network-admins` |
| `src/content/blog/migration-fortigate-to-opnsense.md` | yes: `/prompt-pack?utm_source=packetpilotai&utm_medium=blog&utm_campaign=migration-fortigate-to-opnsense` | content CTA text: yes; rendered Beehiiv form: yes via `src/layouts/BlogPost.astro` | `/blog/migration-cisco-asa-to-pfsense`, `/blog/using-claude-to-audit-firewall-rules`; related metadata: `migration-cisco-asa-to-pfsense`, `using-claude-to-audit-firewall-rules`, `ai-generate-network-configs` |
| `src/content/blog/network-incident-checklist.md` | yes: `/prompt-pack` | content CTA text: no; rendered Beehiiv form: yes via `src/layouts/BlogPost.astro` | none in Markdown; related metadata: `diagnose-packet-loss`, `diagnose-dns-failures-fast`, `troubleshoot-slow-network-performance` |
| `src/content/blog/potw-01-truncated-dns-query.md` | yes: `/prompt-pack?utm_source=packetpilotai&utm_medium=blog&utm_campaign=potw-01-truncated-dns-query` | content CTA text: yes; rendered Beehiiv form: yes via `src/layouts/BlogPost.astro` | none in Markdown; related metadata: `diagnose-dns-failures-fast`, `troubleshoot-slow-network-performance`, `5-free-network-troubleshooting-tools-2026` |
| `src/content/blog/potw-02-one-byte-then-silence.md` | yes: `/prompt-pack?utm_source=packetpilotai&utm_medium=blog&utm_campaign=potw-02-one-byte-then-silence` | content CTA text: yes; rendered Beehiiv form: yes via `src/layouts/BlogPost.astro` | none in Markdown; related metadata: `potw-01-truncated-dns-query`, `troubleshoot-slow-network-performance`, `diagnose-packet-loss` |
| `src/content/blog/potw-03-duplicate-ip-arp-war.md` | yes: `/prompt-pack?utm_source=packetpilotai&utm_medium=blog&utm_campaign=potw-03-duplicate-ip-arp-war` | content CTA text: yes; rendered Beehiiv form: yes via `src/layouts/BlogPost.astro` | none in Markdown; related metadata: `potw-02-one-byte-then-silence`, `diagnose-packet-loss`, `find-what-saturates-your-wan` |
| `src/content/blog/potw-04-asymmetric-routing-stateful-drop.md` | yes: `/prompt-pack?utm_source=packetpilotai&utm_medium=blog&utm_campaign=potw-04-asymmetric-routing-stateful-drop` | content CTA text: yes; rendered Beehiiv form: yes via `src/layouts/BlogPost.astro` | none in Markdown; related metadata: `potw-03-duplicate-ip-arp-war`, `troubleshoot-slow-network-performance`, `find-what-saturates-your-wan` |
| `src/content/blog/potw-05-dhcp-snooping-blackhole.md` | yes: `/prompt-pack?utm_source=packetpilotai&utm_medium=blog&utm_campaign=potw-05-dhcp-snooping-blackhole` | content CTA text: yes; rendered Beehiiv form: yes via `src/layouts/BlogPost.astro` | none in Markdown; related metadata: `potw-04-asymmetric-routing-stateful-drop`, `diagnose-dns-failures-fast`, `find-what-saturates-your-wan` |
| `src/content/blog/potw-06-duplex-mismatch.md` | yes: `/prompt-pack?utm_source=packetpilotai&utm_medium=blog&utm_campaign=potw-06-duplex-mismatch` | content CTA text: yes; rendered Beehiiv form: yes via `src/layouts/BlogPost.astro` | none in Markdown; related metadata: `potw-05-dhcp-snooping-blackhole`, `troubleshoot-slow-network-performance`, `diagnose-packet-loss` |
| `src/content/blog/setting-up-claude-for-real-work.md` | yes: `https://packetpilotai.gumroad.com/l/vepip` | content CTA text: no; rendered Beehiiv form: yes via `src/layouts/BlogPost.astro` | none in Markdown; related metadata: `claude-prompt-pack-network-admins`, `ai-generate-network-configs`, `using-claude-to-audit-firewall-rules` |
| `src/content/blog/showdown-01-claude-vs-chatgpt-vs-gemini-bgp.md` | yes: `/prompt-pack?utm_source=packetpilotai&utm_medium=blog&utm_campaign=showdown-01-claude-vs-chatgpt-vs-gemini-bgp` | content CTA text: yes; rendered Beehiiv form: yes via `src/layouts/BlogPost.astro` | none in Markdown; related metadata: `acr-01-reddit-bgp-configs`, `ai-generate-network-configs`, `using-claude-to-audit-firewall-rules` |
| `src/content/blog/showdown-02-claude-vs-chatgpt-vs-gemini-netmiko.md` | yes: `/prompt-pack?utm_source=packetpilotai&utm_medium=blog&utm_campaign=showdown-02-claude-vs-chatgpt-vs-gemini-netmiko` | content CTA text: yes; rendered Beehiiv form: yes via `src/layouts/BlogPost.astro` | none in Markdown; related metadata: `showdown-01-claude-vs-chatgpt-vs-gemini-bgp`, `ai-generate-network-configs`, `using-claude-to-audit-firewall-rules` |
| `src/content/blog/troubleshoot-slow-network-performance.md` | no | content CTA text: no; rendered Beehiiv form: yes via `src/layouts/BlogPost.astro` | none in Markdown; related metadata: `diagnose-packet-loss`, `diagnose-dns-failures-fast`, `5-free-network-troubleshooting-tools-2026` |
| `src/content/blog/using-claude-to-audit-firewall-rules.md` | no | content CTA text: no; rendered Beehiiv form: yes via `src/layouts/BlogPost.astro` | none in Markdown; related metadata: `ai-generate-network-configs`, `claude-prompt-pack-network-admins`, `5-free-network-troubleshooting-tools-2026` |
| `src/content/blog/why-claude-gives-wrong-network-configs.md` | yes: `/prompt-pack` | content CTA text: no; rendered Beehiiv form: yes via `src/layouts/BlogPost.astro` | none in Markdown; related metadata: `ai-generate-network-configs`, `setting-up-claude-for-real-work`, `claude-prompt-pack-network-admins` |

## 5. Newsletter Wiring

Beehiiv form ID in all observed render sites: `29f9e65f-4f54-4279-84c7-13b055c79420`.

Blog posts:

- `src/pages/blog/[...slug].astro:1-18` renders each post with `<BlogPost {...post.data} id={post.id}>`.
- `src/layouts/BlogPost.astro:131-142` renders an inline subscribe CTA and Beehiiv loader script at the end of every blog post:

```astro
<aside class="ppc-subscribe-cta">
  <div class="ppc-subscribe-inner">
    <div class="ppc-subscribe-label">
      <span class="ppc-section-bracket">[</span>
      free · cli cheatsheet pdf
      <span class="ppc-section-bracket">]</span>
    </div>
    <p class="ppc-subscribe-text">
      60+ essential commands for triage, capture, and DNS debugging. No spam — unsubscribe anytime.
    </p>
    <script is:inline async src="https://subscribe-forms.beehiiv.com/v3/loader.js" data-beehiiv-form="29f9e65f-4f54-4279-84c7-13b055c79420"></script>
  </div>
</aside>
```

Reusable newsletter component:

- `src/components/NewsletterBar.astro:7-19` renders a section with `aria-label="Newsletter signup"` and the Beehiiv loader script.
- `src/pages/index.astro:13` imports `NewsletterBar`; `src/pages/index.astro:243` renders `<NewsletterBar />`.
- `src/pages/blog/index.astro:12` imports `NewsletterBar`; `src/pages/blog/index.astro:58` renders `<NewsletterBar />`.
- `src/pages/about.astro:8` imports `NewsletterBar`; `src/pages/about.astro:90` renders `<NewsletterBar />`.
- `src/pages/roadmap.astro:8` imports `NewsletterBar`; `src/pages/roadmap.astro:108` renders `<NewsletterBar />`.
- `src/pages/series/[stream]/index.astro:11` imports `NewsletterBar`; `src/pages/series/[stream]/index.astro:154` renders `<NewsletterBar />`.

Exact `NewsletterBar` script markup:

```astro
<script is:inline async src="https://subscribe-forms.beehiiv.com/v3/loader.js" data-beehiiv-form="29f9e65f-4f54-4279-84c7-13b055c79420"></script>
```

Inline page-level Beehiiv forms outside `NewsletterBar`:

- `src/pages/starter-kit.astro:86` renders the Beehiiv loader script.
- `src/pages/tools/index.astro:178` renders the Beehiiv loader script.

Pages checked with no Beehiiv or `NewsletterBar` match:

- `src/pages/prompt-pack.astro`

Answer to "On blog posts, home, both?": both. Blog posts render Beehiiv through `src/layouts/BlogPost.astro`; home renders Beehiiv through `src/components/NewsletterBar.astro`.
