// Relics (session 16): fourteen keepsakes bought with expedition marks, each hung from a cord, which
// marks the family; below it the thing itself, drawn as the finds are (ART.md): one object, lit from
// the upper left. One for each skill, then the hearthstone, the four-leaf charm and the builder's cord.
import type { ReactNode } from 'react';
import { circle, ellipse, Glint, INK, M, Shape, type Tone } from './style.tsx';

const tone = (light: string, base: string, shadow: string): Tone => ({ light, base, shadow });
const CORD = M.leather;

/** The cord a relic hangs from: a loop at the top and two strands down to the thing. */
function Hung({ to = 14, children }: { to?: number; children: ReactNode }) {
  return (
    <g>
      <path
        d={`M19 ${to} L22 6 C23 3 25 3 26 6 L29 ${to}`}
        fill="none"
        stroke={INK}
        strokeWidth={3.2}
        strokeLinejoin="round"
      />
      <path
        d={`M19 ${to} L22 6 C23 3 25 3 26 6 L29 ${to}`}
        fill="none"
        stroke={CORD.light}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      {children}
    </g>
  );
}

const HEARTWOOD = M.heartwood;
const PEARL = tone('#ffffff', '#ece6f2', '#b3a8c4');
const CHALK = tone('#ffffff', '#ecebe4', '#b6b3a6');
const STAR = tone('#fdfbff', '#c9bcff', '#7a68c4');
const CLOVER = M.leaf;
const HEARTH = tone('#ffd9a8', '#e48a4e', '#9b4a22');

export const HeartwoodCharm = () => (
  <Hung>
    <Shape d={circle(24, 30, 14)} tone={HEARTWOOD} lit={circle(20, 26, 8)}>
      {[10, 6.5, 3].map((r) => (
        <path key={r} d={circle(25, 31, r)} fill="none" stroke={HEARTWOOD.shadow} strokeWidth={1} />
      ))}
    </Shape>
  </Hung>
);

export const SeamFindersStone = () => (
  <Hung>
    <Shape
      d="M11 26 C12 17 20 14 28 15 C36 16 39 23 38 31 C37 39 30 45 22 44 C14 43 10 35 11 26 Z"
      tone={M.stone}
      lit="M11 26 C12 17 20 14 28 15 C21 18 16 23 15 31 C14.5 36 15.5 40 17 43 C12.5 40 10.5 33 11 26 Z"
    >
      <path
        d="M14 34 L22 27 L27 31 L35 22"
        fill="none"
        stroke={M.amber.base}
        strokeWidth={2.4}
        strokeLinejoin="round"
      />
      <path
        d="M14 34 L22 27 L27 31 L35 22"
        fill="none"
        stroke={M.amber.light}
        strokeWidth={0.9}
        strokeLinejoin="round"
      />
    </Shape>
  </Hung>
);

export const PearlLure = () => (
  <Hung to={13}>
    <path d="M24 13 L24 20" stroke={INK} strokeWidth={1.6} />
    <Shape d={circle(24, 26, 7)} tone={PEARL} lit={circle(22, 24, 4)}>
      <Glint x={21.5} y={23.5} r={1.2} />
    </Shape>
    {/* The hook below it. */}
    <path d="M24 33 L24 41 C24 45 30 45 30 41 L30 39" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
    <path
      d="M24 33 L24 41 C24 45 30 45 30 41 L30 39"
      fill="none"
      stroke={M.steel.base}
      strokeWidth={1.3}
      strokeLinecap="round"
    />
  </Hung>
);

export const StoneSpeakersChalk = () => (
  <Hung>
    <Shape d="M16 18 L32 18 L31 44 L17 44 Z" tone={CHALK} lit="M16 18 L22 18 L21 44 L17 44 Z">
      <path d="M24 23 L24 38 M24 27 L29 32 M24 33 L19 29" stroke="#4cc9e0" strokeWidth={1.8} strokeLinecap="round" />
    </Shape>
  </Hung>
);

export const SmithSpiritsNail = () => (
  <Hung to={12}>
    <Shape d="M14 12 L34 12 L33 18 L15 18 Z" tone={M.iron} lit="M14 12 L34 12 L33.6 14 L14.4 14 Z" />
    <Shape d="M20 18 L28 18 L24 46 Z" tone={M.iron} lit="M20 18 L24 18 L24 46 Z">
      <path d="M21 26 L27 26 M22 33 L26 33" stroke={M.flame.base} strokeWidth={1.4} />
    </Shape>
    <Glint x={17} y={14.5} r={0.9} />
  </Hung>
);

export const HearthWitchsLadle = () => (
  <Hung to={11}>
    <path d="M24 11 L24 30" stroke={INK} strokeWidth={4.4} strokeLinecap="round" />
    <path d="M24 11 L24 30" stroke={M.oakWood.base} strokeWidth={2.4} strokeLinecap="round" />
    <Shape
      d="M13 31 C13 27 35 27 35 31 C35 39 30 44 24 44 C18 44 13 39 13 31 Z"
      tone={M.copper}
      lit="M13 31 C13 27 24 27 24 28.5 C19 30 17 35 18 42 C15 39.5 13 35.5 13 31 Z"
    >
      <path d={ellipse(24, 31, 9, 2.4)} fill={M.broth.base} />
    </Shape>
    <Glint x={16} y={34} r={1} />
  </Hung>
);

export const WrenFeatherFletch = () => (
  <Hung>
    <Shape
      d="M24 14 C32 20 34 32 27 45 C25 45.5 23 45.5 21 45 C14 32 16 20 24 14 Z"
      tone={M.eagle}
      lit="M24 14 C16 20 14 32 21 45 C20 33 21 23 24 14 Z"
    >
      {[22, 28, 34, 40].map((y) => (
        <path key={y} d={`M24 ${y} L${y < 30 ? 30 : 29} ${y - 3}`} stroke={M.eagle.shadow} strokeWidth={0.9} />
      ))}
      <path d="M24 16 L24 45" stroke={M.eagle.light} strokeWidth={1} />
    </Shape>
  </Hung>
);

export const VeteransSwordKnot = () => (
  <Hung>
    <Shape d={circle(24, 20, 6)} tone={M.banner} lit={circle(22.5, 18.5, 3.4)} />
    {/* The tassel. */}
    <Shape d="M19 25 L29 25 L32 44 L16 44 Z" tone={M.banner} lit="M19 25 L23 25 L21 44 L16 44 Z">
      {[20, 24, 28].map((x) => (
        <path key={x} d={`M${x} 28 L${x + (x - 24) * 0.2} 44`} stroke={M.banner.shadow} strokeWidth={1} />
      ))}
    </Shape>
    <path d="M18 27 L30 27" stroke={M.bronze.base} strokeWidth={2.4} />
  </Hung>
);

export const HawkEyeBead = () => (
  <Hung>
    <Shape d={circle(24, 30, 13)} tone={M.amber} lit={circle(20, 26, 7)}>
      <path d={circle(25, 31, 5.5)} fill={INK} />
      <path d={circle(24, 30, 2)} fill="#fff6c8" />
    </Shape>
    <Glint x={17.5} y={23.5} r={1.3} />
  </Hung>
);

export const StarlitFocus = () => (
  <Hung>
    <Shape
      d="M24 14 L28 26 L40 30 L28 34 L24 46 L20 34 L8 30 L20 26 Z"
      tone={STAR}
      lit="M24 14 L28 26 L24 30 L20 26 Z M8 30 L20 26 L24 30 L20 34 Z"
    >
      <path d={circle(24, 30, 2.5)} fill="#ffffff" />
    </Shape>
  </Hung>
);

export const OldOakHeart = () => (
  <Hung>
    <Shape
      d="M24 45 C16 38 9 32 9 24 C9 18 13 15 17 15 C20 15 22.5 17 24 19.5 C25.5 17 28 15 31 15 C35 15 39 18 39 24 C39 32 32 38 24 45 Z"
      tone={M.oakWood}
      lit="M24 45 C16 38 9 32 9 24 C9 18 13 15 17 15 C13.5 18.5 13 23 14 28 C15.5 34 19 39 24 45 Z"
      shade="M39 24 C39 32 32 38 24 45 C29 38.5 33.5 32 33.5 25.5 C33.5 21 32 17.5 29.5 15.6 C35 15 39 18.5 39 24 Z"
    >
      <path
        d="M17 22 C20 27 22 31 24 38 M30 21 C28 26 26 30 24 38"
        fill="none"
        stroke={M.oakWood.shadow}
        strokeWidth={1}
      />
    </Shape>
    <Shape d="M28 19 C31 13 37 12 40 14 C38 18 33 20 28 19 Z" tone={M.leaf} />
  </Hung>
);

export const Hearthstone = () => (
  <Hung>
    <Shape
      d="M10 30 C10 21 16 15 24 15 C32 15 38 21 38 30 C38 39 32 45 24 45 C16 45 10 39 10 30 Z"
      tone={HEARTH}
      lit="M10 30 C10 21 16 15 24 15 C18 18.5 15 23.5 15 30 C15 35 16.5 39.5 19 43.5 C13.5 41 10 36 10 30 Z"
    >
      <path d="M15 34 C20 30 28 30 33 34" fill="none" stroke={M.flame.light} strokeWidth={1.4} strokeLinecap="round" />
      <path
        d="M18 26 C21 23.5 27 23.5 30 26"
        fill="none"
        stroke={M.flame.light}
        strokeWidth={1.1}
        strokeLinecap="round"
      />
    </Shape>
    <Glint x={17} y={22} r={1.2} />
  </Hung>
);

export const FourLeafCharm = () => (
  <Hung>
    {[
      [24, 21],
      [32, 29],
      [24, 37],
      [16, 29],
    ].map(([x, y]) => (
      <Shape key={`${x},${y}`} d={circle(x, y, 6.2)} tone={CLOVER} lit={circle(x - 1.8, y - 1.8, 3)} />
    ))}
    <path d="M24 29 L30 45" stroke={INK} strokeWidth={3} strokeLinecap="round" />
    <path d="M24 29 L30 45" stroke={CLOVER.shadow} strokeWidth={1.4} strokeLinecap="round" />
  </Hung>
);

export const BuildersCord = () => (
  <Hung to={12}>
    {/* A coil of cord, and the plumb-bob it measures with. */}
    <path d={ellipse(24, 20, 12, 6)} fill="none" stroke={INK} strokeWidth={5} />
    <path d={ellipse(24, 20, 12, 6)} fill="none" stroke={M.straw.base} strokeWidth={2.8} />
    <path d="M24 26 L24 32" stroke={INK} strokeWidth={1.6} />
    <Shape d="M18 32 L30 32 L24 46 Z" tone={M.bronze} lit="M18 32 L24 32 L24 46 Z" />
    <Glint x={21} y={34.5} r={0.9} />
  </Hung>
);
