# Astro Starter Kit: Blog

```sh
npm create astro@latest -- --template blog
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

Features:

- ✅ Minimal styling (make it your own!)
- ✅ 100/100 Lighthouse performance
- ✅ SEO-friendly with canonical URLs and Open Graph data
- ✅ Sitemap support
- ✅ RSS Feed support
- ✅ Markdown & MDX support

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── content/
│   ├── layouts/
│   └── pages/
├── astro.config.mjs
├── README.md
├── package.json
└── tsconfig.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

The `src/content/` directory contains "collections" of related Markdown and MDX documents. Use `getCollection()` to retrieve posts from `src/content/blog/`, and type-check your frontmatter using an optional schema. See [Astro's Content Collections docs](https://docs.astro.build/en/guides/content-collections/) to learn more.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 📈 Analytics & SEO

The site emits Open Graph/Twitter cards, JSON-LD structured data (WebSite,
Organization, BlogPosting, BreadcrumbList), a canonical URL, `robots` meta, and
ships a `robots.txt` + sitemap. Blog posts carry article metadata, breadcrumbs,
and related-post internal links automatically.

Two optional integrations are wired through public environment variables (set
them in the Cloudflare Pages/Workers dashboard or a local `.env`). Both tags are
omitted entirely when the variable is unset, so nothing breaks without them:

| Variable | Purpose |
| :------- | :------ |
| `PUBLIC_CF_BEACON_TOKEN` | [Cloudflare Web Analytics](https://developers.cloudflare.com/web-analytics/) beacon token. Create a site in the CF dashboard → Web Analytics, copy the token from the JS snippet. Privacy-first, cookieless, no banner required. |
| `PUBLIC_GOOGLE_SITE_VERIFICATION` | `content` value from the Google Search Console HTML-tag verification method. Unlocks organic search impressions/CTR/ranking data. |
| `PUBLIC_BING_SITE_VERIFICATION` | `content` value from Bing Webmaster Tools' meta-tag verification (`msvalidate.01`). Free extra reach via Bing/DuckDuckGo. |
| `PUBLIC_GA4_ID` | Optional Google Analytics 4 measurement ID (`G-XXXXXXXXXX`). **Off by default.** ⚠️ GA4 sets cookies — enabling it likely requires a consent banner in some regions, unlike the cookieless Cloudflare beacon. Only set this if you want GA4 alongside (or instead of) CF Analytics. |

> These are baked at **build time** by Astro, so set them before `npm run build`
> / deploy. Re-deploy after changing them.

### Social share image

`public/og-default.png` (1200×630) is the default share card; each published
post also gets a unique `public/og/<slug>.png` card. Regenerate all of them with
`node scripts/generate-og.mjs` (uses `sharp`; run locally, not in CI — Workers
has no native bindings). Posts reference their card via the `image:` frontmatter
field; add new posts to the `POSTS` map in the script.

### Post FAQs

Posts may declare a `faqs:` list in frontmatter (`- q:` / `a:`). These render as
a visible FAQ section and as `FAQPage` JSON-LD. The visible Q&A helps long-tail /
"People Also Ask" coverage; note Google restricted FAQ *rich results* to gov/health
sites in 2023, so the markup itself rarely produces a SERP enhancement. Keep
answers factual and grounded in the article body.

## 👀 Want to learn more?

Check out [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).

## Credit

This theme is based off of the lovely [Bear Blog](https://github.com/HermanMartinus/bearblog/).
