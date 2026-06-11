# packetpilotai — CLAUDE.md

Astro 6 site selling the $29 PacketPilot AI prompt pack at packetpilotai.com. SSR on Cloudflare
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
- Newsletter: Beehiiv via `NewsletterBar.astro` (home/blog/about/series) + inline post CTAs.
- Analytics: Cloudflare Web Analytics beacon — token `CF_ANALYTICS_TOKEN` in `src/consts.ts`. Traffic only; conversions live in Gumroad (UTM) and Beehiiv.
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
