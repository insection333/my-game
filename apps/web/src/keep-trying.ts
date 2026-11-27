/** How often a page that cannot reach the server tries again by itself. */
export const TRY_EVERY_MS = 5000;

/** Tries again every few seconds and as soon as the device is back on a network, until the returned function
 *  lets it go: the inbox's (session 118) and, from session 283, the page's own first read, where a player
 *  opening the game while a deploy restarted the server had to press Try again however soon it was back. */
export function keepTrying(again: () => unknown): () => void {
  // One try at a time: a try still waiting on the server (up to half a minute, session 282) is not doubled.
  let trying = false;
  const once = () => {
    if (trying) return;
    trying = true;
    void Promise.resolve(again())
      .catch(() => undefined)
      .finally(() => (trying = false));
  };
  const every = setInterval(once, TRY_EVERY_MS);
  window.addEventListener('online', once);
  return () => {
    clearInterval(every);
    window.removeEventListener('online', once);
  };
}
