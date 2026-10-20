// Step 6: every view at 320, 390 and 1,440 px in Chromium, Firefox and WebKit. Each is saved as a
// screenshot and measured: overflow, tap sizes, one design system, density, the menu, and the
// slots IA.md says must be visible without scrolling.
import type { Feature } from '@idle-clash/features';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { SHELL_SLOTS } from '../../../apps/web/src/shell-slots.ts';
import { measurePage } from './measure.ts';
import {
  ENGINES,
  ensureServer,
  height,
  OUT,
  openPage,
  viewUrl,
  views,
  WIDTHS,
  type Engine,
  type View,
} from './session.ts';

export interface ScreensResult {
  problems: string[];
  shots: number;
  /** Slots IA.md expects that no built feature fills yet. */
  awaiting: Set<string>;
}

export async function runScreens(features: readonly Feature[]): Promise<ScreensResult> {
  const { url } = await ensureServer();
  const filled = new Set<string>([...SHELL_SLOTS, ...features.flatMap((f) => Object.keys(f.slots))]);
  const all = views();
  const awaiting = new Set<string>();
  let shots = 0;

  const one = async (engine: Engine, width: number, view: View): Promise<string[]> => {
    const page = await openPage(engine, view.path, { viewport: { width, height: height(width) } });
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(`script error: ${e.message}`));
    try {
      await page.goto(viewUrl(url, view.path));
      await page.waitForFunction(() => document.documentElement.dataset.ready === 'true', undefined, {
        timeout: 15_000,
      });
      const dir = join(OUT, 'shots', engine, String(width));
      mkdirSync(dir, { recursive: true });
      await page.screenshot({ path: join(dir, `${view.name}.png`), fullPage: true });
      shots++;
      const m = await page.evaluate(measurePage);
      const problems = [...errors, ...m.problems];
      const spec = width === 390 ? view.phone : width === 1440 ? view.desktop : [];
      for (const slot of spec) {
        if (!filled.has(slot)) {
          awaiting.add(slot);
          continue;
        }
        const at = m.slots[slot];
        if (!at || !at.shown) problems.push(`slot "${slot}" is missing from the page`);
        else if (at.top > at.limit - 24)
          problems.push(`slot "${slot}" starts at ${Math.round(at.top)}px, below the fold (${Math.round(at.limit)}px)`);
      }
      return problems.map((p) => `${engine} ${width}px ${view.path}: ${p}`);
    } catch (err) {
      return [
        `${engine} ${width}px ${view.path}: could not open the page (${err instanceof Error ? err.message.split('\n')[0] : String(err)})`,
      ];
    } finally {
      await page.close();
    }
  };

  const perEngine = await Promise.all(
    ENGINES.map(async (engine) => {
      const out: string[] = [];
      for (const width of WIDTHS) for (const view of all) out.push(...(await one(engine, width, view)));
      return out;
    }),
  );
  return { problems: perEngine.flat(), shots, awaiting };
}
