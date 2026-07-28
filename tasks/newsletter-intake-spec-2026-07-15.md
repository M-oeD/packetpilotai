# Newsletter Intake System — Option B Spec (2026-07-15)

**Status: APPROVED 2026-07-16 → BUILT same day (sonnet subagent; Codex CLI wedged). Reviewed + endpoint hardened; `npm run build` green. In working tree, NOT deployed — owner actions in §Owner actions still gate go-live. See tasks/todo.md "Option B intake" batch.**

## Goal

Own the subscriber list and the intake path. D1 becomes the source of truth for the list;
Beehiiv demotes from "platform" to replaceable delivery vendor (it still composes and sends
the actual newsletter). Forward-compatible with Option C (self-send via Resend/SES) — C swaps
the sync arm only; nothing in this spec gets thrown away.

## Why (beyond de-fragmentation)

- **The current embed silently loses subscribers.** Both capture points load
  `subscribe-forms.beehiiv.com/v3/loader.js` client-side. uBlock/adblockers block beehiiv
  embeds, and this site's audience (network admins, terminal aesthetic) is a peak-adblock
  demographic. For those visitors the form never renders — the signup is lost with no trace.
  A first-party form posting to our own endpoint is immune.
- **Never lose an email.** D1 write happens first; Beehiiv sync is best-effort with retry.
  Today a Beehiiv outage = lost signup.
- Third-party script leaves every page (perf + privacy — consistent with the RUM-beacon
  removal ethos).
- Native form styled in the ppc design system instead of an off-brand iframe.

## Non-goals (Option C boundary — explicitly OUT)

- No email sending from our infra. Zero deliverability surface: no SPF/DKIM work, no
  bounce handling, no unsubscribe endpoint. Beehiiv keeps owning confirmation emails,
  newsletter sends, and the unsubscribe link.
- No open/click analytics, no segmentation, no admin UI.
- No Turnstile/CAPTCHA in v1 (honeypot + rate limit only; Turnstile is the upgrade lever
  if spam appears — it's free and CF-native).

## Architecture

```
visitor → native <form> (NewsletterBar / starter-kit)
        → POST /api/subscribe        (Astro API route, same CF Worker — zero new infra)
            1. validate + honeypot check
            2. INSERT into D1 (status: pending_sync)     ← source of truth, never fails silently
            3. POST api.beehiiv.com/v2/publications/{PUB_ID}/subscriptions
               → ok:   status → synced   (Beehiiv sends its confirm/welcome per pub settings)
               → fail: stays pending_sync (reconcile retries later)
        → redirect /subscribed  (no-JS path)  |  inline "✓ subscribed" (JS path)

scripts/subs.mjs  (`npm run subs`)  — reconcile + report:
  pull Beehiiv subscriptions (paginated GET) ⇄ diff D1
  - retry pending_sync rows
  - pull back status changes (active / unsubscribed) → update D1
  - print list-truth report in terminal (sibling of `npm run traffic`)
```

No webhooks in v1 — reconcile-by-poll is deliberate (webhook plan-gating unverified, and
polling fits the existing nightly-sweep pattern if we ever want it cadenced).

## D1 schema

Database: `packetpilot-subs`, binding `DB` in wrangler.jsonc.

```sql
CREATE TABLE subscribers (
  id            INTEGER PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  status        TEXT NOT NULL DEFAULT 'pending_sync',
                -- pending_sync | synced | active | unsubscribed | invalid
  source        TEXT,                -- 'newsletter-bar' | 'starter-kit'
  page          TEXT,                -- path the form was on
  utm_source    TEXT, utm_medium TEXT, utm_campaign TEXT,
  beehiiv_id    TEXT,
  created_at    TEXT NOT NULL,       -- ISO 8601 UTC
  updated_at    TEXT NOT NULL
);

CREATE TABLE sub_events (            -- append-only audit trail (provenance)
  id          INTEGER PRIMARY KEY,
  email       TEXT NOT NULL,
  event       TEXT NOT NULL,         -- subscribed | sync_ok | sync_fail | reconciled_active |
                                     -- reconciled_unsub | imported
  detail      TEXT,                  -- JSON blob (error msg, beehiiv status, …)
  at          TEXT NOT NULL
);
```

Deliberately NOT stored: IP address, user agent. Email + source + timestamps only.

## Endpoint contract — `src/pages/api/subscribe.ts`

- **POST**, accepts `application/x-www-form-urlencoded` (progressive enhancement: form works
  with JS disabled) and JSON.
- Fields: `email` (required), `source`, `page`, `utm_*` (optional), `website` (honeypot —
  hidden field; non-empty → return 200 and do nothing).
- Validation: trim/lowercase, length ≤ 254, single `@` with dot in domain. Reject → 422
  (JSON) or redirect back with `?error=1` (form path).
- Duplicate email → idempotent 200 ("you're on the list") — no enumeration-friendly errors.
- Rate limit: Cloudflare WAF rate rule on `/api/subscribe` (dashboard, e.g. 10 req/min/IP).
  No code needed.
- D1 insert first, Beehiiv call second (`send_welcome_email` / double-opt-in per publication
  settings; pass `utm_source=packetpilotai`). Beehiiv failure never surfaces to the visitor.
- Success: JS path gets `200 {ok:true}`; no-JS path gets `303 → /subscribed`.

New page `/subscribed`: minimal ppc-styled thank-you ("check your inbox to confirm").

## UI swap

- `NewsletterBar.astro`: replace the loader `<script>` with a native form (email input +
  submit button, ppc-accent styling, tiny inline `<script>` for fetch + inline success state,
  falls back to plain POST). Bar copy unchanged.
- `starter-kit.astro`: same form inline (or extract a shared `SubscribeForm.astro` used by
  both — preferred, kills the current duplication).
- Result: `subscribe-forms.beehiiv.com` gone from the site entirely.

## Config & secrets

- `wrangler.jsonc`: add `d1_databases` binding (`DB` → `packetpilot-subs`).
- Secrets: `BEEHIIV_API_KEY`, `BEEHIIV_PUB_ID` — `.dev.vars` locally (update
  `.dev.vars.example`), `wrangler secret put` for prod.
- `global_fetch_strictly_public` compat flag: fine — api.beehiiv.com is public.
- Dev: adapter's `platformProxy` is default-on in current @astrojs/cloudflare — verify D1
  binding resolves under `npm run dev`; if not, set `cloudflare({ platformProxy: { enabled: true } })`.
  **Any astro.config.mjs touch → `npm run build` after (house rule).**

## Migration (one-time)

Beehiiv dashboard → export subscribers CSV → seed script inserts into D1 with
`status='active'`, `source='beehiiv-import'`, event `imported`. List is small; done in minutes.

## Owner actions (before build can finish)

1. Beehiiv: complete Stripe identity verification (unlocks API), create API key, grab
   Publication ID. (API is available on the free Launch plan — verified 2026-07-15; Send API
   excluded, which we don't need.)
2. Decide double-opt-in on/off in Beehiiv publication settings (recommend ON).
3. Cloudflare dashboard: add the WAF rate rule on `/api/subscribe`.
4. Export current subscriber CSV for the seed.

## Verification plan (before "done")

1. `npm run build` green; `npm run preview` — form renders on / and /starter-kit.
2. Local subscribe (real test email) → row lands in D1 (`wrangler d1 execute … --command "SELECT …"`),
   Beehiiv dashboard shows the subscriber, confirm email arrives.
3. Honeypot filled → 200, no row. Duplicate → 200, single row. JS disabled → /subscribed redirect.
4. Kill BEEHIIV_API_KEY locally → subscribe still 200, row `pending_sync`; `npm run subs` retries it to `synced`.
5. Unsubscribe via Beehiiv email link → `npm run subs` pulls status back to `unsubscribed`.
6. Deploy (`npm run deploy`), repeat test 2 against prod, confirm embed script absent from live pages.

## Effort estimate

- D1 + endpoint + shared form component + /subscribed page: ~half a day.
- `scripts/subs.mjs` reconcile/report: ~2–3 h (clone the traffic.mjs shape).
- Migration + verification: ~1 h.

## Upgrade path to Option C (later, when send cadence is real)

Intake, D1, and the form don't change. C adds: Resend/SES sender + markdown→HTML render
pipeline, our own unsubscribe endpoint + List-Unsubscribe headers, send subdomain
(SPF/DKIM/DMARC), suppression handling in `subscribers.status`. Then cancel Beehiiv.
The build doubles as a Loadout post ("replaced my newsletter SaaS with a Worker, D1, and an
API"). Decision deferred.

## Risks / open questions

- Beehiiv API shape drift (v2 subscriptions endpoint assumed) — confirm exact request/response
  against docs at build time, first call is the test.
- Beehiiv double-opt-in behavior when subscriber is created via API (does it send the confirm
  email?) — verify in test 2; if it doesn't, flip to single-opt-in + welcome email and note it.
- Free-plan API rate limits — irrelevant at this scale, reconcile pages politely anyway.
