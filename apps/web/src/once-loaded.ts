/** A part of the page fetched once, the first time anything asks (session 280): a fetch that failed (offline,
 *  the server restarting for a deploy) is let go, so the next ask fetches it again, where it was kept and every
 *  sign-in after it failed until the page was reloaded by hand. */
export function onceLoaded<T>(load: () => Promise<T>): () => Promise<T> {
  let held: Promise<T> | null = null;
  return () =>
    (held ??= load().catch((err: unknown) => {
      held = null;
      throw err;
    }));
}
