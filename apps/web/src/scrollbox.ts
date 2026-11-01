// Lists that scroll inside their own box (`data-scrollbox`): each is marked with which edges have more
// beyond them (`data-above`, `data-below`), and base.css fades the rows out at those edges, so a row
// the edge cuts reads as more to come. Watched once for the whole page: a box is marked when it
// scrolls, when it or its rows change size, and when a page draws a new one.

/** Which edges of a box have rows beyond them (a pixel's slack for rounding). */
export function edges(top: number, height: number, full: number): { above: boolean; below: boolean } {
  return { above: top > 1, below: top + height < full - 1 };
}

function mark(box: Element) {
  const { above, below } = edges(box.scrollTop, box.clientHeight, box.scrollHeight);
  box.toggleAttribute('data-above', above);
  box.toggleAttribute('data-below', below);
}

export function watchScrollboxes(doc: Document = document): void {
  const sized = new ResizeObserver((entries) => entries.forEach((e) => mark(e.target)));
  const seen = new WeakSet<Element>();
  let queued = false;
  // Rows come and go as the game draws (a tier opened, a relic raised): mark every box once a frame.
  const all = () => {
    queued = false;
    for (const box of Array.from(doc.querySelectorAll('[data-scrollbox]'))) {
      if (!seen.has(box)) {
        seen.add(box);
        sized.observe(box);
      }
      mark(box);
    }
  };
  const soon = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(all);
  };
  doc.addEventListener(
    'scroll',
    (e) => {
      if (e.target instanceof Element && e.target.hasAttribute('data-scrollbox')) mark(e.target);
    },
    { capture: true, passive: true },
  );
  new MutationObserver(soon).observe(doc.body, { childList: true, subtree: true });
  soon();
}
