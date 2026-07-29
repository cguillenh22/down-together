import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Dominio propio (downtogether.org) servido vía GitHub Pages.
// El archivo public/CNAME le dice a GitHub Pages qué dominio usar.
export default defineConfig({
  site: 'https://downtogether.org',
  base: '/',
  outDir: './dist',
  integrations: [sitemap()],
});
