// Pull real visitor analytics for packetpilotai.com from Cloudflare Web
// Analytics (RUM) via the GraphQL Analytics API.
//
// Auth: needs a Cloudflare API token with **Account → Account Analytics: Read**.
// The wrangler OAuth login token does NOT carry that scope, so this is separate.
// Provide it via the CF_ANALYTICS_TOKEN env var, or a `CF_ANALYTICS_TOKEN=...`
// line in `.dev.vars` (gitignored) at the repo root.
//
// Usage:
//   node scripts/web-stats.mjs            # last 7 days
//   node scripts/web-stats.mjs --days 30  # custom window (RUM retention caps ~30d on free)
//   npm run stats -- --days 30
//
// Note: these are deduplicated human-ish pageviews/visits from the cookieless
// beacon — NOT the same as raw Worker requests (which include every crawler hit).

const ACCOUNT_ID = process.env.CF_ACCOUNT_ID || '46e2992ddbb2158130bf8a9657be428f';
const SITE_URL = 'https://packetpilotai.com/';
const GQL = 'https://api.cloudflare.com/client/v4/graphql';

function arg(name, fallback) {
	const i = process.argv.indexOf(`--${name}`);
	return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

// Read a var from env, else from .dev.vars / .env at repo root (gitignored).
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
		} catch { /* file may not exist */ }
	}
	return null;
}

// The Web Analytics "site tag" is the beacon token embedded in the live HTML,
// so we don't have to hardcode it (and it stays correct if it ever rotates).
async function discoverSiteTag() {
	const html = await (await fetch(SITE_URL)).text();
	// Anchor on the cf-beacon attribute and grab the 32-hex token that follows,
	// regardless of how the surrounding quotes are HTML-escaped (&#34; vs &quot;).
	const m = html.match(/cf-beacon[\s\S]{0,80}?([0-9a-f]{32})/i);
	if (!m) throw new Error('Could not find the CF Web Analytics beacon token in the live HTML — is the beacon deployed?');
	return m[1];
}

async function gql(token, query) {
	const res = await fetch(GQL, {
		method: 'POST',
		headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({ query }),
	});
	const json = await res.json();
	if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join('; '));
	return json.data.viewer.accounts[0];
}

function iso(d) { return d.toISOString().replace(/\.\d+Z$/, 'Z'); }
function bar(n, max, width = 36) { return '█'.repeat(Math.max(0, Math.round((n / (max || 1)) * width))); }

const RUM = (alias, extra) =>
	`${alias}: rumPageloadEventsAdaptiveGroups(${extra}) { count sum { visits } dimensions { __DIMS__ } }`;

async function main() {
	const days = Math.max(1, parseInt(arg('days', '7'), 10));
	const token = await readEnv('CF_ANALYTICS_TOKEN');
	if (!token) {
		console.error(`\n  No CF_ANALYTICS_TOKEN found.\n
  Create one: Cloudflare dashboard → My Profile → API Tokens → Create Token
  → Create Custom Token → Permissions: Account · Account Analytics · Read
  → Account Resources: your account → Create, then copy it.\n
  Then add to .dev.vars (gitignored) at the repo root:
      CF_ANALYTICS_TOKEN=your_token_here\n`);
		process.exitCode = 1;
		return;
	}

	const until = new Date();
	const since = new Date(until.getTime() - days * 864e5);
	// Site tag: explicit override (--tag / CF_SITE_TAG) wins, else auto-discover
	// from the live HTML beacon. The deployed beacon now points at the
	// data-bearing tag, so auto-discovery alone returns real data — CF_SITE_TAG
	// is only needed to query a different site than the one currently deployed.
	const tag = arg('tag', null) || (await readEnv('CF_SITE_TAG')) || (await discoverSiteTag());
	const win = `filter: {datetime_geq: "${iso(since)}", datetime_leq: "${iso(until)}", siteTag: "${tag}"}`;

	const data = await gql(token, `query { viewer { accounts(filter: {accountTag: "${ACCOUNT_ID}"}) {
    totals: rumPageloadEventsAdaptiveGroups(${win}, limit: 1) { count sum { visits } }
    ${RUM('daily', `${win}, limit: 100, orderBy: [date_ASC]`).replace('__DIMS__', 'date')}
    ${RUM('pages', `${win}, limit: 12, orderBy: [count_DESC]`).replace('__DIMS__', 'requestPath')}
    ${RUM('countries', `${win}, limit: 8, orderBy: [count_DESC]`).replace('__DIMS__', 'countryName')}
    ${RUM('referers', `${win}, limit: 8, orderBy: [count_DESC]`).replace('__DIMS__', 'refererHost')}
  } } }`);

	const t = data.totals[0];
	console.log(`\n  packetpilotai.com · Web Analytics · last ${days}d (${iso(since).slice(0, 10)} → ${iso(until).slice(0, 10)})`);
	if (!t) {
		console.log('\n  No pageviews recorded in this window (or the token lacks Account Analytics:Read).');
		return;
	}
	console.log(`  Pageviews: ${t.count}   Visits: ${t.sum.visits}\n`);

	const maxDay = Math.max(...data.daily.map((d) => d.count));
	console.log('  By day');
	for (const d of data.daily) console.log(`    ${d.dimensions.date}  ${String(d.count).padStart(5)}  ${bar(d.count, maxDay)}`);

	const top = (label, rows, key) => {
		console.log(`\n  ${label}`);
		for (const r of rows) console.log(`    ${String(r.count).padStart(5)}  ${r.dimensions[key] || '(none)'}`);
	};
	top('Top pages', data.pages, 'requestPath');
	top('Top countries', data.countries, 'countryName');
	top('Top referrers', data.referers.filter((r) => r.dimensions.refererHost !== 'packetpilotai.com'), 'refererHost');
	console.log('');
}

main().catch((e) => { console.error(`\n  Error: ${e.message}\n`); process.exitCode = 1; });
