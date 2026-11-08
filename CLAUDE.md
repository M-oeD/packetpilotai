# packetpilotai — CLAUDE.md

Astro 6 site selling the PacketPilot AI prompt pack (60 prompts) at packetpilotai.com. SSR on Cloudflare
Workers. Repo: M-oed/packetpilotai. Full service/tool inventory: `STACK.md` (update it when
anything is added or swapped).

## Commands (Node ≥ 22.12)
```powershell
npm run dev        # Astro dev server, localhost:4321, HMR
npm run build      # astro build → dist/  (LOCAL artifacts only — not live)
npm run preview    # build + wrangler dev (local, real Workers adapter)
npm run deploy     # build + wrangler deploy → LIVE in production
npm run generate-types   # wrangler types
```

## Architecture
- Astro 6 + `@astrojs/cloudflare` adapter — SSR on a Cloudflare Worker per request; Cloudflare DNS/Pages host the domain.
- React 19 islands (`@astrojs/react`) for interactive components (StatusBar, Topology, CopilotDock, …), hydrated client-side.
- Blog: markdown in `src/content/blog/`; content-layer `loader: glob` in `content.config.ts` (glob excludes placeholder posts). MDX, RSS, sitemap integrations.
- Newsletter: first-party intake since 2026-07-28. `SubscribeForm.astro` (in `NewsletterBar.astro`, post CTAs, starter-kit, tools)
  → `POST /api/subscribe` (`src/pages/api/subscribe.ts`) writes D1 `packetpilot-subs` (binding `DB`) first, then tries Beehiiv,
  which fails `missing_beehiiv_config` until the Beehiiv secrets exist. Read signups with SELECTs only, authenticated by
  `CF_D1_READ_TOKEN` in `.dev.vars` (D1 Read user token, no expiry, added 2026-11-07; the `wrangler login` OAuth lapses and
  can't renew non-interactively). Despite its name it accepts write SQL through `/query` (a `DELETE … WHERE 1=0` was
  accepted 2026-11-07), so SELECT-only is our discipline, not Cloudflare's enforcement. Either `POST https://api.cloudflare.com/client/v4/accounts/<account id>/d1/database/<db id>/query`
  with `Authorization: Bearer`, or `wrangler d1 execute packetpilot-subs --remote --json --command "SELECT …"` with the token set
  as `CLOUDFLARE_API_TOKEN` plus `CLOUDFLARE_ACCOUNT_ID` for that one process (`wrangler.jsonc` has no `account_id`; it resolves
  from the zone via `GET /zones/<CF_ZONE_TAG>` with the analytics token). Never print the token. Never save it as
  `CLOUDFLARE_API_TOKEN` in `.env`: wrangler auto-loads `.env`, so it would take over `npm run deploy`. Never use
  `npm run subs` as a read: it retries `pending_sync` rows and sends welcome mail.
- Analytics — two trustworthy sources (RUM beacon removed 2026-06-25):
  - **`npm run traffic`** (`scripts/traffic.mjs`, edge HTTP analytics) — the real traffic source. Needs a token with **Zone Analytics:Read** + `CF_ZONE_TAG` in `.dev.vars`. 3 layers: raw edge (≈72% is 404/403 vuln-scanner noise — not human) → **Layer 3 = GET+200+eyeball, assets stripped = real-ish human pageviews** (free-plan adaptive retains ~1wk, no content-type filter). Also reads the distribution test (a posted URL spikes in Layer 3, distinct from scanner 404s).
  - Conversions: Gumroad (sales, exact) + D1 `subscribers` (signups, exact) — the numbers to actually trust. Beehiiv holds only the pre-July list.
  - Crawl the live site with HEAD, not GET: Layer 3 counts GETs, so a GET crawl inflates it.
  - **Removed 2026-06-25:** the Cloudflare Web Analytics RUM beacon — `scripts/web-stats.mjs`, the `BaseHead.astro` beacon `<script>`, and `CF_ANALYTICS_TOKEN` in `consts.ts`. It rounded to 10 and had recorded zero since 06-10 (deployed token ≠ data-bearing tag). Edge analytics supersedes it. (`.dev.vars` `CF_ANALYTICS_TOKEN` is now the *API* token for `npm run traffic`, unrelated to the old public beacon token.)
- Pack price and count: `PACK_PRICE` / `PACK_PROMPTS` in `src/consts.ts` are the only place the site states them;
  keep `PACK_PRICE` equal to the Gumroad listing. Blog markdown can't import them, so posts never state the price.
  The real count comes from the PDF (`products/claude-prompt-pack-v1/`, gitignored): 50 numbered + 10 quick-fire = 60.
- Fonts: Google Fonts CDN (Orbitron, Share Tech Mono, Rajdhani).
- Sister repo: M-oed/claude-token-counter (plain HTML/CSS/JS, GitHub Pages, auto-deploys from main).

## Deploy notes — read before saying "shipped"
- **No CI auto-deploy exists.** Build ≠ live. Only `npm run deploy` publishes; say "shipped"/"live"
  only after `wrangler deploy` exits 0. Anything less is "build passes." (`/ship` encodes this gate.)
- **DEPLOY ≠ GIT.** Prod ships from the local working tree (historically branch
  `overhaul/noc-console-redesign`), so git state does not reflect what's live — `origin/main` can be
  stale and live pages may be untracked. To know what's live, check packetpilotai.com, not git.
  Commit after deploying anyway — it's the only backup of the live source.

## Known traps (graduated from tasks/lessons.md)
- **Astro 6 dev-SSR React flood** (`Invalid hook call` / `useState` null on every island, dev only):
  upstream withastro/astro#16529. The fix is in `astro.config.mjs` — `optimizeDeps.include` listing
  all React entrypoints in BOTH `vite` and `vite.ssr`. Don't remove until an Astro/@astrojs/react
  bump fixes upstream; always `npm run build` after touching `astro.config.mjs`.
- **`preview_screenshot` hangs (30s timeout) on this site's infinite animations** (scanline CSS +
  canvas rAF loops): freeze first via `preview_eval` — stub `requestAnimationFrame`, clear all
  timers, inject `*{animation:none!important;transition:none!important}`, hide `.ppc-scanline` —
  or verify with `preview_inspect`, which never hangs. Never retry a hanging screenshot as-is.
- **Spawned shells can lose PATH mid-session** ("npm is not recognized", even `where.exe` gone):
  rebuild PATH from registry (Machine + User) and call `C:\Program Files\nodejs\npm.cmd` by full
  path. Details in `tasks/lessons.md` 2026-05-29 and the `/ship` skill.

## Session start
Read `tasks/lessons.md` + `tasks/ideas.md` before substantive work; `STACK.md` when touching services.
