import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { siteIcon } from './brand.tsx';
import { oldBrowserHtml, oldBrowserJs } from './src/old-browser.ts';

/** A browser too old for the game, or with scripts off, is told so (session 207): a classic script before
 *  the game's own, and a line for scripts off. */
const oldBrowser = (): Plugin => ({
  name: 'old-browser',
  transformIndexHtml: (html) =>
    html.replace(/(\s*)<script type="module"/, `$1${oldBrowserHtml()}$1<script type="module"`),
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'old-browser.js', source: oldBrowserJs() });
  },
  configureServer(server) {
    server.middlewares.use('/old-browser.js', (_req, res) => {
      res.setHeader('content-type', 'text/javascript');
      res.end(oldBrowserJs());
    });
  },
});

/** Asks for the three typefaces at once, beside the script, rather than after the first render. */
const preloadFonts = (): Plugin => ({
  name: 'preload-fonts',
  transformIndexHtml: {
    order: 'post',
    handler: (_html, ctx) =>
      Object.keys(ctx.bundle ?? {})
        .filter((file) => /latin-\d00-normal-[\w-]+\.woff2$/.test(file))
        .map((file) => ({
          tag: 'link',
          attrs: { rel: 'preload', as: 'font', type: 'font/woff2', crossorigin: '', href: `/${file}` },
          injectTo: 'head' as const,
        })),
  },
});

export default defineConfig({
  plugins: [react(), preloadFonts(), siteIcon(), oldBrowser()],
  // In development the page asks the server (pnpm --filter @idle-clash/server start) for the game.
  server: { proxy: { '/api': { target: 'http://127.0.0.1:3000', ws: true } } },
  build: {
    target: 'es2022',
    rollupOptions: { input: { index: 'index.html', review: 'review.html' } },
  },
});
