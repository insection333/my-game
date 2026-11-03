// The parts of a lord's castle in its scene (CastleScene.tsx; ART.md, The lord's castle): the curtain wall
// with its merlons or stakes, towers with their roofs, the keep and its storeys, the gatehouse, the edict's
// banner and the beacon. Each is drawn as the icons are (icons/style.tsx): flat tones, three to a
// material, the light from the upper left, an ink line round every part.
import { circle, INK, M, Shape, type Tone } from '../icons/style.tsx';

type Pt = [number, number];
export const poly = (pts: Pt[]) => `M${pts.map(([x, y]) => `${x} ${y}`).join(' L')} Z`;

const tone = (light: string, base: string, shadow: string): Tone => ({ light, base, shadow });

/** The walls' material, as they are raised: a timber palisade, rough fieldstone, dressed stone, stone
 *  capped in iron, and white stone trimmed in gold. */
export interface Build {
  wall: Tone;
  /** Merlons' caps: iron or gold at the top tiers. */
  cap: Tone | null;
  timber: boolean;
}
const ROUGH = M.stone;
const DRESSED = tone('#e6e1d6', '#bfb7a8', '#8a8274');
const MARBLE = tone('#ffffff', '#ece7dc', '#bdb3a1');
export const ROOF = tone('#93a6b6', '#5d6f82', '#384553');
export const BUILDS: readonly { from: number; build: Build }[] = [
  { from: 0, build: { wall: M.oak, cap: null, timber: true } },
  { from: 5, build: { wall: ROUGH, cap: null, timber: false } },
  { from: 15, build: { wall: DRESSED, cap: null, timber: false } },
  { from: 30, build: { wall: DRESSED, cap: M.iron, timber: false } },
  { from: 60, build: { wall: MARBLE, cap: M.dawnsteel, timber: false } },
];
export const buildAt = (walls: number): Build => [...BUILDS].reverse().find((b) => walls >= b.from)!.build;

/** The edict's banner: Harvest gold, Vigor green, Fortune blue; with no edict in force, plain cloth. */
export const BANNERS = {
  harvest: M.amber,
  vigor: M.leaf,
  fortune: M.sapphire,
  none: tone('#efe8da', '#c9bfa9', '#958b74'),
} as const;

/** A box of wall from `l` to `r`, standing on `base` to `top`, lit on its left, shaded on its right. */
export function Block({ l, r, top, base, t }: { l: number; r: number; top: number; base: number; t: Tone }) {
  const w = r - l;
  return (
    <Shape
      d={poly([
        [l, top],
        [r, top],
        [r, base],
        [l, base],
      ])}
      tone={t}
      lit={poly([
        [l, top],
        [l + w * 0.18, top],
        [l + w * 0.18, base],
        [l, base],
      ])}
      shade={poly([
        [r - w * 0.28, top],
        [r, top],
        [r, base],
        [r - w * 0.28, base],
      ])}
    />
  );
}

/** Merlons along a wall's top (or a palisade's stakes), from `l` to `r`, missing those in `gone`. */
export function Crown({ l, r, top, b, gone = [] }: { l: number; r: number; top: number; b: Build; gone?: number[] }) {
  const step = b.timber ? 16 : 30;
  const n = Math.floor((r - l) / step);
  const pad = (r - l - n * step) / 2;
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        if (gone.includes(i)) return null;
        const x = l + pad + i * step;
        return b.timber ? (
          <Shape
            key={i}
            d={poly([
              [x, top],
              [x + step / 2, top - 16],
              [x + step, top],
            ])}
            tone={b.wall}
            lit={poly([
              [x, top],
              [x + step / 2, top - 16],
              [x + step / 2, top],
            ])}
          />
        ) : (
          <Block key={i} l={x + 4} r={x + step - 4} top={top - 16} base={top} t={b.cap ?? b.wall} />
        );
      })}
    </g>
  );
}

/** A tower centred on `x`: its body, a slit window, and a cone of slate (on a timber tower, shingles). */
export function Tower({
  x,
  w,
  top,
  base,
  b,
  beacon = false,
}: {
  x: number;
  w: number;
  top: number;
  base: number;
  b: Build;
  /** A beacon tower: flat-topped and crenellated, its brazier on the roof. */
  beacon?: boolean;
}) {
  const l = x - w / 2;
  const r = x + w / 2;
  const peak = top - w * 0.9;
  return (
    <g>
      <Block l={l} r={r} top={top} base={base} t={b.wall} />
      <rect x={x - 4} y={top + 26} width={8} height={18} fill={INK} />
      {beacon ? (
        <>
          <Block l={l - 6} r={r + 6} top={top - 8} base={top + 4} t={b.wall} />
          <Crown l={l - 6} r={r + 6} top={top - 8} b={b} />
          <Brazier x={x} top={top - 8} />
        </>
      ) : (
        <Shape
          d={poly([
            [l - 8, top],
            [x, peak],
            [r + 8, top],
          ])}
          tone={b.timber ? M.bark : ROOF}
          lit={poly([
            [l - 8, top],
            [x, peak],
            [x - 4, top],
          ])}
        />
      )}
    </g>
  );
}

/** The edict's banner: a pole of `POLE` above `top` (drawn with the castle) and its cloth (drawn in the
 *  layer that moves, where it stirs in the wind). */
export const POLE = 48;
export function FlagPole({ x, top }: { x: number; top: number }) {
  return (
    <g>
      <line x1={x} y1={top} x2={x} y2={top - POLE} stroke={INK} strokeWidth={4} strokeLinecap="round" />
      <circle cx={x} cy={top - POLE - 3} r={4.5} fill={M.bronze.base} stroke={INK} strokeWidth={2} />
    </g>
  );
}
export function FlagCloth({ x, top, t, className }: { x: number; top: number; t: Tone; className?: string }) {
  const y = top - POLE + 4;
  return (
    <g className={className} style={{ transformOrigin: `${x}px ${y}px` }}>
      <Shape
        d={`M${x + 1} ${y} C${x + 20} ${y - 6} ${x + 36} ${y + 6} ${x + 56} ${y} L${x + 48} ${y + 16} L${x + 56} ${y + 32} C${x + 36} ${y + 38} ${x + 20} ${y + 26} ${x + 1} ${y + 32} Z`}
        tone={t}
        lit={`M${x + 1} ${y} C${x + 20} ${y - 6} ${x + 36} ${y + 6} ${x + 56} ${y} L${x + 52} ${y + 8} C${x + 34} ${y + 12} ${x + 18} ${y + 4} ${x + 1} ${y + 10} Z`}
      />
    </g>
  );
}

/** A beacon's brazier atop a tower; its fire burns in the layer that moves (Flame). */
export function Brazier({ x, top }: { x: number; top: number }) {
  return (
    <Shape d={`M${x - 15} ${top} L${x + 15} ${top} L${x + 11} ${top - 13} L${x - 11} ${top - 13} Z`} tone={M.iron} />
  );
}

/** A tongue of fire standing on `base`: a beacon's, or a fire on walls under siege. */
export function Flame({ x, base, h = 34, className }: { x: number; base: number; h?: number; className?: string }) {
  const w = h * 0.3;
  return (
    <g className={className} style={{ transformOrigin: `${x}px ${base}px` }}>
      <Shape
        d={`M${x} ${base - h} C${x + w * 0.5} ${base - h * 0.66} ${x + w * 1.3} ${base - h * 0.4} ${x + w} ${base} L${x - w} ${base} C${x - w * 1.3} ${base - h * 0.4} ${x - w * 0.4} ${base - h * 0.6} ${x} ${base - h} Z`}
        tone={M.flame}
        lit={`M${x - w} ${base} C${x - w * 1.3} ${base - h * 0.4} ${x - w * 0.4} ${base - h * 0.6} ${x} ${base - h} C${x - w * 0.2} ${base - h * 0.5} ${x + w * 0.2} ${base - h * 0.3} ${x} ${base} Z`}
      />
    </g>
  );
}

/** Rubble at a wall's foot after a breach: a few fallen stones. */
export function Rubble({ x, base, t }: { x: number; base: number; t: Tone }) {
  return (
    <g>
      {(
        [
          [-22, -7, 9],
          [-6, -10, 11],
          [12, -6, 8],
          [26, -4, 6],
        ] as const
      ).map(([dx, dy, r]) => (
        <Shape key={dx} d={circle(x + dx, base + dy, r)} tone={t} lit={circle(x + dx - 3, base + dy - 3, r * 0.5)} />
      ))}
    </g>
  );
}
