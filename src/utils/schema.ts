// Helpers that build JSON-LD structured data objects for SEO / rich results.
// All builders return plain objects; callers serialize them with JSON.stringify
// and inject via `set:html` so values are escaped safely.

import { SITE_AUTHOR, SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from '../consts';

/** Resolve a possibly-relative path to an absolute URL on the canonical site. */
export function absoluteUrl(path: string, site: URL | undefined): string {
	const base = site ?? new URL(SITE_URL);
	return new URL(path, base).href;
}

/** Publisher / brand identity reused across schema blocks. */
export function organizationSchema(site: URL | undefined, logoPath: string) {
	return {
		'@type': 'Organization',
		name: SITE_AUTHOR,
		url: absoluteUrl('/', site),
		logo: absoluteUrl(logoPath, site),
	};
}

/** Sitewide WebSite node — emitted on every page. */
export function websiteSchema(site: URL | undefined) {
	return {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: SITE_TITLE,
		description: SITE_DESCRIPTION,
		url: absoluteUrl('/', site),
		publisher: organizationSchema(site, '/favicon.svg'),
	};
}

export interface ArticleSchemaInput {
	title: string;
	description: string;
	url: string;
	image: string;
	datePublished: string;
	dateModified?: string;
	keywords?: string[];
}

/** BlogPosting node for individual blog posts. */
export function blogPostingSchema(input: ArticleSchemaInput, site: URL | undefined) {
	const schema: Record<string, unknown> = {
		'@context': 'https://schema.org',
		'@type': 'BlogPosting',
		headline: input.title,
		description: input.description,
		image: input.image,
		datePublished: input.datePublished,
		dateModified: input.dateModified ?? input.datePublished,
		mainEntityOfPage: { '@type': 'WebPage', '@id': input.url },
		author: { '@type': 'Organization', name: SITE_AUTHOR, url: absoluteUrl('/', site) },
		publisher: organizationSchema(site, '/favicon.svg'),
	};
	if (input.keywords && input.keywords.length > 0) {
		schema.keywords = input.keywords.join(', ');
	}
	return schema;
}

/**
 * FAQPage node. Note: Google restricted FAQ *rich results* to authoritative
 * gov/health sites in 2023, so this rarely earns a SERP enhancement — but the
 * markup is harmless, future-proof, and the underlying visible FAQ content
 * still helps long-tail / "People Also Ask" coverage.
 */
export function faqPageSchema(faqs: { q: string; a: string }[]) {
	return {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: faqs.map((f) => ({
			'@type': 'Question',
			name: f.q,
			acceptedAnswer: { '@type': 'Answer', text: f.a },
		})),
	};
}

/** BreadcrumbList node — improves SERP breadcrumb rendering and crawl signals. */
export function breadcrumbSchema(
	crumbs: { name: string; path: string }[],
	site: URL | undefined,
) {
	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: crumbs.map((c, i) => ({
			'@type': 'ListItem',
			position: i + 1,
			name: c.name,
			item: absoluteUrl(c.path, site),
		})),
	};
}
