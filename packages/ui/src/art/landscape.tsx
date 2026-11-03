// The march's landscape, shared by its scenes (the region's, MarchScene; the lord's castle, CastleScene):
// the far range with its snow, the forests on the hills, the near pines, the clouds and the hills'
// lines. Their colours are the march's CSS variables (MarchScene.module.css), by day and by night.
import s from './MarchScene.module.css';

export const W = 1600;
export const H = 600;

/** A repeatable sequence of numbers in [0, 1), so the forests grow the same way every time. */
export function seeded(seed: number) {
  let x = seed;
  return () => {
    x = (x * 1103515245 + 12345) % 2147483648;
    return x / 2147483648;
  };
}

export type Pt = [number, number];
export const poly = (pts: Pt[]) => pts.map(([x, y]) => `${x},${y}`).join(' ');

/** The far range: each peak's sunlit face, and snow on the highest. */
const RIDGE: Pt[] = [
  [0, 318],
  [110, 282],
  [200, 300],
  [320, 222],
  [410, 270],
  [505, 244],
  [630, 168],
  [715, 232],
  [820, 204],
  [925, 262],
  [1045, 186],
  [1150, 244],
  [1255, 214],
  [1370, 276],
  [1470, 236],
  [1600, 292],
];

export function Mountains() {
  const peaks = RIDGE.map((p, i) => ({ p, i })).filter(
    ({ p, i }) => i > 0 && i < RIDGE.length - 1 && p[1] < RIDGE[i - 1][1] && p[1] < RIDGE[i + 1][1],
  );
  return (
    <g>
      <polygon className={s.far} points={poly([...RIDGE, [W, 400], [0, 400]])} />
      {peaks.map(({ p, i }) => {
        const left = RIDGE[i - 1];
        const low = Math.max(left[1], RIDGE[i + 1][1]) + 70;
        const foot: Pt = [p[0] + (p[0] - left[0]) * 0.12, low];
        return <polygon key={i} className={s.farLit} points={poly([p, left, [(left[0] + p[0]) / 2, low], foot])} />;
      })}
      {peaks
        .filter(({ p }) => p[1] < 240)
        .map(({ p, i }) => (
          <polygon
            key={`snow${i}`}
            className={s.snow}
            points={poly([
              p,
              [p[0] - 24, p[1] + 34],
              [p[0] - 9, p[1] + 27],
              [p[0] + 3, p[1] + 37],
              [p[0] + 15, p[1] + 26],
              [p[0] + 26, p[1] + 33],
            ])}
          />
        ))}
    </g>
  );
}

/** A band of small pines along a hill's crest, too far for outlines. */
export function FarForest({
  y,
  count,
  seed,
  size,
}: {
  y: (x: number) => number;
  count: number;
  seed: number;
  size: number;
}) {
  const r = seeded(seed);
  const trees: string[] = [];
  for (let i = 0; i < count; i++) {
    const x = (i / count) * W + r() * (W / count);
    const h = size * (0.7 + r() * 0.6);
    const base = y(x) + 6;
    trees.push(`M${x - h * 0.28},${base} L${x},${base - h} L${x + h * 0.28},${base} Z`);
  }
  return <path className={s.forestFar} d={trees.join(' ')} />;
}

/** A near pine: three tiers with ragged lower edges, each lit on its left and shaded on its right,
 *  with the ink line round each tier. */
export function Pine({ x, base, h }: { x: number; base: number; h: number }) {
  const w = h * 0.36;
  const tiers = [0, 1, 2].map((t) => {
    const top = base - h + t * h * 0.24;
    const bottom = base - h * 0.18 - (2 - t) * h * 0.2;
    const half = w * (0.55 + t * 0.22);
    const d = h * 0.035;
    // Left tip, the ragged edge across, then the right tip: branches hang lower at their ends.
    const edge: Pt[] = [
      [x - half, bottom + d * 0.6],
      [x - half * 0.62, bottom - d * 0.5],
      [x - half * 0.3, bottom + d * 0.3],
      [x, bottom - d * 0.6],
      [x + half * 0.3, bottom + d * 0.3],
      [x + half * 0.62, bottom - d * 0.5],
      [x + half, bottom + d * 0.6],
    ];
    return { top, edge };
  });
  return (
    <g>
      <rect className={s.trunk} x={x - w * 0.07} y={base - h * 0.2} width={w * 0.14} height={h * 0.2} />
      {tiers.reverse().map(({ top, edge }, i) => {
        const outline = poly([[x, top], ...edge]);
        return (
          <g key={i}>
            <polygon className={s.pine} points={outline} />
            <polygon className={s.pineLit} points={poly([[x, top], ...edge.slice(0, 3), [x - 4, edge[3][1]]])} />
            <polygon
              className={s.pineShade}
              points={poly([[x, top], [x + (edge[5][0] - x) * 0.7, edge[5][1]], ...edge.slice(5)])}
            />
            <polygon className={s.ink} points={outline} />
          </g>
        );
      })}
    </g>
  );
}

/** A soft cloud: overlapping rounds on a flat base. */
export const cloud = (x: number, y: number, k: number) =>
  `M${x},${y} h${200 * k} a${34 * k},${30 * k} 0 0 0 -${40 * k},-${34 * k} a${48 * k},${46 * k} 0 0 0 -${78 * k},-${22 * k} a${40 * k},${38 * k} 0 0 0 -${62 * k},${20 * k} a${30 * k},${26 * k} 0 0 0 -${20 * k},${36 * k} Z`;

export const nearRange = (x: number) => 318 + 30 * Math.sin(x / 170 + 0.6) + 18 * Math.sin(x / 61 + 2);
export const farHill = (x: number) => 352 + 22 * Math.sin(x / 210) + 14 * Math.sin(x / 97 + 1);
export const midHill = (x: number) => 420 + 26 * Math.sin(x / 260 + 2) + 10 * Math.sin(x / 120);
export const hillPath = (f: (x: number) => number, bottom: number) => {
  const pts: string[] = [];
  for (let x = 0; x <= W; x += 40) pts.push(`${x},${f(x).toFixed(1)}`);
  return `M0,${bottom} L${pts.join(' L')} L${W},${bottom} Z`;
};
