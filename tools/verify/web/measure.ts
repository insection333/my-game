// Runs inside the page: measures overflow, tap sizes, controls drawn outside the design system or
// two ways, the menu, density, and where each slot sits. Self-contained, since Playwright sends
// its source to the browser.

export interface Measured {
  problems: string[];
  /** For each data-slot on the page: whether it shows and how far down it starts. */
  /** `limit`: where the screen's visible part ends for it (a sheet covers the bars). */
  slots: Record<string, { shown: boolean; top: number; limit: number }>;
  /** The lowest point of the screen not covered by bars held at the bottom. */
  visibleBottom: number;
}

export function measurePage(): Measured {
  const problems: string[] = [];
  const W = window.innerWidth;
  const H = window.innerHeight;
  const shown = (el: Element) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0;
  };
  const describe = (el: Element) => {
    const ui = el.getAttribute('data-ui');
    const text = (el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 30);
    return `${el.tagName.toLowerCase()}${ui ? `[${ui}]` : ''} "${text}"`;
  };
  const hidden = (el: Element) => el.closest('.visually-hidden') !== null;

  // Nothing scrolls sideways, and nothing pokes out of the screen.
  if (document.documentElement.scrollWidth > W + 1) {
    problems.push(`The page scrolls sideways (${document.documentElement.scrollWidth}px wide at ${W}px)`);
  }
  for (const el of Array.from(document.body.querySelectorAll('*'))) {
    if (!shown(el) || hidden(el)) continue;
    // Inside a drawing, the drawing's own frame clips what runs past it (a cropped scene); the
    // drawing itself is still measured.
    if (el instanceof SVGElement && el.ownerSVGElement) continue;
    // Words are never cut off: text set to end in "…" when it runs out of room must have the room.
    const ts = getComputedStyle(el);
    const clamp = ts.getPropertyValue('-webkit-line-clamp');
    if (
      (ts.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth + 1) ||
      (clamp && clamp !== 'none' && (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1))
    )
      problems.push(`${describe(el)} is cut short with "…"`);
    const r = el.getBoundingClientRect();
    if (r.right > W + 1 || r.left < -1) {
      // Inside a box that scrolls sideways (a wide table), it can be reached; a box that merely hides
      // its overflow (the shell's frame) cuts it off, which is as bad as running off the screen.
      let scrolls = false;
      for (let p = el.parentElement; p; p = p.parentElement) {
        const o = getComputedStyle(p).overflowX;
        if (o === 'auto' || o === 'scroll') scrolls = true;
      }
      if (!scrolls && getComputedStyle(el).position !== 'fixed') problems.push(`${describe(el)} runs off the screen`);
    }
    // Nothing is cut off by its own box: a box that hides what overflows it (a panel, a card) must
    // hold everything in it. Inside a box that scrolls, it can be reached (and is judged below).
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const o = getComputedStyle(p).overflowX;
      if (o === 'auto' || o === 'scroll') break;
      if (o === 'hidden' || o === 'clip') {
        const pr = p.getBoundingClientRect();
        if (r.width > 0 && (r.right > pr.right + 1 || r.left < pr.left - 1))
          problems.push(`${describe(el)} is cut off by its box, ${describe(p)}`);
        break;
      }
    }
    // A strip that scrolls sideways hides part of itself on a phone; only a box marked to scroll (a
    // wide table) may. Everything else is laid out to fit.
    if (
      (ts.overflowX === 'auto' || ts.overflowX === 'scroll') &&
      el.scrollWidth > el.clientWidth + 1 &&
      !el.closest('[data-scrolls]')
    )
      problems.push(`${describe(el)} scrolls sideways: what it holds does not fit`);
  }

  // Controls: drawn by the design system, large enough to tap, and drawn one way.
  const controls = Array.from(document.querySelectorAll('a[href], button, input, select, textarea, [role="button"]'));
  const groups = new Map<string, { style: string; el: Element }>();
  for (const el of controls) {
    if (!shown(el) || hidden(el) || (el as HTMLElement).getBoundingClientRect().top < -50) continue;
    const ui = el.getAttribute('data-ui');
    if (!ui) problems.push(`${describe(el)} is not drawn by the design system (no data-ui)`);
    const r = el.getBoundingClientRect();
    if (r.width < 24 || r.height < 24)
      problems.push(`${describe(el)} is ${Math.round(r.width)}x${Math.round(r.height)}px, under the 24px tap size`);
    const cs = getComputedStyle(el);
    const key = [
      ui,
      el.getAttribute('data-variant'),
      el.getAttribute('data-state'),
      el.getAttribute('data-idle'),
      el.getAttribute('aria-current'),
      (el as HTMLButtonElement).disabled,
    ].join('|');
    // Rows grow with what they hold and are divided from the row above; every other control has one
    // height and one border.
    const row = ui === 'RowLink' || ui === 'ItemTile';
    const style = [
      cs.fontFamily,
      cs.fontSize,
      cs.fontWeight,
      cs.borderTopLeftRadius,
      cs.backgroundColor,
      cs.color,
      row ? '' : cs.borderTopColor,
      row ? '' : cs.borderTopWidth,
      row ? '' : Math.round(r.height),
    ].join('|');
    const seen = groups.get(key);
    if (!seen) groups.set(key, { style, el });
    else if (seen.style !== style)
      problems.push(`${describe(el)} is drawn differently from ${describe(seen.el)} (one control, two ways)`);
  }

  const menus = Array.from(document.querySelectorAll('[data-menu]'));
  for (const m of menus) {
    const n = m.querySelectorAll('a[href]').length;
    if (n > 6) problems.push(`The menu has ${n} entries; at most 6`);
  }

  // Density: no full-width section that holds only a line or two; no big empty gaps.
  const main = document.querySelector('[data-main] > *');
  const mainWidth = main ? main.getBoundingClientRect().width - parseFloat(getComputedStyle(main).paddingLeft) * 2 : W;
  const lines = (el: Element) => {
    const tops = new Set<number>();
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      if (!n.textContent?.trim() || hidden(n.parentElement!)) continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      for (const r of Array.from(range.getClientRects())) if (r.height > 0) tops.add(Math.round(r.top / 4));
    }
    return tops.size;
  };
  const sections = Array.from(document.querySelectorAll('[data-section]')).filter(shown);
  sections.forEach((sec, i) => {
    const r = sec.getBoundingClientRect();
    if (r.width >= mainWidth * 0.9 && lines(sec) <= 2)
      problems.push(`A full-width section holds only ${lines(sec)} line(s): ${describe(sec)}`);
    const next = sections[i + 1];
    if (next) {
      const gap = next.getBoundingClientRect().top - r.bottom;
      if (gap > 40) problems.push(`${gap}px of empty space between sections`);
    }
  });

  // Where each slot sits; bars held at the bottom of the screen hide what is under them.
  let visibleBottom = H;
  for (const el of Array.from(document.querySelectorAll('[data-menu], [data-strip]'))) {
    const r = el.getBoundingClientRect();
    if (shown(el) && r.bottom >= H - 1 && r.top > H / 2) visibleBottom = Math.min(visibleBottom, r.top);
  }
  const strip = document.querySelector('[data-strip]');
  if (strip && shown(strip)) {
    const r = strip.getBoundingClientRect();
    if (r.top > H / 2) visibleBottom = Math.min(visibleBottom, r.top);
  }
  // The frame: inside the shell the page area alone scrolls, ends where the bars begin, and no box
  // in it is taller than the area itself (a long list scrolls inside its own box).
  const area = document.querySelector('[data-main]');
  if (area && shown(area)) {
    if (document.documentElement.scrollHeight > H + 1)
      problems.push(
        `The whole page scrolls (${document.documentElement.scrollHeight}px at ${H}px); only the page area may`,
      );
    const a = area.getBoundingClientRect();
    if (a.bottom > visibleBottom + 1)
      problems.push(`The page area runs ${Math.round(a.bottom - visibleBottom)}px under the bars at the bottom`);
    for (const box of Array.from(area.querySelectorAll('[data-ui="Panel"]'))) {
      const h = box.getBoundingClientRect().height;
      if (shown(box) && h > a.height)
        problems.push(`${describe(box)} is ${Math.round(h)}px tall in a ${Math.round(a.height)}px page area`);
    }
  }

  const slots: Measured['slots'] = {};
  for (const el of Array.from(document.querySelectorAll('[data-slot]'))) {
    const id = el.getAttribute('data-slot')!;
    const vis = shown(el);
    const top = el.getBoundingClientRect().top;
    const limit = el.closest('[role="dialog"]') ? H : visibleBottom;
    if (!slots[id] || (vis && (!slots[id].shown || top < slots[id].top))) slots[id] = { shown: vis, top, limit };
  }
  return { problems: [...new Set(problems)], slots, visibleBottom };
}
