// Fish and what Cooking makes of them (session 13; the family the owner approved on 27 October 2026,
// ART.md). A fish lies on a slant, head low on the left and tail up on the right, so it fills the square
// as a sword or a log does: its back lit from the upper left, its belly in shade, the eye the brightest
// point. Raw fish keep their own skins and markings; cooked fish turn a golden brown with grill marks
// and a cloudy eye, so raw and cooked read apart at 24 px.
import type { ReactNode } from 'react';
import { INK, Shape, type Tone } from './style.tsx';

export const tone = (light: string, base: string, shadow: string): Tone => ({ light, base, shadow });

/** Skins, fins and the cooked browns. */
export const FISH = {
  perch: tone('#e3eb9f', '#9fb04a', '#5d6b27'),
  perchFin: tone('#ffc27c', '#e0702c', '#983f17'),
  trout: tone('#f3e7c4', '#b9a66a', '#6f6136'),
  troutFin: tone('#e6cfa0', '#a98d55', '#6a5530'),
  pike: tone('#cfe0a0', '#6f8a3c', '#3f5222'),
  pikeFin: tone('#d7c27e', '#9c823c', '#5e4c1f'),
  salmon: tone('#f4f7f6', '#c3ccce', '#7f8b90'),
  salmonBack: tone('#a9b8c2', '#5f7180', '#35434e'),
  salmonFin: tone('#b9c3c8', '#7d8b93', '#4b575e'),
  cooked: tone('#f6cf86', '#c98a3f', '#86501f'),
  cookedFin: tone('#c98a50', '#8e5427', '#552f13'),
  cookedPink: tone('#ffd7b0', '#e59c6a', '#9c5a35'),
};

// Drawn flat (facing left, along y = 25), then laid on the slant. `ky` makes a body slimmer or fuller.
const COS = Math.cos(Math.PI / 6);
const SIN = Math.sin(Math.PI / 6);
export const at = (x: number, y: number, ky = 1): [number, number] => {
  const yy = 25 + (y - 25) * ky;
  return [
    Math.round((24 + (x - 24) * COS + (yy - 25) * SIN - 1.5) * 100) / 100,
    Math.round((25 - (x - 24) * SIN + (yy - 25) * COS + 1) * 100) / 100,
  ];
};
/** A path drawn flat, laid on the slant (every command absolute: M, L, C or Z). */
export const tf = (d: string, ky = 1) =>
  d.replace(/(-?\d*\.?\d+)[ ,](-?\d*\.?\d+)/g, (_, x: string, y: string) => at(+x, +y, ky).join(' '));

const FLAT = {
  body:
    'M3 25 C7 18 17 15.5 27 16 C33 16.5 37 19 39.5 21.5 L46 15 C46.3 19.5 45.6 22.5 44.3 25 ' +
    'C45.6 27.5 46.3 30.5 46 35 L39.5 28.5 C37 31 33 33.5 27 34 C17 34.5 7 32 3 25 Z',
  lit: 'M3 25 C7 18 17 15.5 27 16 C33 16.5 37 19 39.5 21.5 L36.5 22 C30 19.5 20 19.5 11 22.5 C7.5 23.5 5 24.3 3 25 Z',
  shade: 'M3 25 C10 28.5 20 29.5 30 28.5 C34 28 37 27.5 39.5 28.5 C37 31 33 33.5 27 34 C17 34.5 7 32 3 25 Z',
  dorsal: 'M15 16.8 C18 11 26 10 31 16.4 Z',
  dorsalLit: 'M15 16.8 C18 11 21.5 10.5 23.5 11.2 C20.5 13 18.5 15 17.5 16.8 Z',
  pelvic: 'M19 33.6 C20.5 38 25 38.5 27 33.8 Z',
  gill: 'M14 18.5 C11.5 22 11.5 28 14 31.5',
  rays: 'M41 22 L44.8 17 M41.5 25 L45 25 M41 28 L44.8 33',
  mouth: 'M3 25 L6.8 26',
};

export interface FishProps {
  skin: Tone;
  fin: Tone;
  /** Markings inside the body, drawn flat with `tf` and the same `ky`. */
  marks?: ReactNode;
  cooked?: boolean;
  ky?: number;
  /** A dorsal fin of its own, drawn flat (a pike's sits far back). */
  dorsal?: string;
  /** Drawn over the head after the body: a sturgeon's snout, a carp's barbels. */
  head?: ReactNode;
}

export function Fish({ skin, fin, marks, cooked, ky = 1, dorsal, head }: FishProps) {
  const eye = at(8.5, 23, ky);
  return (
    <g>
      <Shape d={tf(dorsal ?? FLAT.dorsal, ky)} tone={fin} lit={dorsal ? undefined : tf(FLAT.dorsalLit, ky)} />
      <Shape d={tf(FLAT.pelvic, ky)} tone={fin} />
      <Shape d={tf(FLAT.body, ky)} tone={skin} lit={tf(FLAT.lit, ky)} shade={tf(FLAT.shade, ky)}>
        {marks}
        <path d={tf(FLAT.gill, ky)} fill="none" stroke={skin.shadow} strokeWidth={1.4} />
        <path d={tf(FLAT.rays, ky)} stroke={fin.shadow} strokeWidth={1} opacity={0.8} />
      </Shape>
      {head}
      <path d={tf(FLAT.mouth, ky)} stroke={INK} strokeWidth={1.2} strokeLinecap="round" />
      {cooked ? (
        <circle cx={eye[0]} cy={eye[1]} r={2} fill="#f3eee2" stroke={INK} strokeWidth={1} />
      ) : (
        <g>
          <circle cx={eye[0]} cy={eye[1]} r={2.4} fill={INK} />
          <circle cx={eye[0] - 0.3} cy={eye[1]} r={1.3} fill="#e8d47a" />
          <circle cx={eye[0] - 0.7} cy={eye[1] - 0.6} r={0.6} fill="#ffffff" />
        </g>
      )}
    </g>
  );
}

/** A cooked fish's grill marks, drawn across the body. */
export const grill = (ky = 1, colour: string = FISH.cooked.shadow) => (
  <g stroke={colour} strokeWidth={2} strokeLinecap="round" opacity={0.85}>
    <path d={tf('M17 18.5 L14 30', ky)} />
    <path d={tf('M24 17 L21 32', ky)} />
    <path d={tf('M31 17.5 L28 32.5', ky)} />
  </g>
);

/** Spots at points drawn flat. */
export const spots = (pts: [number, number][], fill: string, r: number, ky = 1) =>
  pts.map(([x, y]) => {
    const [cx, cy] = at(x, y, ky);
    return <circle key={`${x},${y}`} cx={cx} cy={cy} r={r} fill={fill} />;
  });

export function Perch() {
  return (
    <Fish
      skin={FISH.perch}
      fin={FISH.perchFin}
      marks={
        <g fill={FISH.perch.shadow} opacity={0.75}>
          {[18, 24, 30].map((x) => (
            <path
              key={x}
              d={tf(
                `M${x} 16 C${x + 1.4} 20 ${x + 1.4} 24 ${x - 0.5} 28 L${x - 3} 27.2 C${x - 1.5} 23 ${x - 1.5} 20 ${x - 3} 16.5 Z`,
              )}
            />
          ))}
        </g>
      }
    />
  );
}

export function Trout() {
  return (
    <Fish
      skin={FISH.trout}
      fin={FISH.troutFin}
      marks={
        <g>
          {/* The pink stripe along the flank, and dark spots over the back. */}
          <path d={tf('M8 25 C16 22.5 28 22 40 24 C28 24.5 16 25 8 26.5 Z')} fill="#e58a8a" opacity={0.9} />
          {spots(
            [
              [18, 19],
              [23, 18.2],
              [28, 18.8],
              [33, 20],
              [21, 21.4],
              [30, 21.6],
            ],
            FISH.trout.shadow,
            0.85,
          )}
        </g>
      }
    />
  );
}

const PIKE_DORSAL = 'M28 16.8 C31 12 36 12.5 38.5 19 Z';

/** A pike: slim and long, its dorsal fin far back by the tail. */
export function Pike() {
  return (
    <Fish
      skin={FISH.pike}
      fin={FISH.pikeFin}
      ky={0.78}
      dorsal={PIKE_DORSAL}
      marks={spots(
        [
          [14, 21],
          [19, 19.5],
          [24, 20],
          [29, 21],
          [17, 26],
          [22, 25],
          [27, 26],
          [33, 24.5],
        ],
        '#e6eb9a',
        0.9,
        0.78,
      )}
    />
  );
}

export function Salmon() {
  return (
    <Fish
      skin={FISH.salmon}
      fin={FISH.salmonFin}
      marks={
        <g>
          <path
            d={tf('M3 25 C7 18 17 15.5 27 16 C33 16.5 37 19 39.5 21.5 C30 19 18 19.5 5 24 Z')}
            fill={FISH.salmonBack.base}
          />
          <path d={tf('M8 22 C15 19 24 17.5 32 18.2 C24 18 16 19.5 9 21.6 Z')} fill={FISH.salmonBack.light} />
          {spots(
            [
              [20, 19],
              [26, 18.3],
              [31, 19.6],
              [23, 21.2],
            ],
            FISH.salmonBack.shadow,
            0.9,
          )}
        </g>
      }
    />
  );
}

export const CookedPerch = () => <Fish skin={FISH.cooked} fin={FISH.cookedFin} marks={grill()} cooked />;
export const CookedTrout = () => (
  <Fish skin={FISH.cookedPink} fin={FISH.cookedFin} marks={grill(1, FISH.cookedPink.shadow)} cooked />
);
export const CookedPike = () => (
  <Fish skin={FISH.cooked} fin={FISH.cookedFin} ky={0.78} dorsal={PIKE_DORSAL} marks={grill(0.78)} cooked />
);
export const CookedSalmon = () => (
  <Fish skin={tone('#ffc9a6', '#ea8e62', '#a3502f')} fin={FISH.cookedFin} marks={grill(1, '#8a3f22')} cooked />
);
