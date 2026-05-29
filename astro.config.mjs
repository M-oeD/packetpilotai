// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
    site: 'https://packetpilotai.com',
    integrations: [
        mdx(),
        // Keep the noindex 404 out of the sitemap to avoid a
        // "noindex URL submitted in sitemap" conflict in Search Console.
        sitemap({ filter: (page) => !page.endsWith('/404/') && !page.endsWith('/404') }),
        react(),
    ],
    adapter: cloudflare(),
});