// TRUE server-side traffic for packetpilotai.com — Cloudflare *edge* HTTP
// analytics, NOT the RUM beacon. Reads what actually hit the edge: nothing to
// ad-block, no client JS. But the edge ALSO sees every bot and vuln-scanner, so
// raw edge counts OVERcount humans as badly as RUM UNDERcounts them. This script
// separates the layers honestly:
//
//   1. Edge totals (1dGroups, 30d) ...... ALL traffic incl. bots/scanners
//   2. Scanner-noise gauge .............. % of requests that 404/403 (bot signature)
//   3. Real pageviews (adaptive, ~7d) ... GET + 200 + eyeball, assets stripped  <- trust this
//
//   RUM visits (npm run stats)  <  real humans  ~=  layer 3  <<  edge pageviews
//
// Free-plan limits this probe established: adaptive data retains ~1 week and
// can't filter by content-type, but DOES expose path/status/method — so layer 3
// is the closest honest "humans reading pages," and the distribution-test signal
// (a posted URL spikes here, distinct from the 404 scanner noise).
//
// Auth: token with Zone Analytics:Read (+ Account Analytics:Read for npm run
// stats). Zone id via CF_ZONE_TAG in .dev.vars (public identifier).
//
// Usage:  node scripts/traffic.mjs [--days 30]   |   npm run traffic -- --days 30

const GQL = 'https://api.cloudflare.com/client/v4/graphql';
const SITE = 'packetpilotai.com';
const ADAPTIVE_RETENTION_DAYS = 7; // free-plan cap established by probe

function arg(name, fallback) {
	const i = process.argv.indexOf(`--${name}`);
	return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

async function readEnv(name) {
	if (process.env[name]) return process.env[name].trim();
	const { readFile } = await import('node:fs/promises');
	const { fileURLToPath } = await import('node:url');
	const { dirname, join } = await import('node:path');
	const root = join(dirname(fileURLToPath(import.meta.url)), '..');
	const re = new RegExp('^\\s*' + name + '\\s*=\\s*"?([^"\\r\\n]+)"?', 'm');
	for (const f of ['.dev.vars', '.env']) {
		try {
			const m = (await readFile(join(root, f), 'utf8')).match(re);
			if (m) return m[1].trim();
		} catch { /* missing file */ }
	}
	return null;
}

async function gql(token, query) {
	const res = await fetch(GQL, {
		method: 'POST',
		headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({ query }),
	});
	const json = await res.json();
	if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join('; '));
	return json.data?.viewer?.zones?.[0] ?? {};
}

const dayStr = (d) => d.toISOString().slice(0, 10);
const pad = (n, w = 6) => String(n).padStart(w);
const bar = (n, max, w = 30) => '#'.repeat(Math.max(0, Math.round((n / (max || 1)) * w)));

// A path is a real page (not a static asset / feed / sitemap).
const ASSET = /(^\/_astro\/|^\/_image|^\/og\/|\.(js|mjs|css|png|jpe?g|svg|ico|webp|avif|gif|woff2?|ttf|map|txt|xml|json)$|^\/sitemap|^\/rss|^\/robots|^\/favicon)/i;

async function main() {
	const days = Math.max(1, parseInt(arg('days', '30'), 10));
	const token = await readEnv('CF_ANALYTICS_TOKEN');
	const zone = arg('zone', null) || (await readEnv('CF_ZONE_TAG'));
	if (!token || !zone) {
		console.error('\n  Need CF_ANALYTICS_TOKEN (Zone Analytics:Read) and CF_ZONE_TAG in .dev.vars.\n');
		process.exitCode = 1;
		return;
	}

	const today = new Date();
	const since = new Date(today.getTime() - (days - 1) * 864e5);
	console.log(`\n  ${SITE} · EDGE HTTP analytics · ${dayStr(since)} → ${dayStr(today)}  (zone ${zone.slice(0, 8)}…)`);

	// ---- Layer 1 + 2: 30-day daily rollup (1dGroups), all traffic ----------
	let rollup = [];
	try {
		const data = await gql(token, `query{viewer{zones(filter:{zoneTag:"${zone}"}){
			httpRequests1dGroups(filter:{date_geq:"${dayStr(since)}",date_leq:"${dayStr(today)}"},limit:${days + 1},orderBy:[date_ASC]){
				dimensions{date} sum{requests pageViews responseStatusMap{edgeResponseStatus requests}} uniq{uniques}
			}
		}}}`);
		rollup = data.httpRequests1dGroups || [];
	} catch (e) { console.log(`\n  (daily rollup unavailable: ${e.message})`); }

	if (rollup.length) {
		const totReq = rollup.reduce((s, r) => s + r.sum.requests, 0);
		const totPV = rollup.reduce((s, r) => s + r.sum.pageViews, 0);
		const peakU = Math.max(...rollup.map((r) => r.uniq.uniques));
		let s404 = 0, s403 = 0;
		for (const r of rollup) for (const m of r.sum.responseStatusMap) {
			if (m.edgeResponseStatus === 404) s404 += m.requests;
			if (m.edgeResponseStatus === 403) s403 += m.requests;
		}
		const noisePct = totReq ? Math.round(((s404 + s403) / totReq) * 100) : 0;
		console.log(`\n  LAYER 1 — all edge traffic (INCLUDES bots/scanners; not human):`);
		console.log(`    requests ${totReq}   CF pageViews ${totPV}   peak daily uniques ${peakU}`);
		console.log(`  LAYER 2 — scanner-noise gauge: ${noisePct}% of requests were 404/403 (${s404} + ${s403}). High = heavy bot scanning.`);
		const maxPV = Math.max(...rollup.map((r) => r.sum.pageViews));
		console.log(`\n  CF pageViews by day (still bot-inflated):`);
		for (const r of rollup) console.log(`    ${r.dimensions.date}  ${pad(r.sum.pageViews, 5)}  ${bar(r.sum.pageViews, maxPV)}`);
	}

	// ---- Layer 3: real pageviews (adaptive, per-day, last ~7d) -------------
	const look = Math.min(days, ADAPTIVE_RETENTION_DAYS);
	const paths = new Map();
	let layer3err = null, daysOK = 0;
	for (let i = 0; i < look; i++) {
		const d0 = new Date(today.getTime() - i * 864e5);
		const lo = dayStr(d0) + 'T00:00:00Z';
		const hi = dayStr(new Date(d0.getTime() + 864e5)) + 'T00:00:00Z';
		const q = `query{viewer{zones(filter:{zoneTag:"${zone}"}){
			httpRequestsAdaptiveGroups(filter:{datetime_geq:"${lo}",datetime_leq:"${hi}",requestSource:"eyeball",edgeResponseStatus:200,clientRequestHTTPMethodName:"GET"},limit:100,orderBy:[count_DESC]){
				count dimensions{clientRequestPath}
			}
		}}}`;
		try {
			const data = await gql(token, q);
			daysOK++;
			for (const row of data.httpRequestsAdaptiveGroups || []) {
				const p = row.dimensions.clientRequestPath;
				if (ASSET.test(p)) continue;
				paths.set(p, (paths.get(p) || 0) + row.count);
			}
		} catch (e) { layer3err = e.message; }
	}

	console.log(`\n  LAYER 3 — real pageviews: GET + 200 + eyeball, assets stripped, last ${daysOK}d  <-- closest to humans`);
	if (layer3err && !paths.size) {
		console.log(`    (adaptive query failed: ${layer3err})`);
	} else {
		const top = [...paths.entries()].sort((a, b) => b[1] - a[1]);
		const total = top.reduce((s, [, c]) => s + c, 0);
		console.log(`    total real pageviews (last ${daysOK}d): ${total}    distinct pages: ${top.length}`);
		const maxC = top[0]?.[1] || 1;
		for (const [p, c] of top.slice(0, 15)) console.log(`    ${pad(c, 5)}  ${bar(c, maxC, 14)}  ${p}`);
		if (layer3err) console.log(`    (note: ${daysOK}/${look} days returned; some failed: ${layer3err})`);
	}

	console.log(`\n  Cross-checks (exact, human, not in here): Beehiiv = signups · Gumroad = sales · 'npm run stats' = RUM human floor.\n`);
}

main().catch((e) => { console.error(`\n  Error: ${e.message}\n`); process.exitCode = 1; });
