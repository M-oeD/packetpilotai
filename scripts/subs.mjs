// Newsletter reconcile + report — the list-truth counterpart to `npm run traffic`.
// D1 (`packetpilot-subs`) is the source of truth; Beehiiv is delivery. This script:
//
//   1. Retries every `pending_sync` row against Beehiiv (the key was missing or
//      Beehiiv was down at signup time).
//   2. Pulls Beehiiv's live subscription list and reconciles status drift back
//      into D1 (confirmed -> active, unsubscribe-link clicks -> unsubscribed).
//   3. Prints a terminal list-truth report, same shape as `npm run traffic`.
//
// D1 access: shells out to the local `wrangler d1 execute` binary (--json) — the
// simplest local-capable route. No separate REST API token to mint, and it
// resolves identically pre- and post-deploy. Defaults to --local (matches
// `npm run dev` / `npm run preview`); pass --remote to reconcile the deployed
// database (needs a real database_id in wrangler.jsonc — see the d1_databases
// comment there and tasks/newsletter-intake-spec-2026-07-15.md).
//
// Required env (.dev.vars, see .dev.vars.example): BEEHIIV_API_KEY, BEEHIIV_PUB_ID.
//
// Usage:  node scripts/subs.mjs [--remote]   |   npm run subs -- --remote

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const execFileAsync = promisify(execFile);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DB_NAME = 'packetpilot-subs';
const BEEHIIV_BASE = 'https://api.beehiiv.com/v2';

const hasFlag = (name) => process.argv.includes(`--${name}`);

async function readEnv(name) {
	if (process.env[name]) return process.env[name].trim();
	const { readFile } = await import('node:fs/promises');
	const re = new RegExp('^\\s*' + name + '\\s*=\\s*"?([^"\\r\\n]+)"?', 'm');
	for (const f of ['.dev.vars', '.env']) {
		try {
			const m = (await readFile(join(ROOT, f), 'utf8')).match(re);
			if (m) return m[1].trim();
		} catch { /* missing file */ }
	}
	return null;
}

// Same PATH-trap fix as npm (tasks/lessons.md 2026-05-29): call the binary by
// full path rather than trusting a possibly-stripped PATH to resolve `wrangler`.
function wranglerBin() {
	return join(ROOT, 'node_modules', '.bin', process.platform === 'win32' ? 'wrangler.cmd' : 'wrangler');
}

const esc = (s) => String(s).replace(/'/g, "''");
function nowIso() { return new Date().toISOString(); }
const pad = (n, w = 6) => String(n).padStart(w);
const bar = (n, max, w = 24) => '#'.repeat(Math.max(0, Math.round((n / (max || 1)) * w)));

async function d1(sql, remote) {
	const { stdout } = await execFileAsync(
		wranglerBin(),
		['d1', 'execute', DB_NAME, remote ? '--remote' : '--local', '--json', '--command', sql],
		{ cwd: ROOT, maxBuffer: 1024 * 1024 * 16 }
	);
	const parsed = JSON.parse(stdout);
	return parsed[0]?.results ?? [];
}

async function beehiivCreate(apiKey, pubId, email) {
	const res = await fetch(`${BEEHIIV_BASE}/publications/${pubId}/subscriptions`, {
		method: 'POST',
		headers: { Authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
		body: JSON.stringify({ email, reactivate_existing: false, send_welcome_email: true, utm_source: 'packetpilotai' }),
	});
	const body = await res.json().catch(() => ({}));
	if (!res.ok) return { ok: false, error: `HTTP ${res.status}: ${JSON.stringify(body).slice(0, 300)}` };
	return { ok: true, id: body?.data?.id };
}

async function beehiivListAll(apiKey, pubId) {
	const byEmail = new Map();
	let page = 1;
	for (;;) {
		const res = await fetch(`${BEEHIIV_BASE}/publications/${pubId}/subscriptions?limit=100&page=${page}`, {
			headers: { Authorization: `Bearer ${apiKey}` },
		});
		if (!res.ok) throw new Error(`Beehiiv list HTTP ${res.status}`);
		const body = await res.json();
		for (const s of body?.data ?? []) if (s.email) byEmail.set(String(s.email).toLowerCase(), s);
		const totalPages = body?.total_pages ?? 1;
		if (page >= totalPages) break;
		page++;
	}
	return byEmail;
}

async function main() {
	const remote = hasFlag('remote');
	const apiKey = await readEnv('BEEHIIV_API_KEY');
	const pubId = await readEnv('BEEHIIV_PUB_ID');
	if (!apiKey || !pubId) {
		console.error('\n  Need BEEHIIV_API_KEY and BEEHIIV_PUB_ID in .dev.vars (see .dev.vars.example).\n');
		process.exitCode = 1;
		return;
	}

	console.log(`\n  packetpilot-subs · reconcile + report · ${nowIso()}  (${remote ? 'REMOTE' : 'local'} D1)`);

	// ---- Step 1: retry pending_sync rows against Beehiiv --------------------
	let pending = [];
	try {
		pending = await d1(`SELECT email FROM subscribers WHERE status = 'pending_sync';`, remote);
	} catch (e) {
		console.error(
			`\n  D1 unreachable: ${String(e.message).split('\n')[0]}\n` +
			`  (has 'wrangler d1 create packetpilot-subs' run yet, with the real database_id pasted into wrangler.jsonc?\n` +
			`   for --local, has 'wrangler d1 execute packetpilot-subs --local --file=migrations/0001_subscribers.sql' run yet?)\n`
		);
		process.exitCode = 1;
		return;
	}

	console.log(`\n  STEP 1 — retrying ${pending.length} pending_sync row(s) against Beehiiv:`);
	let retried = 0, retriedOk = 0;
	for (const row of pending) {
		retried++;
		const email = row.email;
		const result = await beehiivCreate(apiKey, pubId, email);
		const ts = nowIso();
		if (result.ok) {
			retriedOk++;
			await d1(`UPDATE subscribers SET status = 'synced', beehiiv_id = '${esc(result.id ?? '')}', updated_at = '${ts}' WHERE email = '${esc(email)}';`, remote);
			await d1(`INSERT INTO sub_events (email, event, detail, at) VALUES ('${esc(email)}', 'sync_ok', '${esc(JSON.stringify({ retried: true }))}', '${ts}');`, remote);
			console.log(`    ok      ${email}`);
		} else {
			await d1(`INSERT INTO sub_events (email, event, detail, at) VALUES ('${esc(email)}', 'sync_fail', '${esc(JSON.stringify({ error: result.error }))}', '${ts}');`, remote);
			console.log(`    fail    ${email}  (${result.error})`);
		}
	}

	// ---- Step 2: pull Beehiiv status back into D1 ----------------------------
	console.log(`\n  STEP 2 — pulling Beehiiv status back into D1:`);
	let reconciledActive = 0, reconciledUnsub = 0;
	try {
		const beehiivByEmail = await beehiivListAll(apiKey, pubId);
		const tracked = await d1(`SELECT email, status FROM subscribers WHERE status IN ('synced', 'active', 'unsubscribed');`, remote);
		for (const row of tracked) {
			const bh = beehiivByEmail.get(String(row.email).toLowerCase());
			if (!bh) continue;
			const newStatus = bh.status === 'active' ? 'active' : bh.status === 'unsubscribed' ? 'unsubscribed' : null;
			if (!newStatus || newStatus === row.status) continue;
			const ts = nowIso();
			const event = newStatus === 'active' ? 'reconciled_active' : 'reconciled_unsub';
			await d1(`UPDATE subscribers SET status = '${newStatus}', updated_at = '${ts}' WHERE email = '${esc(row.email)}';`, remote);
			await d1(`INSERT INTO sub_events (email, event, detail, at) VALUES ('${esc(row.email)}', '${event}', '${esc(JSON.stringify({ from: row.status }))}', '${ts}');`, remote);
			if (newStatus === 'active') reconciledActive++; else reconciledUnsub++;
		}
		console.log(`    checked ${tracked.length} tracked row(s) against Beehiiv's list (${beehiivByEmail.size} subscribers there).`);
	} catch (e) {
		console.log(`    (Beehiiv pull failed: ${String(e.message).split('\n')[0]})`);
	}

	// ---- List-truth report ----------------------------------------------------
	const counts = await d1(`SELECT status, COUNT(*) as n FROM subscribers GROUP BY status;`, remote);
	const total = counts.reduce((s, r) => s + Number(r.n), 0);
	const maxN = Math.max(1, ...counts.map((r) => Number(r.n)));
	console.log(`\n  LIST TRUTH — subscribers by status (D1, ${remote ? 'remote' : 'local'}):`);
	console.log(`    total ${total}`);
	for (const r of counts) console.log(`    ${pad(r.n, 5)}  ${bar(Number(r.n), maxN)}  ${r.status}`);

	console.log(`\n  retried ${retried} pending row(s), ${retriedOk} synced ok. Reconciled ${reconciledActive} -> active, ${reconciledUnsub} -> unsubscribed.\n`);
}

main().catch((e) => { console.error(`\n  Error: ${e.message}\n`); process.exitCode = 1; });
