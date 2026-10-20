// Step 7, accessibility: axe on every view at every width (in Chromium; the rules do not depend on
// the engine). Step 8, performance: page weight, time to usable on a throttled phone, idle CPU.
import { AxeBuilder } from '@axe-core/playwright';
import { browser, ensureServer, height, viewUrl, views, WIDTHS } from './session.ts';

export async function runAxe(): Promise<{ problems: string[]; checks: number }> {
  const { url } = await ensureServer();
  const b = await browser('chromium');
  const problems: string[] = [];
  let checks = 0;
  for (const width of WIDTHS) {
    for (const view of views()) {
      const ctx = await b.newContext({ viewport: { width, height: height(width) } });
      const page = await ctx.newPage();
      await page.goto(viewUrl(url, view.path));
      await page.waitForFunction(() => document.documentElement.dataset.ready === 'true', undefined, {
        timeout: 15_000,
      });
      for (const scheme of ['light', 'dark'] as const) {
        await page.emulateMedia({ colorScheme: scheme });
        const result = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
          .analyze();
        checks++;
        for (const v of result.violations) {
          const where = v.nodes
            .slice(0, 3)
            .map((n) => n.target.join(' '))
            .join(', ');
          problems.push(`${width}px ${scheme} ${view.path}: ${v.id} (${v.impact ?? 'minor'}): ${v.help} at ${where}`);
        }
      }
      await ctx.close();
    }
  }
  return { problems: [...new Set(problems)], checks };
}

/** The budgets from the brief. */
export const BUDGET = { firstPageBytes: 250 * 1024, usableMs: 2000, idleBusy: 0.02 };

export interface PerfResult {
  problems: string[];
  bytes: number;
  usableMs: number;
  idleBusy: number;
  runningBusy: number;
}

export async function runPerf(): Promise<PerfResult> {
  const served = await ensureServer();
  const b = await browser('chromium');
  const problems: string[] = [];

  // Page weight: every byte the first page needs, as compressed by the server.
  served.sent.clear();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  // A mid-range phone on a middling connection: four times slower CPU, 1.6 Mb/s down, 150 ms away.
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150,
    downloadThroughput: 200_000,
    uploadThroughput: 94_000,
  });
  const start = Date.now();
  await page.goto(served.url + '/');
  await page.waitForFunction(() => document.documentElement.dataset.ready === 'true', undefined, { timeout: 30_000 });
  const usableMs = Date.now() - start;
  const bytes = [...served.sent.values()].reduce((a, n) => a + n, 0);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 0,
    downloadThroughput: -1,
    uploadThroughput: -1,
  });
  if (bytes > BUDGET.firstPageBytes)
    problems.push(
      `The first page weighs ${Math.round(bytes / 1024)} KB compressed; the budget is ${BUDGET.firstPageBytes / 1024} KB`,
    );
  if (usableMs > BUDGET.usableMs)
    problems.push(
      `The first page took ${usableMs} ms to be usable on a throttled phone; the budget is ${BUDGET.usableMs} ms`,
    );

  // Idle CPU: main-thread time while nothing is pressed, resting and with a lane at work.
  const busy = async () => {
    await cdp.send('Performance.enable');
    const read = async () =>
      (await cdp.send('Performance.getMetrics')).metrics.find((m) => m.name === 'TaskDuration')!.value;
    const t0 = await read();
    await page.waitForTimeout(5000);
    return ((await read()) - t0) / 5;
  };
  await page.waitForTimeout(1000);
  const idleBusy = await busy();
  await page.goto(`${served.url}/skills/woodcutting?features=all`);
  await page.waitForFunction(() => document.documentElement.dataset.ready === 'true');
  await page.getByRole('button', { name: 'Start' }).first().click();
  await page.waitForTimeout(1000);
  const runningBusy = await busy();
  for (const [what, v] of [
    ['resting', idleBusy],
    ['with a lane at work', runningBusy],
  ] as const) {
    if (v > BUDGET.idleBusy)
      problems.push(
        `The page keeps the CPU ${(v * 100).toFixed(1)}% busy ${what}; the budget is ${BUDGET.idleBusy * 100}%`,
      );
  }
  await ctx.close();
  return { problems, bytes, usableMs, idleBusy, runningBusy };
}
