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

> These are baked at **build time** by Astro, so set them before `npm run build`
> / deploy. Re-deploy after changing them.

### Social share image

`public/og-default.png` (1200×630) is the default share card. Regenerate it with
`node scripts/generate-og.mjs` (uses `sharp`; run locally, not in CI — Workers
has no native bindings). Posts can override it via an `image:` frontmatter field.

## 👀 Want to learn more?

Check out [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).

## Credit

This theme is based off of the lovely [Bear Blog](https://github.com/HermanMartinus/bearblog/).
