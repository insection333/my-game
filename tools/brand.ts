// The PNG sizes of the site's icon, made from the built favicon.svg (the game's mark, drawn in
// packages/ui/src/icons/mark.tsx): `pnpm --filter @idle-clash/web build && node tools/brand.ts`.
// Phones want PNGs: a 180 px square for iOS's home screen (on the seal's own dark ground, since iOS
// fills a transparent corner with black), and 192 and 512 px for Android, plus a 512 px maskable one
// whose seal sits inside the safe circle. With --review it also writes a sheet of the mark at the
// sizes it is seen at, on both themes, to judge it.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { ROOT } from './verify/exec.ts';

const svg = readFileSync(join(ROOT, 'apps/web/dist/favicon.svg'), 'utf8');
const src = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
const GROUND = '#1b262b';
const out = (name: string) => join(ROOT, 'apps/web/public', name);

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
const page = await browser.newPage();
async function draw(name: string, size: number, inset: number, ground: string | null) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<body style="margin:0;background:${ground ?? 'transparent'}"><img src="${src}" style="display:block;width:${size - 2 * inset}px;height:${size - 2 * inset}px;margin:${inset}px"></body>`,
  );
  writeFileSync(out(name), await page.screenshot({ omitBackground: !ground }));
}
await draw('icon-180.png', 180, 10, GROUND);
await draw('icon-192.png', 192, 0, null);
await draw('icon-512.png', 512, 0, null);
await draw('icon-maskable-512.png', 512, 64, GROUND);

if (process.argv.includes('--review')) {
  const row = (bg: string) =>
    `<div style="display:flex;gap:24px;align-items:center;padding:24px;background:${bg}">${[16, 24, 32, 48, 96, 180]
      .map((s) => `<img src="${src}" width="${s}" height="${s}">`)
      .join('')}</div>`;
  await page.setViewportSize({ width: 560, height: 480 });
  await page.setContent(`<body style="margin:0">${row('#e4e9e3')}${row('#121b1f')}</body>`);
  await page.screenshot({ path: join(ROOT, '.verify/review/mark.png'), fullPage: true });
}
await browser.close();
