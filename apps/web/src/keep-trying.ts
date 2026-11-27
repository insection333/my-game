/** How often a page that cannot reach the server tries again by itself. */
export const TRY_EVERY_MS = 5000;

/** Tries again every few seconds and as soon as the device is back on a network, until the returned function
 *  lets it go: the inbox's (session 118) and, from session 283, the page's own first read, where a player
 *  opening the game while a deploy restarted the server had to press Try again however soon it was back. */
export function keepTrying(again: () => unknown, random: () => number = Math.random): () => void {
  // One try at a time: a try still waiting on the server (up to half a minute, session 282) is not doubled.
  let trying = false;
  const once = () => {
    if (trying) return;
    trying = true;
    void Promise.resolve(again())
      .catch(() => undefined)
      .finally(() => (trying = false));
  };
  // Each wait is the pause give or take half (session 288): pages that lost the server together (a deploy)
  // come back apart, where they came back in one wave that held the server's one thread for seconds.
  let timer: ReturnType<typeof setTimeout> | undefined;
  const next = () => (timer = setTimeout(() => (once(), next()), TRY_EVERY_MS * (0.5 + random())));
  next();
  window.addEventListener('online', once);
  return () => {
    clearTimeout(timer);
    window.removeEventListener('online', once);
  };
}
