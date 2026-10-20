// Randomness as a pure function of (seed, stream, counter). Each lane draws from its own stream with
// its own counter, so results never depend on how time was split between calls or on the order in
// which lanes are evaluated: advancing a to b to c gives exactly what a to c gives.

/** A number in [0, 1) for the given stream and counter. */
export type Rng = (stream: string, counter: number) => number;

/** lowbias32 (Chris Wellons): a fast 32-bit mixer with good avalanche. */
export function mix32(x: number): number {
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d);
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b);
  x ^= x >>> 16;
  return x >>> 0;
}

/** FNV-1a over the stream name. */
export function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

const TWO_32 = 2 ** 32;

export function seeded(seed: number): Rng {
  const base = mix32(seed >>> 0);
  const streams = new Map<string, number>();
  return (stream, counter) => {
    let key = streams.get(stream);
    if (key === undefined) {
      key = mix32(base ^ hashString(stream));
      streams.set(stream, key);
    }
    const lo = counter >>> 0;
    const hi = Math.floor(counter / TWO_32) >>> 0;
    return mix32(mix32(key ^ lo) ^ mix32(hi + 0x9e3779b9)) / TWO_32;
  };
}

/** A fresh seed for a new player, from any source of entropy the caller has. */
export const seedFrom = (entropy: number): number => mix32(Math.floor(entropy) >>> 0);
