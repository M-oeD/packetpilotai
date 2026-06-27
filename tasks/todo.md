# packetpilotai — TODO

Active plan-of-record. Check items off as they ship. Review section at the bottom captures what happened.

---

## Audit + UX/hygiene ship — 2026-06-04 ✅ LIVE

Full site audit (UI / UX / direction / "stay blog or change"). **Verdict:** keep the on-site blog — it's a high-quality, high-sunk asset; the problems are the funnel and distribution, not the format. Fixed the actionable defects and shipped.

**DEPLOYED LIVE 2026-06-04** — Cloudflare version `7603ddbe-f364-4523-88c1-49916ceba703`; verified on packetpilotai.com (200, new nav serving). Branch `overhaul/noc-console-redesign` pushed to origin. Commits `62bbd49`, `7a2e226`, `26835f7`.

- [x] **Mobile nav** — was `display:none` with no hamburger <640px; now a swipeable terminal command-row (`global.css`)
- [x] **Contrast** — `--ppc-muted-2` 2.8→4.85:1 (was failing WCAG AA), `--ppc-muted`→6.1:1
- [x] **Dead ⌘K** — "press ⌘K" hint (wired to nothing) removed site-wide
- [x] **Dev-SSR fix** — `astro.config.mjs` `optimizeDeps.include` kills the Astro 6 + Cloudflare "Invalid hook call" dev storm (withastro/astro#16529); prod build unaffected (see lessons.md)
- [x] **Shared `<Nav>`** — nav was hand-duplicated across 8 files; extracted to `src/components/Nav.astro` (path-aware active). Added `/roadmap` + `/tools` to global nav (closes the old "wire /roadmap into nav" follow-up)
- [x] **FAQ dedupe** — removed in-body FAQ from `failure-01` + `potw-01` (canonical lives in `POSTS_META.faq`)
- [x] **Hygiene** — deleted orphaned `Header.astro`/`HeaderLink.astro` + dead `public/console/`; removed ~10 stray root dumps; corrected stale `STACK.md`

**Audit findings NOT yet actioned (need decisions / bigger build):**
- [ ] Tag sprawl (~45 tags, mostly count-1) → collapse to ~10-tag keep-list (needs user nod)
- [ ] Funnel leak — broad post `setting-up-claude-for-real-work` CTAs to the $29 niche pack; broad lead-magnet email capture still not wired
- [ ] Strategic: niche-vs-audience-engine direction call (gated on traffic/signup numbers) + pick a distribution channel

---

## Funnel easy-wins batch — 2026-06-25 ✅ DEPLOYED LIVE 2026-06-26

Acting on `tasks/funnel-audit-2026-06-25.md`. Closed the mechanical attribution + trust defects. **DEPLOYED** — Cloudflare version `96c208ba-7c34-40fc-a38c-bf714f3a3067`; verified live on packetpilotai.com (prompt-pack renders 10 categories summing to 60; homepage hero + pack Gumroad buttons carry `utm_medium=home`).

**Attribution holes closed (so Gumroad analytics can see what converts):**
- [x] Homepage hero + pack-section Gumroad buttons UTM-tagged (`utm_medium=home`, campaigns `homepage-hero` / `homepage-pack`) — `index.astro`. Verified live in built HTML.
- [x] 4 bare blog CTAs UTM-tagged (`utm_medium=blog`, `utm_campaign=<slug>`) — `why-claude-gives-wrong-network-configs` ×2, `network-incident-checklist` ×2.
- [x] `setting-up-claude-for-real-work` + `starter-kit.astro` Gumroad CTAs UTM-tagged.
- [x] `/prompt-pack` pass-through script now applies a **default** attribution (`utm_medium=product-page`) on direct visits instead of returning early — direct-to-pack conversions are no longer invisible. Inbound UTMs still override (no dup params).

**"60 prompts" trust defect fixed (breakdown showed 7 rows summing to 50 under a 60 headline):**
- [x] Verified ground truth: pack = 50 numbered (9 categories) + 10 Quick-Fire = **60**. Headline was right; breakdown was wrong.
- [x] Corrected the category breakdown to the real **10-row, sums-to-60** set (Config 7 · Troubleshoot 7 · Python 6 · Docs 5 · Security 5 · Claude Projects 5 · Wireless 3 · AI Workflows 7 · Bonus 5 · Quick-Fire 10) in all surfaces: `index.astro` ASCII box, `prompt-pack.astro` ASCII box + section grid, `claude-prompt-pack-network-admins.md` heroAscii + FAQ, `posts-meta.ts` FAQ (JSON-LD).
- [x] Normalized stale counts: "50+ prompts" / "60+ prompts" pack refs → exact "60" (`setting-up...`, `starter-kit`, `cheatsheet`, `roadmap.astro`, `Roadmap.tsx`). (Left `BlogPost.astro` "60+ commands" — that's the CLI cheatsheet lead-magnet, not the pack.)
- ASCII boxes aligned by exact column math (verified all rows length-match siblings); screenshots skipped — they hang on this site (lessons.md).

**Needle-mover batch — 2026-06-26 ✅ DEPLOYED LIVE (version `39c0414f-bdaf-41fa-8aac-c211510e2756`):**
- [x] **Closed the 7-evergreen-post CTA leak** — added a contextual pack CTA before the FAQ in each of `diagnose-packet-loss`, `diagnose-dns-failures-fast`, `find-what-saturates-your-wan`, `troubleshoot-slow-network-performance`, `using-claude-to-audit-firewall-rules`, `5-free-network-troubleshooting-tools-2026`, `ai-generate-network-configs`. Each = topic-tailored H2 + relevance bridge + bold buy link with `utm_medium=blog&utm_campaign=<slug>` (so every one is attributed). House-style match (content → CTA → FAQ). Build-verified all 7 in `dist/`, live-verified on packetpilotai.com.

**Internal-linking batch — 2026-06-26 ✅ DEPLOYED LIVE (version `94703137-48f3-4794-9940-687c59ac9f51`):**
- [x] **Wove 12 contextual in-body cross-links** through the 7 evergreen troubleshooting how-tos (packet-loss ↔ slow-perf ↔ WAN-saturation ↔ DNS ↔ free-tools ↔ firewall-audit ↔ config-gen). All anchored on existing prose, no keyword stuffing. `troubleshoot-slow` is the hub (3 outbound). Live-verified 200 + present.
- [x] **Fixed a sitewide broken-link bug** found during verification: every post's "related posts" cards rendered `href="/blog/undefined"` (~78 dead links across 26 posts). Root cause: Astro 6 content-layer dropped `CollectionEntry.slug`; `BlogPost.astro` still used `post.slug`. Switched to `post.id` (matches `[...slug].astro` `params: { slug: post.id }`). Built HTML: **0** `/blog/undefined` across all 27 pages (was ~78). Lesson logged.

**Still open (future batches):**
- [ ] Lead-magnet email capture on broad evergreen posts (Beehiiv form renders site-wide via layout, but no targeted lead-magnet offer on the high-traffic how-tos).

---

## Phase 0 — Foundation ✅ (live in production 2026-05-20)

**Deploy:** `wrangler deploy` succeeded — version `a2b4971f-2fe2-4533-9dcc-11e096dbf181`. 25 assets uploaded. Live on `packetpilotai.com` and `packetpilotai.mc69080vill.workers.dev`.


**Goal:** lay the editorial backbone for 5 content streams without redesigning the homepage. Get to a state where new pillar posts in Phase 1 just need their content written.

### Schema & data

- [x] Extend `src/content.config.ts` blog schema with optional `stream` and `streamNum` fields
- [x] Create `src/data/streams.ts` — single source of truth for stream metadata (name, accent, glyph, description, cadence)
- [x] Add `.ppc-pill.info` variant to `src/styles/global.css` (uses existing `--ppc-info` token; needed for ACR stream)

### Series landing pages

- [x] Create `src/pages/series/[stream]/index.astro` — dynamic route, one landing page per stream, auto-collects posts via `getCollection('blog')`, sorts by `streamNum` then `pubDate`

### Blog index

- [x] Extend `PostData` type in `src/components/react/BlogIndex.tsx` to include `stream?: string` and `streamNum?: number`
- [x] Add stream filter row above existing tag filter (filter chips with stream short names, counts)
- [x] Update `src/pages/blog/index.astro` to pass `stream` and `streamNum` into PostData

### Back-tag existing posts (frontmatter edits)

- [x] `diagnose-packet-loss.md` → `stream: failure-library`
- [x] `diagnose-dns-failures-fast.md` → `stream: failure-library`
- [x] `find-what-saturates-your-wan.md` → `stream: failure-library`
- [x] `troubleshoot-slow-network-performance.md` → `stream: failure-library`
- [x] `ai-generate-network-configs.md` → `stream: showdown`
- [x] Other 4 posts stay untagged (listicle, product, evergreen how-to, 3D-printer anomaly)

### Newsletter capture

- [x] Create `src/components/NewsletterBar.astro` — wraps existing Beehiiv form (ID `29f9e65f-4f54-4279-84c7-13b055c79420`), terminal-styled
- [x] Include `NewsletterBar` in `src/pages/index.astro`
- [x] Include `NewsletterBar` in `src/pages/blog/index.astro`
- [x] Include `NewsletterBar` in `src/pages/about.astro`
- [x] Skip `prompt-pack.astro` (own CTA) and `BlogPost.astro` layout (already has inline subscribe CTA)

### Verification

- [x] Run `npm run build` from `C:\Projects\packetpilotai` — passed clean in 14.25s
- [x] Spot-check the build output: all 22 routes prerender, all 5 `/series/{stream}/` pages emit, all 10 existing blog posts still render

### Review — Phase 0

**What shipped:**
- 22 routes prerendered cleanly. Five new ones: `/series/potw/`, `/series/failure-library/`, `/series/showdown/`, `/series/migration/`, `/series/acr/`.
- Schema is back-compat — all 10 existing posts (md + mdx) still validate and render.
- Five posts back-tagged: 4 → `failure-library`, 1 → `showdown`. The series filter on `/blog` now shows real counts; `failure-library` lands with 4 posts on day one.
- `/series/showdown/` shows 1 post (`ai-generate-network-configs`); `/series/migration/`, `/series/potw/`, `/series/acr/` show the empty-state card with a "pillar in flight" message and link back to `/blog`.
- Beehiiv signup now appears on home, blog index, about, and all series landings (in addition to the existing in-article CTA inside `BlogPost.astro`).

**What I learned worth keeping:**
- Beehiiv form ID was already wired up in `BlogPost.astro` — no new account/credentials needed. Lifted the same form ID into the reusable component.
- The amber theme overrides `--ppc-accent` to bright red `#ff0000`. The newsletter bar inherits this — visually striking on amber, and matches the brand's "operator under alert" vibe rather than fighting it.
- Cloudflare adapter prints `Default inspector port 9229 not available, using 9230 instead` on build — harmless, debug-port collision with another dev process. Ignore on future builds.
- The blog collection has an unnoticed `using-mdx.mdx` example from the Astro starter template. Not removed (out of scope), but worth a follow-up cleanup.

**What I'd do differently:**
- Nothing material. The two-batch design (additive Batch 1, interconnected Batch 2) avoided any broken intermediate state.

**What this unblocks:**
- Phase 1 pillar posts can be written immediately. The infrastructure no longer needs to change for any of the five pillars.
- `/series/{stream}/` URLs are stable — safe to link to from external sources (newsletter, Reddit, etc.) starting now.

---

## Phase 1 — Pillar posts (week 1-2, 5 posts)

One anchor per stream. Sets format and SEO target. **POTW is the canary** — voice, structure, length get proven here, then the other four lean on the same template.

- [x] `failure-01-spanning-tree-loop-at-3am.md` — Failure Library pillar ✅ live 2026-05-20 (version `5f456eec`)
- [x] `showdown-01-claude-vs-chatgpt-vs-gemini-bgp.md` — Showdown pillar ✅ written + build-verified 2026-05-31 (rig format B; not yet deployed)
- [x] `migration-cisco-asa-to-pfsense.md` — Migration Playbook pillar ✅ written + build-verified 2026-05-31 (not yet deployed)
- [x] `potw-01-truncated-dns-query.md` — POTW pillar ✅ shipped 2026-05-20
- [x] `acr-01-reddit-bgp-configs.md` — ACR pillar ✅ written + build-verified 2026-05-31 (not yet deployed)

Each pillar closes with: pack CTA + newsletter signup + "next in this series" placeholder.

### Notes from POTW pillar

- Filename diverged from plan: `potw-01-truncated-dns-query.md` (more descriptive than `dns-timeout-puzzle`)
- Skipped the planned downloadable `.pcap` binary asset — used an inline ASCII-formatted capture excerpt instead. Lower production cost; matches the existing blog voice; sidesteps hosting a binary on Cloudflare Workers. Reconsider if a real `.pcap` becomes a differentiator.
- Length: ~830 words. Within the 600-1000w POTW target.
- Format proven: setup → hypothesis table → reveal → prompt → one-line takeaway → FAQ → next-week tease. **Reusable as the POTW template.**

---

## Phase 2 — Cadence proof (week 3-6, ~9 posts)

- [x] POTW × 4 — potw-02 one-byte-then-silence (PMTU), potw-03 duplicate-ip-arp-war, potw-04 asymmetric-routing-stateful-drop, potw-05 dhcp-snooping-blackhole ✅ written + build-verified 2026-05-31 (not deployed)
- [x] Failure Library × 2 — failure-02-forgotten-hosts-file, failure-03-the-outage-that-was-a-clock ✅ written + build-verified 2026-05-31 (not deployed)
- [x] Showdown × 1 — showdown-02-claude-vs-chatgpt-vs-gemini-netmiko (rig format B) ✅ written + build-verified 2026-05-31 (not deployed)
- [x] Migration × 1 — migration-fortigate-to-opnsense ✅ written + build-verified 2026-05-31 (not deployed)
- [x] ACR × 1 — acr-02-pfsense-nat-from-the-wild ✅ written + build-verified 2026-05-31 (not deployed)

**Cadence canary:** if POTW slips one week, the whole launch is wobbling — fix root cause before continuing.

### Review — Phase 1 + 2 content drop (2026-05-31)

**DEPLOYED LIVE 2026-05-31** — `wrangler deploy` ok, version `9aa7d6fa-ae8e-46d7-b975-a4f17ed40dad`; confirmed serving on packetpilotai.com (HTTP 200 + content on new posts + blog index). (Per-item checkboxes above still read "not deployed" — they were checked before deploy; this line supersedes them.)

**What shipped:** 12 new posts this session — 3 Phase 1 pillars (showdown-01, migration-cisco-asa-to-pfsense, acr-01) + 9 Phase 2 cadence (POTW ×4, Failure ×2, Showdown ×1, Migration ×1, ACR ×1). Phase 1 and Phase 2 content are now complete. Each post = `.md` + a `POSTS_META` entry (tags/ascii/accent/read/faq/related). Blog went 10 → 22 posts.

**Series counts now:** POTW 5 · Failure Library 3 · Showdown 3 (incl. legacy `ai-generate-network-configs`) · Migration 2 · ACR 2.

**Decisions baked in:**
- **Showdown = rig format (Option B):** real Claude run + scoring rubric + competitor failure-mode teardown; no fabricated ChatGPT/Gemini transcripts. Email CTA invites readers to send real outputs to graduate each into a full A-bench.
- **FAQ lives only in `POSTS_META.faq`** (layout renders the visible section + `FAQPage` JSON-LD). Not duplicated in-body. NOTE: the two original pillars (failure-01, potw-01) still duplicate FAQ in-body — optional cleanup.
- **Slug refinement:** planned `potw-05-rogue-dhcp-169-254` shipped as `potw-05-dhcp-snooping-blackhole` (there is no actual rogue — the cause is an untrusted DHCP-snooping uplink; APIPA is the symptom).
- **pubDate = 2026-05-31** on all 12. Stagger forward later only if a cadence-story is wanted before deploy.
- Forward "next in series" teases were written for potw-06, failure-04, showdown-03, migration-03, acr-03 — a ready backlog for the next cadence cycle.

**Verification:** `npm run build` green (registry-PATH workaround, per lessons.md); all 12 new `/blog/` routes prerender; all 5 `/series/` pages list the correct posts; FAQ confirmed rendering as both visible section and `FAQPage` schema in built HTML.

**Remaining (user-owned / out of content scope):** deploy (`npm run deploy`); P0 Cloudflare analytics token; YouTube; Phase 3 homepage redesign + `/roadmap` global-nav wiring.

---

## Phase 3 — Surface lift (week 7+)

- [x] Homepage redesign — "The Five Streams" cards replacing "Latest Posts" ✅ DEPLOYED LIVE 2026-05-31 (Cloudflare version eba04326; confirmed on packetpilotai.com). index.astro + .ppc-stream-* flex layout in global.css; per-stream accent bars; each card shows latest-in-stream + count; hero count fixed 8→22. Visual-checked via preview (3+2 desktop / 1-up mobile; caught + fixed a 4+1 orphan by switching auto-fit grid → flexbox-grow).
- [ ] Newsletter automation — 5-email welcome sequence (one per stream's best post)
- [ ] YouTube channel activates (per 90-day plan in `ideas.md`)
- [ ] `/audit` landing page — Audit-as-a-Service (#10 from brainstorm)
- [ ] First audit case study lands as `failure-NN-anonymized-audit`

---

## Out of scope for this launch (tracked, not blocking)

- Claude Project export of the pack (#23) — separate effort, parallel track
- packetpilotai CLI tool (#9 from ideas.md)
- Job board (#20)
- Hardware bundle (#25)
- 3D-printer post decision — keep or kill (ideas.md #21)
- `using-mdx.mdx` Astro starter example cleanup (out of scope, but worth a follow-up)

---

## Roadmap-Artifact Initiative — 2026-05-29

Rolling roadmap.sh's "interactive structured artifact" format into packetpilotai. Insight: roadmap.sh has *Network Engineer* and *Prompt Engineering* as separate trees — nothing at their intersection. That gap = our thesis. Build the artifact they won't; use their node lists as a pre-validated content backlog.

### P0 — Instrument first (observability before more content)
- [x] Add Cloudflare Web Analytics beacon to `BaseHead.astro`; token via `CF_ANALYTICS_TOKEN` in `consts.ts` (emits only when set) — code done, build verified
- [x] Token set in `consts.ts` (public beacon token) + committed — 2026-05-31 (e051c12)
- [x] Deployed (version `ff8b3c39`) + beacon **confirmed firing live** on `packetpilotai.com` (verified in live HTML, not just build)
- [ ] Confirm Gumroad conversion tracking + Beehiiv signup event are visible — NOTE: CF Web Analytics = traffic/pageviews ONLY, not conversions. Funnel = 3 surfaces: CF traffic ✅ · Gumroad sales — **per-post UTM attribution WIRED + LIVE** 2026-05-31 (version bfe0f747; `utm_campaign=<post-slug>` on every blog CTA, forwarded to Gumroad checkout via pass-through script on `/prompt-pack`) — confirm it surfaces in Gumroad analytics after the next sale · Beehiiv signups still pending. (Homepage Gumroad buttons not yet UTM-tagged — optional.)

### P1 — Kill or commit the 3d-printer anomaly (ideas.md #21)
- [x] Decision: **KILLED** (2026-05-29) — deleted the `.md` + its `POSTS_META` entry; tightens the networking+Claude cluster. (404 acceptable: post was ~9 days live, off-cluster, no inbound links. Add a `/blog` redirect later only if logs show hits.)

### P2 — Centerpiece roadmap artifact ✅ built 2026-05-29 (skill-tree console, at `/roadmap`)
- [x] Node tree designed — `src/data/roadmap.ts` (21 nodes / 7 domains; 9 guides live, 12 prompt-only = the P3 backlog)
- [x] Interactive island — `src/components/react/Roadmap.tsx` (theme-aware `--ppc` tokens so it renders red-on-amber; click→console; localStorage progress; copy-prompt)
- [x] Page — `src/pages/roadmap.astro` (ItemList + FAQ JSON-LD; pack CTA; NewsletterBar); linked from `/tools` (nav + featured card)
- [ ] Open-source the repo for GitHub-driven discovery
- [x] Follow-up: wire `/roadmap` into the global nav on home/blog/about/prompt-pack — **already done by the 2026-06-04 ship** (extracted shared `Nav.astro` carries `/roadmap` + `/tools`; every main page renders `<Nav />`). This note was stale. **2026-06-16: closed the last orphan** — `404.astro` had a hand-rolled nav block (bypassed the shared component, missing roadmap/tools) AND still carried the dead `⌘K` hints the 2026-06-04 ship claimed it removed "site-wide." Swapped to `<Nav />` + killed both ⌘K hints. Build-verified (green, 404.html nav now 6 items incl. roadmap/tools, zero ⌘K). **NOT deployed — build passes, not live.**

### P3 — Walk the tree for content
- [ ] Re-order remaining Phase 1/2 backlog so each post fills a roadmap node
- [ ] Each new post slots into the artifact (artifact + content engine reinforce each other)
