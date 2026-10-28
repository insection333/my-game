// Step 7, accessibility: axe on every view at every width (in Chromium; the rules do not depend on
// the engine). Step 8, performance: page weight, time to usable on a throttled phone, idle CPU.
import { AxeBuilder } from '@axe-core/playwright';
import { browser, ensureServer, height, newcomer, openPage, viewUrl, views, WIDTHS } from './session.ts';

export async function runAxe(): Promise<{ problems: string[]; checks: number }> {
  const { url } = await ensureServer();
  const problems: string[] = [];
  let checks = 0;
  for (const width of WIDTHS) {
    for (const view of views()) {
      // axe needs a page of its own context, which openPage gives.
      const page = await openPage('chromium', view.path, { viewport: { width, height: height(width) } }, view.as);
      // Reduced motion from the start, so contrast is read on what settles on screen, not on a frame
      // of a fade (the gains feed and moments come and go while a lane works).
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(viewUrl(url, view.path));
      await page.waitForFunction(() => document.documentElement.dataset.ready === 'true', undefined, {
        timeout: 15_000,
      });
      // The fire lit, so its burning badge (its time and its heat) is read too, not only "Stoke".
      const fire = page.locator('[data-ui="FireBadge"][data-state="out"]');
      // A newcomer's tour may sit over the badge; it stays (axe reads it too), and the click goes through.
      if (await fire.count()) await fire.click({ force: true });
      for (const scheme of ['light', 'dark'] as const) {
        await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
        // Two frames for the new theme's colours to reach every element before axe reads them.
        await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
        const result = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
          .analyze();
        checks++;
        for (const v of result.violations) {
          const where = v.nodes
            .slice(0, 3)
            .map((n) => n.target.join(' '))
            .join(', ');
          // What axe measured (for contrast: the two colours and their ratio), so a failure seen only
          // on GitHub Actions can be read from its log.
          const why = v.nodes[0]?.any[0]?.message ?? '';
          problems.push(
            `${width}px ${scheme} ${view.path}: ${v.id} (${v.impact ?? 'minor'}): ${v.help} at ${where}${why ? ` (${why})` : ''}`,
          );
        }
      }
      await page.close();
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

  // Page weight: every byte the first page needs, as it crossed the network. The first page is what a
  // visitor who is not signed in sees: the welcome page. A mid-range phone on a middling connection:
  // four times slower CPU, 1.6 Mb/s down, 150 ms away, nothing cached. The browser's own first start
  // is not the page's cost, so one load warms it up; the time is the median of the next three.
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  let received = 0;
  cdp.on('Network.loadingFinished', (e) => (received += e.encodedDataLength));
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150,
    downloadThroughput: 200_000,
    uploadThroughput: 94_000,
  });
  const loads: { ms: number; bytes: number }[] = [];
  for (let i = 0; i < 4; i++) {
    received = 0;
    const start = Date.now();
    await page.goto(served.url + '/');
    await page.waitForFunction(() => document.documentElement.dataset.ready === 'true', undefined, {
      timeout: 30_000,
    });
    loads.push({ ms: Date.now() - start, bytes: received });
  }
  const timed = loads.slice(1).sort((a, b) => a.ms - b.ms);
  const usableMs = timed[1].ms;
  const bytes = Math.max(...loads.map((l) => l.bytes));
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

  // Idle CPU: main-thread time while nothing is pressed, resting and with a lane at work. The middle
  // of three 5-second windows, so a lasting cost counts and a one-off pause (a collection) does not.
  const busy = async () => {
    await cdp.send('Performance.enable');
    const read = async () =>
      (await cdp.send('Performance.getMetrics')).metrics.find((m) => m.name === 'TaskDuration')!.value;
    const windows: number[] = [];
    for (let i = 0; i < 3; i++) {
      const t0 = await read();
      await page.waitForTimeout(5000);
      windows.push(((await read()) - t0) / 5);
    }
    return windows.sort((a, b) => a - b)[1];
  };
  await page.waitForTimeout(1000);
  const idleBusy = await busy();
  // A player of its own, so the lane it starts changes no other step's newcomer.
  await ctx.addCookies([{ ...(await newcomer(served.url, 'Perf runner')), url: served.url }]);
  await page.goto(`${served.url}/skills/woodcutting`);
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
