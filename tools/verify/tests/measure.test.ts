// The layout checks, held to a page built to break each rule once, and to one that breaks none.
import { afterAll, describe, expect, it } from 'vitest';
import { measurePage } from '../web/measure.ts';
import { browser, closeSession } from '../web/session.ts';

afterAll(closeSession);

async function measure(body: string, width = 390) {
  const b = await browser('chromium');
  const page = await b.newPage({ viewport: { width, height: 844 } });
  await page.setContent(`<!doctype html><style>body{margin:0;font:16px sans-serif}</style><body>${body}</body>`);
  const m = await page.evaluate(measurePage);
  await page.close();
  return m;
}

describe('measurePage', () => {
  it('passes a page that keeps every rule', async () => {
    const m = await measure(`<main data-main><div style="padding:16px">
      <section data-section><p>One</p><p>Two</p><p>Three</p></section>
      <button data-ui="Button" data-variant="primary" style="height:44px">Start</button>
      <button data-ui="Button" data-variant="primary" style="height:44px">Stop</button></div></main>`);
    expect(m.problems).toEqual([]);
  }, 30_000);

  it('finds each broken rule', async () => {
    const m = await measure(`<main data-main><div style="padding:16px">
      <section data-section><p>Only one line, across the whole page</p></section>
      <div style="width:600px">Too wide</div>
      <button style="height:44px">No data-ui</button>
      <button data-ui="Button" style="width:20px;height:20px">x</button>
      <button data-ui="Chip" style="height:30px;color:red">A</button>
      <button data-ui="Chip" style="height:30px;color:blue">B</button>
      <nav data-menu>${'<a href="#" data-ui="MenuLink" style="display:inline-block;min-height:44px">m</a>'.repeat(7)}</nav>
      </div></main>`);
    const text = m.problems.join('\n');
    expect(text).toContain('The page scrolls sideways');
    expect(text).toContain('runs off the screen');
    expect(text).toContain('button "No data-ui" is not drawn by the design system');
    expect(text).toContain('under the 24px tap size');
    expect(text).toContain('(one control, two ways)');
    expect(text).toContain('The menu has 7 entries; at most 6');
    expect(text).toContain('A full-width section holds only 1 line(s)');
  }, 30_000);

  it('reports where each slot starts and what bars cover the bottom', async () => {
    const m =
      await measure(`<div data-slot="a.top">top</div><div style="height:2000px"></div><div data-slot="a.low">low</div>
      <nav data-menu style="position:fixed;bottom:0;left:0;right:0;height:56px"></nav>`);
    expect(m.slots['a.top'].top).toBe(0);
    expect(m.slots['a.low'].top).toBeGreaterThan(2000);
    expect(m.visibleBottom).toBe(844 - 56);
  }, 30_000);
});
