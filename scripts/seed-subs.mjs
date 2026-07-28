// One-time seed: import a Beehiiv subscriber CSV export into D1.
// Per the "Migration" section of tasks/newsletter-intake-spec-2026-07-15.md:
// every row lands with status='active', source='beehiiv-import', plus an
// 'imported' sub_events row each. List is small — this runs in minutes.
//
// D1 access: same route as scripts/subs.mjs — shells out to the local
// `wrangler d1 execute` binary (--file, batched). Defaults to --local; pass
// --remote once the real database exists and is migrated.
//
// Usage:  node scripts/seed-subs.mjs <path-to-beehiiv-export.csv> [--remote]

import { readFile, writeFile, unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DB_NAME = 'packetpilot-subs';
const BATCH_SIZE = 50;

function wranglerBin() {
	return join(ROOT, 'node_modules', '.bin', process.platform === 'win32' ? 'wrangler.cmd' : 'wrangler');
}

async function d1ExecFile(sqlFilePath, remote) {
	return execFileAsync(
		wranglerBin(),
		['d1', 'execute', DB_NAME, remote ? '--remote' : '--local', '--json', '--file', sqlFilePath],
		{ cwd: ROOT, maxBuffer: 1024 * 1024 * 16 }
	);
}

// Minimal RFC4180 CSV parser — quoted fields, escaped "" quotes, CRLF/LF rows.
function parseCsv(text) {
	const rows = [];
	let row = [], field = '', inQuotes = false;
	for (let i = 0; i < text.length; i++) {
		const c = text[i];
		if (inQuotes) {
			if (c === '"') {
				if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
			} else field += c;
		} else if (c === '"') {
			inQuotes = true;
		} else if (c === ',') {
			row.push(field); field = '';
		} else if (c === '\n' || c === '\r') {
			if (c === '\r' && text[i + 1] === '\n') i++;
			row.push(field); field = '';
			if (row.length > 1 || row[0] !== '') rows.push(row);
			row = [];
		} else field += c;
	}
	if (field !== '' || row.length) { row.push(field); rows.push(row); }
	return rows;
}

const esc = (s) => `'${String(s).replace(/'/g, "''")}'`;

function chunk(arr, size) {
	const out = [];
	for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
	return out;
}

async function main() {
	const csvPath = process.argv[2];
	const remote = process.argv.includes('--remote');
	if (!csvPath) {
		console.error('\n  Usage: node scripts/seed-subs.mjs <path-to-beehiiv-export.csv> [--remote]\n');
		process.exitCode = 1;
		return;
	}

	let text;
	try {
		text = await readFile(resolve(csvPath), 'utf8');
	} catch (e) {
		console.error(`\n  Could not read ${csvPath}: ${e.message}\n`);
		process.exitCode = 1;
		return;
	}

	const rows = parseCsv(text).filter((r) => r.some((c) => c.trim() !== ''));
	if (!rows.length) {
		console.error('\n  CSV is empty.\n');
		process.exitCode = 1;
		return;
	}

	const header = rows[0].map((h) => h.trim().toLowerCase());
	const emailIdx = header.findIndex((h) => h === 'email' || h === 'email address');
	if (emailIdx === -1) {
		console.error(`\n  Could not find an "email" column. Headers seen: ${header.join(', ')}\n`);
		process.exitCode = 1;
		return;
	}

	const dataRows = rows.slice(1);
	const emails = [];
	let skippedNoEmail = 0;
	for (const r of dataRows) {
		const email = (r[emailIdx] || '').trim().toLowerCase();
		if (email && email.includes('@')) emails.push(email);
		else skippedNoEmail++;
	}

	console.log(`\n  packetpilot-subs · seeding ${emails.length} row(s) from ${csvPath} (${remote ? 'REMOTE' : 'local'} D1)`);
	if (skippedNoEmail) console.log(`  (skipped ${skippedNoEmail} row(s) with no usable email column)`);

	const batches = chunk(emails, BATCH_SIZE);
	let inserted = 0, failed = 0;

	for (const [i, batch] of batches.entries()) {
		const now = new Date().toISOString();
		const statements = [];
		for (const email of batch) {
			statements.push(
				`INSERT INTO subscribers (email, status, source, page, created_at, updated_at) VALUES (${esc(email)}, 'active', 'beehiiv-import', NULL, '${now}', '${now}') ON CONFLICT(email) DO NOTHING;`,
				`INSERT INTO sub_events (email, event, detail, at) VALUES (${esc(email)}, 'imported', NULL, '${now}');`
			);
		}
		const tmpFile = join(tmpdir(), `packetpilotai-seed-subs-${process.pid}-${i}.sql`);
		await writeFile(tmpFile, statements.join('\n'), 'utf8');
		try {
			await d1ExecFile(tmpFile, remote);
			inserted += batch.length;
			console.log(`    batch ${i + 1}/${batches.length} ok (${batch.length} rows)`);
		} catch (e) {
			failed += batch.length;
			console.error(`    batch ${i + 1}/${batches.length} FAILED: ${String(e.message).split('\n')[0]}`);
		} finally {
			await unlink(tmpFile).catch(() => {});
		}
	}

	console.log(`\n  done — ${inserted} row(s) written, ${failed} failed.\n`);
	if (failed) process.exitCode = 1;
}

main().catch((e) => { console.error(`\n  Error: ${e.message}\n`); process.exitCode = 1; });
