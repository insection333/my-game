// A formation's shares on the page: three whole percents summing to 100, stepped by five at a time.
export type Three = [number, number, number];
const STEP = 5;

/** A share raised by five, taken from the largest of the others; or lowered, given to the smallest.
 *  The three always sum to 100 and none leaves 0 to 100. */
export function step(shares: readonly number[], i: number, up: boolean): Three {
  const next = [...shares] as Three;
  const others = [0, 1, 2].filter((j) => j !== i);
  if (up) {
    const from = others.reduce((a, b) => (next[b] > next[a] ? b : a));
    const moved = Math.min(STEP, next[from], 100 - next[i]);
    next[from] -= moved;
    next[i] += moved;
  } else {
    const to = others.reduce((a, b) => (next[b] < next[a] ? b : a));
    const moved = Math.min(STEP, next[i]);
    next[i] -= moved;
    next[to] += moved;
  }
  return next;
}
