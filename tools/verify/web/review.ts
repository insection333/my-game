// Step 9: the review sheets. Every view at its three widths beside its page's spec from IA.md, and
// every icon at 24, 48 and 96 px on both themes. Written to .verify/review/ for a person to read;
// the step fails if a view has no screenshot or the icon sheet cannot be drawn.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../exec.ts';
import { browser, ensureServer, OUT, views, WIDTHS } from './session.ts';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** A page's own part of IA.md, from its ### heading to the next. */
function specOf(page: string): string {
  const md = readFileSync(join(ROOT, 'IA.md'), 'utf8');
  const start = md.indexOf(`### ${page}`);
  if (start < 0) return '';
  const end = md.indexOf('\n### ', start + 4);
  const end2 = md.indexOf('\n## ', start + 4);
  const stop = [end, end2].filter((n) => n > 0).sort((a, b) => a - b)[0];
  return md.slice(start, stop);
}

export async function runReview(): Promise<{ problems: string[]; sheets: number }> {
  const dir = join(OUT, 'review');
  mkdirSync(dir, { recursive: true });
  const problems: string[] = [];
  const blocks: string[] = [];
  for (const v of views()) {
    const imgs = WIDTHS.map((w) => {
      const rel = `../shots/chromium/${w}/${v.name}.png`;
      if (!existsSync(join(dir, rel))) problems.push(`No ${w}px screenshot of ${v.path}: run step 6 first`);
      return `<figure><figcaption>${w} px</figcaption><img src="${rel}" alt="${esc(v.path)} at ${w} px" width="${w === 1440 ? 720 : w}"></figure>`;
    });
    blocks.push(
      `<section><h2>${esc(v.path)} <small>${esc(v.page)}</small></h2><div class="row">${imgs.join('')}<pre>${esc(specOf(v.page))}</pre></div></section>`,
    );
  }

  const { url } = await ensureServer();
  const page = await (await browser('chromium')).newPage({ viewport: { width: 1400, height: 900 } });
  try {
    await page.goto(`${url}/review.html`);
    await page.waitForFunction(() => document.documentElement.dataset.ready === 'true', undefined, { timeout: 15_000 });
    const icons = await page.locator('[data-ui="ItemIcon"]').count();
    if (icons === 0) problems.push('The icon sheet drew no icons');
    await page.screenshot({ path: join(dir, 'icons.png'), fullPage: true });
  } catch (err) {
    problems.push(`The icon sheet failed: ${err instanceof Error ? err.message.split('\n')[0] : String(err)}`);
  } finally {
    await page.close();
  }

  writeFileSync(
    join(dir, 'index.html'),
    `<!doctype html><meta charset="utf-8"><title>Idle Clash review sheets</title>
<style>body{font:14px system-ui;margin:24px;background:#eef1ec}section{margin-bottom:48px}.row{display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap}
figure{margin:0}img{border:1px solid #c5cec7;display:block}pre{flex:1;min-width:320px;white-space:pre-wrap;background:#fff;padding:12px;border:1px solid #c5cec7}small{color:#667}</style>
<h1>Idle Clash review sheets</h1><p>Every view in Chromium at 320, 390 and 1,440 px, beside its spec in IA.md. Icons: <a href="icons.png">icons.png</a>.</p>
${blocks.join('\n')}`,
  );
  return { problems, sheets: blocks.length };
}
