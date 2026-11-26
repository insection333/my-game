// Reading the server again while the page is seen (session 273): Hiscores and Castle Clash read every minute,
// and a tab left open out of sight went on reading for as long as it stayed open. Out of sight, nothing is
// read; seen again, it reads at once.

/** Calls `read` every `ms` while the page is seen, and as it is seen again; answers the way to stop. */
export function whileSeen(read: () => void, ms: number): () => void {
  const tick = () => {
    if (!document.hidden) read();
  };
  const every = setInterval(tick, ms);
  document.addEventListener('visibilitychange', tick);
  return () => {
    clearInterval(every);
    document.removeEventListener('visibilitychange', tick);
  };
}
