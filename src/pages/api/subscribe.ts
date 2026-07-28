// Newsletter intake endpoint — src/pages/api/subscribe.ts
// Contract: tasks/newsletter-intake-spec-2026-07-15.md ("Endpoint contract" section).
//
// D1 (binding `DB`) is the source of truth and is written FIRST; Beehiiv sync is
// best-effort and never surfaces failure to the visitor (row just stays
// `pending_sync` for `npm run subs` to retry later). No IP, no user-agent stored.
//
// Bindings/secrets come from the Workers runtime via `cloudflare:workers` — this
// adapter version (>=@astrojs/cloudflare 12) removed `Astro.locals.runtime.env`;
// `import { env } from 'cloudflare:workers'` is the supported replacement and
// resolves identically under `astro dev`, `wrangler dev`, and production.
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { isHoneypotFilled, isValidEmail, normalizeEmail } from '../../lib/subscribe-validation.js';

export const prerender = false;

// BEEHIIV_API_KEY / BEEHIIV_PUB_ID are runtime secrets (.dev.vars locally,
// `wrangler secret put` in prod) — deliberately not declared in wrangler.jsonc
// `vars`, so they don't show up in the generated Env until set locally.
type SubscribeEnv = Env & {
	BEEHIIV_API_KEY?: string;
	BEEHIIV_PUB_ID?: string;
};

const subscribeEnv = env as unknown as SubscribeEnv;

function nowIso(): string {
	return new Date().toISOString();
}

function str(v: unknown): string {
	return typeof v === 'string' ? v : '';
}

function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json' },
	});
}

/** Only allow same-site relative paths for the "redirect back" target — never an open redirect. */
function safePagePath(page: string): string {
	if (page.startsWith('/') && !page.startsWith('//')) return page;
	return '/';
}

function withErrorParam(path: string): string {
	const [base, hash] = path.split('#');
	const sep = base.includes('?') ? '&' : '?';
	return `${base}${sep}error=1${hash ? `#${hash}` : ''}`;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
	const contentType = request.headers.get('content-type') || '';
	if (contentType.includes('application/json')) {
		try {
			const data = await request.json();
			return typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : {};
		} catch {
			return {};
		}
	}
	// application/x-www-form-urlencoded (the no-JS <form> fallback). Request.formData()
	// also happily parses multipart/form-data if a client ever sends that instead.
	const form = await request.formData().catch(() => null);
	if (!form) return {};
	return Object.fromEntries(form.entries());
}

async function insertEvent(db: D1Database, email: string, event: string, detail?: unknown): Promise<void> {
	await db
		.prepare('INSERT INTO sub_events (email, event, detail, at) VALUES (?, ?, ?, ?)')
		.bind(email, event, detail !== undefined ? JSON.stringify(detail) : null, nowIso())
		.run();
}

async function syncToBeehiiv(
	email: string,
	utm: { medium: string | null; campaign: string | null }
): Promise<{ ok: true; beehiivId?: string } | { ok: false; error: string }> {
	const apiKey = subscribeEnv.BEEHIIV_API_KEY;
	const pubId = subscribeEnv.BEEHIIV_PUB_ID;
	if (!apiKey || !pubId) return { ok: false, error: 'missing_beehiiv_config' };

	try {
		const res = await fetch(`https://api.beehiiv.com/v2/publications/${pubId}/subscriptions`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'content-type': 'application/json',
			},
			body: JSON.stringify({
				email,
				reactivate_existing: false,
				send_welcome_email: true,
				utm_source: 'packetpilotai',
				...(utm.medium ? { utm_medium: utm.medium } : {}),
				...(utm.campaign ? { utm_campaign: utm.campaign } : {}),
			}),
		});
		const body = await res.json().catch(() => ({}) as Record<string, unknown>);
		if (!res.ok) {
			return { ok: false, error: `HTTP ${res.status}: ${JSON.stringify(body).slice(0, 400)}` };
		}
		const data = (body as { data?: { id?: string } }).data;
		return { ok: true, beehiivId: data?.id };
	} catch (e) {
		return { ok: false, error: e instanceof Error ? e.message : 'fetch_failed' };
	}
}

export const POST: APIRoute = async ({ request, redirect }) => {
	const contentType = request.headers.get('content-type') || '';
	const isJson = contentType.includes('application/json');
	const body = await readBody(request);

	const rawPage = str(body.page);
	const backTo = safePagePath(rawPage || '/');

	// Honeypot: bots that fill every field trip this. Pretend success, do nothing.
	if (isHoneypotFilled(body.website)) {
		return isJson ? jsonResponse({ ok: true }) : redirect('/subscribed', 303);
	}

	const email = normalizeEmail(body.email);
	if (!isValidEmail(email)) {
		return isJson ? jsonResponse({ ok: false, error: 'invalid_email' }, 422) : redirect(withErrorParam(backTo), 303);
	}

	const source = str(body.source) || null;
	const page = rawPage || null;
	const utmSource = str(body.utm_source) || null;
	const utmMedium = str(body.utm_medium) || null;
	const utmCampaign = str(body.utm_campaign) || null;
	const db = subscribeEnv.DB;
	const ts = nowIso();

	// D1 insert first — source of truth, never fails silently to the visitor.
	let isNewSubscriber = true;
	try {
		await db
			.prepare(
				`INSERT INTO subscribers (email, status, source, page, utm_source, utm_medium, utm_campaign, created_at, updated_at)
				 VALUES (?, 'pending_sync', ?, ?, ?, ?, ?, ?, ?)`
			)
			.bind(email, source, page, utmSource, utmMedium, utmCampaign, ts, ts)
			.run();
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		if (/unique/i.test(msg)) {
			// Duplicate email — idempotent success, no enumeration-friendly distinction.
			isNewSubscriber = false;
		} else {
			// D1 itself is unreachable/broken — the one failure we can't hide.
			return isJson ? jsonResponse({ ok: false, error: 'server_error' }, 500) : redirect(withErrorParam(backTo), 303);
		}
	}

	if (isNewSubscriber) {
		// Everything past the initial insert is bookkeeping: the subscriber row is
		// already persisted, so no failure here may surface to the visitor — the row
		// just stays pending_sync for `npm run subs` to retry/reconcile.
		try {
			await insertEvent(db, email, 'subscribed', { source, page });

			// Beehiiv sync — best effort only.
			const sync = await syncToBeehiiv(email, { medium: utmMedium, campaign: utmCampaign });
			if (sync.ok) {
				await db
					.prepare(`UPDATE subscribers SET status = 'synced', beehiiv_id = ?, updated_at = ? WHERE email = ?`)
					.bind(sync.beehiivId ?? null, nowIso(), email)
					.run();
				await insertEvent(db, email, 'sync_ok', { beehiivId: sync.beehiivId ?? null });
			} else {
				await insertEvent(db, email, 'sync_fail', { error: sync.error });
			}
		} catch {
			// Swallowed by design — see comment above.
		}
	}

	return isJson ? jsonResponse({ ok: true }) : redirect('/subscribed', 303);
};
