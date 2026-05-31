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
