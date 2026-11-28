// Lines said aloud (session 299). A live region reads out what changes inside it once it stands, so a line drawn
// whole as it came ("Sent. Thank you.", a castle's refusal, a report sent) was read by some screen readers and
// not others. Such a line carries `data-said`; the page watches for one appearing or changing and says its words
// through one region that stands from the page's first moment (awake behind a sheet, `data-awake`).
const LINE = '[data-said]';
/** A line said again within this long is said once (a page drawing again, two lines of the same words). */
const ONCE_MS = 1_000;

let region: HTMLElement | null = null;
let last = { text: '', at: 0 };

function say(text: string): void {
  if (!region) return;
  const now = Date.now();
  if (text === last.text && now - last.at < ONCE_MS) return;
  last = { text, at: now };
  // Emptied first, so words said before are said again.
  region.textContent = '';
  const into = region;
  setTimeout(() => (into.textContent = text), 50);
}

export function sayLines(): void {
  if (typeof document === 'undefined' || typeof MutationObserver === 'undefined' || region) return;
  region = document.createElement('div');
  region.setAttribute('aria-live', 'polite');
  region.setAttribute('data-awake', '');
  region.setAttribute('data-said-aloud', '');
  region.className = 'visually-hidden';
  document.body.appendChild(region);
  const heard = new WeakMap<Element, string>();
  new MutationObserver((records) => {
    const lines = new Set<Element>();
    for (const r of records) {
      const at = r.target.nodeType === Node.ELEMENT_NODE ? (r.target as Element) : r.target.parentElement;
      const line = at?.closest(LINE);
      if (line) lines.add(line);
      for (const added of Array.from(r.addedNodes)) {
        if (added.nodeType !== Node.ELEMENT_NODE) continue;
        const el = added as Element;
        if (el.matches(LINE)) lines.add(el);
        for (const inner of Array.from(el.querySelectorAll(LINE))) lines.add(inner);
      }
    }
    for (const line of lines) {
      const text = (line.textContent ?? '').trim();
      if (!text || heard.get(line) === text || line.closest('[inert]')) continue;
      heard.set(line, text);
      say(text);
    }
  }).observe(document.body, { childList: true, subtree: true, characterData: true });
}
