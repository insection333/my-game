// Part of step 6, in Chromium: a page the browser translates (session 205). Translation puts each text node
// it changes inside <font> elements, and React's next change there threw, so within seconds the whole game
// read "Something broke here". The player three weeks in opens the Hearth, every word is wrapped as the
// browser does, and the page must go on: its lanes ticking, then Skills, Combat and the Storehouse opened
// from the menu (each wrapped again), with no fault and no error.
import { openPage, type Served } from './session.ts';

const PAGES = ['Skills', 'Combat', 'Store', 'Hearth'];

export async function runTranslatedProof(served: Served): Promise<string[]> {
  const problems: string[] = [];
  const page = await openPage('chromium', '/', { viewport: { width: 390, height: 844 } }, 'veteran');
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message.split('\n')[0]));
  const translate = () =>
    page.evaluate(() => {
      const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const nodes: Text[] = [];
      while (walk.nextNode()) nodes.push(walk.currentNode as Text);
      for (const t of nodes) {
        if (!t.nodeValue?.trim() || !t.parentNode || /^(SCRIPT|STYLE)$/.test(t.parentNode.nodeName)) continue;
        const outer = document.createElement('font');
        outer.appendChild(document.createElement('font')).textContent = t.nodeValue;
        t.parentNode.replaceChild(outer, t);
      }
    });
  try {
    await page.goto(`${served.url}/`);
    await page.waitForFunction(() => document.documentElement.dataset.ready === 'true', undefined, { timeout: 15_000 });
    await translate();
    await page.waitForTimeout(3_000);
    for (const name of PAGES) {
      await page.getByRole('link', { name }).first().click({ timeout: 5_000 });
      await page.waitForTimeout(1_000);
      if (await page.getByText('Something broke here').count()) {
        problems.push(`A translated page broke on opening ${name}`);
        break;
      }
      await translate();
      await page.waitForTimeout(1_000);
    }
  } catch (err) {
    problems.push(
      `A translated page could not be played: ${err instanceof Error ? err.message.split('\n')[0] : String(err)}`,
    );
  } finally {
    await page.close();
  }
  for (const e of [...new Set(errors)].slice(0, 2)) problems.push(`A translated page threw: ${e}`);
  return problems;
}
