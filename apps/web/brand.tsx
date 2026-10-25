// The site's icon, drawn from the game's mark (FireSeal in packages/ui) when the page is built, so
// the browser tab, the home screen and the page share one drawing. The PNG sizes phones ask for are
// made from it by `node tools/brand.ts` and kept in public/.
// A relative path: Vite bundles the drawing into its config rather than asking Node to load .tsx.
import { FireSeal } from '../../packages/ui/src/icons/mark.tsx';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Plugin } from 'vite';

export const markSvg = (): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">${renderToStaticMarkup(<FireSeal />)}</svg>\n`;

export const siteIcon = (): Plugin => ({
  name: 'site-icon',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'favicon.svg', source: markSvg() });
  },
  configureServer(server) {
    server.middlewares.use('/favicon.svg', (_req, res) => {
      res.setHeader('content-type', 'image/svg+xml');
      res.end(markSvg());
    });
  },
});
