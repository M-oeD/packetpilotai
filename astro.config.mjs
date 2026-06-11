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
    vite: {
        // Astro 6 + @astrojs/cloudflare dev-SSR bug (withastro/astro#16529):
        // Vite optimizes `react` and `react-dom/server` in separate passes, so
        // react-dom/server ends up holding a React whose hook dispatcher is null
        // → "Invalid hook call / useState of null" on every island in dev.
        // Fix: force all React island deps into ONE eager pre-bundle pass
        // (client + SSR) so they share a single React instance. Prod unaffected.
        optimizeDeps: {
            include: ['react', 'react-dom', 'react-dom/client', 'react-dom/server', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
        },
        ssr: {
            optimizeDeps: {
                include: ['react', 'react-dom', 'react-dom/server', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
            },
        },
        resolve: {
            dedupe: ['react', 'react-dom'],
        },
    },
});