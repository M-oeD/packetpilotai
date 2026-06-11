// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = 'PacketPilot AI';
export const SITE_DESCRIPTION = 'PacketPilot AI helps network admins automate repetitive tasks and solve real-world network problems using AI.';

// Canonical production origin. Used to build absolute URLs for SEO/OG/JSON-LD.
export const SITE_URL = 'https://packetpilotai.com';

// Site-wide author/publisher used for article metadata and structured data.
// Posts do not carry per-author frontmatter, so all content is attributed to
// the publishing organization.
export const SITE_AUTHOR = 'PacketPilot AI';

// Default Open Graph / Twitter card image (1200x630). Lives in public/ and is
// referenced as an absolute URL at render time. Individual pages/posts may
// override this via the `image` prop / frontmatter field.
export const OG_IMAGE = '/og-default.png';

// Social handle for Twitter/X cards (without the leading @). Leave empty to
// omit twitter:site / twitter:creator tags.
export const TWITTER_HANDLE = '';

// Google Search Console verification token. This value is intentionally public
// (it is exposed in the page's HTML for anyone to read), so committing it is
// safe. The PUBLIC_GOOGLE_SITE_VERIFICATION env var, if set, overrides this.
export const GOOGLE_SITE_VERIFICATION = 'CwHFqyMgKDxGipUsvqXzJ_kc-Bnb5zOaJkRVJx6gNzA';

// Cloudflare Web Analytics beacon token. PUBLIC by design (ships in client HTML) — safe to commit.
// Get it: Cloudflare dashboard -> Analytics & Logs -> Web Analytics -> "Add a site" -> copy the token.
// Leave as '' to disable the beacon (no script is emitted, build stays clean).
export const CF_ANALYTICS_TOKEN = '8bbbffa2f7d54790ba1d51964ad51de0';
