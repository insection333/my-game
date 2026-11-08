// Rank-ups (session 49; the owner's first phase of 3 November asked for feedback on rank-ups). A climb on
// a hiscores ladder into a better band of places than the player has ever reached there (the top 100,
// 50, 10 or 3, or first) is said once, as its own moment and notice. Bands rather than every place, so a
// busy ladder never chatters; the best band is kept with the row, so falling back and climbing again
// says nothing new. A player's first place on a ladder is taken in quietly: joining the ladders (or a
// small one) is not a climb.

/** The bands of places, best first. */
export const BANDS = [1, 3, 10, 50, 100] as const;

/** The band a place falls in (its smallest band at or above it), or null outside the top 100. */
export function bandOf(place: number): number | null {
  return BANDS.find((b) => place <= b) ?? null;
}

/** What a place reached means against the best band kept before it (null: never placed; 0: placed,
 *  but never in the top 100): the band to keep now, and whether it is a climb to be said. */
export function climb(best: number | null, place: number): { keep: number; said: boolean } {
  const band = bandOf(place) ?? 0;
  // First placed: taken in quietly, and kept as the band to beat.
  if (best === null) return { keep: band, said: false };
  const better = band !== 0 && (best === 0 || band < best);
  return { keep: better ? band : best, said: better };
}
