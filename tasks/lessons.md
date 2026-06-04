# packetpilotai — Lessons

Patterns that bit us. Each entry: what happened, the rule, why it matters.

---

## 2026-05-20 — "shipped" ≠ "live": always clarify build vs deploy

**What happened:**
After Phase 0 + the POTW pillar, I reported the work as "shipped" because `npm run build` passed and 22 routes prerendered to `dist/`. User checked `packetpilotai.com` and saw none of it. Build was local-only; deploy is a separate explicit step (`npm run deploy` → `wrangler deploy`).

**Rule:**
On any "shipped" / "done" / "live" claim about a deployed product, be explicit about which surface:
- `npm run build` → artifacts in `dist/` only. Local.
- `npm run dev` → Astro dev server on `localhost:4321`. Local + HMR.
- `npm run preview` → `wrangler dev` serving the build. Local but uses the Workers adapter.
- `npm run deploy` → `wrangler deploy`. **Live in production.**

Default to the most conservative phrasing. "Build passes" is true and small. "Shipped" implies the public can see it — only use that word after `wrangler deploy` returns success.

**Why it matters:**
- The user's mental model of "ship" is "the public can see it now." Telling them work is shipped when it isn't is a trust-eroding miscommunication, even if every word in the report was technically defensible.
- This project (Cloudflare Workers via `@astrojs/cloudflare`) has **no auto-deploy from git**. Other projects on the user's machine might (NetRecon? limpet? check per-project). Never assume the deploy mechanism — look at `package.json` scripts and `wrangler.*` / CI config early in any session that touches a deployable surface.

**Cue to apply:**
At the start of any session that ends in "let's launch" or "let's ship," read `package.json` scripts and grep for `deploy`. If there's a `deploy` script, the work isn't done until that script runs successfully.

---

## 2026-05-29 — spawned shells sometimes start with a stripped PATH (no System32 / nodejs)

**What happened:**
Mid-session a PowerShell call failed with "npm is not recognized" — and even `where.exe` was missing — though earlier `npm` builds in the *same* session had worked. A rebuild with a hand-patched PATH then exited with crash code `0xC0000409` (STATUS_STACK_BUFFER_OVERRUN) right after a partial "Completed", because a child process couldn't resolve its environment.

**Rule:**
Don't trust the spawned shell's inherited PATH for builds/deploys here. Reconstruct the canonical PATH from the registry and call npm by full path:
`$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User'); & 'C:\Program Files\nodejs\npm.cmd' --prefix 'C:\Projects\packetpilotai' run <script>`

**Why it matters:**
A partial build that crashes on a child process reads like a code failure when it's really a missing-PATH problem (a hand-patched PATH can still leave System32 gaps). The registry PATH is the canonical login PATH and yields a clean `EXIT=0`. Applies to `npm run deploy` too.

---

## 2026-06-03 — Astro 6 + Cloudflare dev SSR floods "Invalid hook call / useState null"

**What happened:**
`npm run dev` logged `Invalid hook call` + `Cannot read properties of null (reading 'useState')` for **every** React island, on every request. Prod build and client hydration were fine — dev SSR only.

**Rule:**
Known upstream bug (withastro/astro#16529): Vite optimizes `react` and `react-dom/server` in separate passes, so react-dom/server holds a React whose hook dispatcher is null. `resolve.dedupe` does NOT fix it (not a real on-disk duplicate). Fix = force all React island deps into one eager pre-bundle pass in `astro.config.mjs`:
```js
vite: {
  optimizeDeps: { include: ['react','react-dom','react-dom/client','react-dom/server','react/jsx-runtime','react/jsx-dev-runtime'] },
  ssr: { optimizeDeps: { include: ['react','react-dom','react-dom/server','react/jsx-runtime','react/jsx-dev-runtime'] } },
}
```

**Why it matters:**
Dev-only noise (prod unaffected — `optimizeDeps` doesn't touch the Rollup prod build), but it masks real errors. Always `npm run build`-verify after touching `astro.config.mjs`. Revisit/remove if a future Astro / `@astrojs/react` bump fixes it upstream (currently @astrojs/react 5.x on Astro 6).

---

## 2026-06-03 — preview_screenshot times out on infinite animations

**What happened:**
`preview_screenshot` timed out (30s) repeatedly on the homepage though the page was healthy (`preview_eval`/`preview_inspect` returned instantly). The capture waits for an "idle" that never arrives: perpetual CSS animations (scanline, blinking caret) + canvas islands' `requestAnimationFrame` loops (Topology/Traceroute at 60fps).

**Rule:**
Before screenshotting this site, freeze motion via `preview_eval`: (1) `window.requestAnimationFrame = () => 0`; (2) clear pending timers (`let hi=setTimeout(()=>{},0); for(i=0..hi) clearTimeout(i)/clearInterval(i)`); (3) inject `*{animation:none!important;transition:none!important}` + hide `.ppc-scanline`. CSS-only freeze is NOT enough — the rAF/canvas loops must be killed too. For pure verification (colors, computed styles, layout), prefer `preview_inspect` — it never hangs.

**Why it matters:**
Burned ~5 calls before diagnosing. Don't keep retrying a hanging screenshot — freeze first, or verify via inspect.

---

## 2026-06-03 — work in the artifact, keep chat thin (user workflow correction)

**What happened:**
Delivered a large audit as walls of chat text, then a triage table as more walls, then answered "let's build a viewer to escape the chat" with *more* chat plus a multiple-choice scoping quiz. User pushback: "reading all this in chat is terrible" → "we need a better workflow" → (rejected the quiz).

**Rule:**
For large artifacts / design iteration: move the work into a persistent surface (a doc, or the live `preview` server) and treat chat as a thin control channel. Don't make the user read-to-decide — show two states and let them point. Build → show → react in small loops; don't scope big up front via questionnaires. Don't reflexively build meta-tooling (dashboards) when the leverage is in the decision or the fix itself.

**Why it matters:**
This user is an operator who wants velocity and visual ground-truth, not prose to wade through. Verbose chat + premature decision-cards actively burn trust. (Validated live this session — the live-preview/HMR loop landed; the chat-walls did not.)

---
