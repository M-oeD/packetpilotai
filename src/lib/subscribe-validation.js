// Pure helpers for the newsletter intake endpoint (src/pages/api/subscribe.ts).
// Kept dependency-free and framework-free on purpose: no Astro/Cloudflare imports,
// so this same module can be exercised directly with plain `node` (no bundler,
// no adapter) as well as imported into the Astro API route and reconcile scripts.
//
// Validation contract, per tasks/newsletter-intake-spec-2026-07-15.md:
//   trim + lowercase, length <= 254, single '@', dot in the domain (not leading
//   or trailing). Honeypot ("website" field): any non-empty value after trim
//   means a bot filled in a field real users never see.

export const MAX_EMAIL_LENGTH = 254;

/** Trim + lowercase. Non-strings normalize to ''. */
export function normalizeEmail(input) {
	if (typeof input !== 'string') return '';
	return input.trim().toLowerCase();
}

/**
 * Validate an already-normalized email (call normalizeEmail() first).
 * length <= 254, exactly one '@', and a dot inside the domain part that
 * isn't the first or last character.
 */
export function isValidEmail(email) {
	if (typeof email !== 'string' || !email) return false;
	if (email.length > MAX_EMAIL_LENGTH) return false;
	const parts = email.split('@');
	if (parts.length !== 2) return false;
	const [local, domain] = parts;
	if (!local || !domain) return false;
	if (!domain.includes('.')) return false;
	if (domain.startsWith('.') || domain.endsWith('.')) return false;
	return true;
}

/** Honeypot field "website" — any non-empty (post-trim) value means a bot. */
export function isHoneypotFilled(value) {
	return typeof value === 'string' && value.trim().length > 0;
}
