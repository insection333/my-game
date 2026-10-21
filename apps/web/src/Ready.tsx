// Usable: the first real page has drawn, the data it asked for has come, and the fonts are in.
// Verify's speed budget and its screenshots wait for this.
import { useEffect } from 'react';

const pending = new Set<Promise<unknown>>();

/** A page's first load of its own data (the hiscores): the page is not usable until it arrives. */
export function untilLoaded<T>(p: Promise<T>): Promise<T> {
  const settled = p.then(
    () => undefined,
    () => undefined,
  );
  pending.add(settled);
  void settled.then(() => pending.delete(settled));
  return p;
}

export function Ready() {
  useEffect(() => {
    requestAnimationFrame(() => {
      void Promise.all([...pending])
        .then(() => document.fonts.ready)
        .then(() => (document.documentElement.dataset.ready = 'true'));
    });
  }, []);
  return null;
}
