// The Sunken Fen's foes (session 12), drawn as the march's are (ART.md): a bust in left-facing profile,
// light from the upper left, the eye the brightest point. Bog-green, reed-gold and drowned-grey skins.
import { Eye, shoulders } from './foes.tsx';
import { circle, Glint, INK, M, Shape } from './style.tsx';

/** Weed hanging from a brow or a shoulder: a dark strand with a lighter edge. */
const Weed = ({ d }: { d: string }) => (
  <g>
    <path d={d} fill="none" stroke={M.leaf.shadow} strokeWidth={2.4} strokeLinecap="round" />
    <path d={d} fill="none" stroke={M.leaf.base} strokeWidth={1} strokeLinecap="round" />
  </g>
);

/** A bow held upright behind the shoulder, in a wood. */
const Bow = ({ wood }: { wood: string }) => (
  <g>
    <path d="M41 4 C47 16 47 30 41 42" fill="none" stroke={wood} strokeWidth={2.4} strokeLinecap="round" />
    <path d="M41 4 L41 42" stroke={M.feather.shadow} strokeWidth={0.9} />
  </g>
);

export function BogLurker() {
  return (
    <g>
      <Shape d={shoulders(34)} tone={M.bog} lit="M5 46 C6 38 13 34 24 34 C17 36 13 40 12 46 Z" />
      <Shape
        d="M7 27 C6 18 13 11 23 11 C33 11 40 17 40 26 C40 34 34 40 25 40 C17 40 11 38 8 34 C6 32 6 30 7 27 Z"
        tone={M.bog}
        lit="M7 27 C6 18 13 11 23 11 C17 14 13.5 19 13 26 C12.5 30 11 32.5 8.5 33.5 C6.5 31.5 6.3 29.5 7 27 Z"
        shade="M40 26 C40 34 34 40 25 40 C31 37 34.5 32 34.5 25 C34.5 19 32 14.5 28 12 C35 13.5 40 19 40 26 Z"
      >
        <path d="M9 33 C14 35 20 35 25 33" fill="none" stroke={INK} strokeWidth={1} strokeLinecap="round" />
      </Shape>
      <Shape d="M10.5 34 L10 29.5 L13.5 33.5 Z" tone={M.bone} />
      <Shape d="M16 34.8 L16 30.5 L19 34.6 Z" tone={M.bone} />
      <Weed d="M19 11.5 C17.5 15 19 18 17 22" />
      <Weed d="M27 11.5 C27.5 16 25.5 19 27 24" />
      <Weed d="M33 36 C32 40 34 42 33 46" />
      <Eye x={14} y={23} glow="#d9ff7a" r={2.2} />
    </g>
  );
}

export function ReedStalker() {
  return (
    <g>
      <Bow wood={M.mapleWood.shadow} />
      <Shape
        d="M5 46 C5 30 9 10 24 7 C35 5 40 16 40 30 L40 46 Z"
        tone={M.reed}
        lit="M5 46 C5 30 9 10 24 7 C17 11 12.5 21 12 32 C11.5 38 12 42 13 46 Z"
        shade="M40 30 L40 46 L34 46 C35 38 35.5 30 34.5 22 C34 17 32.5 12.5 30 9 C37 11 40 19 40 30 Z"
      >
        {[14, 19, 24, 29, 34].map((x) => (
          <path key={x} d={`M${x} 12 L${x - 2} 46`} stroke={M.reed.shadow} strokeWidth={0.9} opacity={0.7} />
        ))}
      </Shape>
      {/* The face in the hood's shadow. */}
      <Shape
        d="M13 29 C13 22 17 17.5 23 17.5 C28.5 17.5 31 22 31 28 C31 35 27.5 40 22 40 C18.5 40 16 38.5 14.5 36.5 L9.5 33.5 C11 32 12.5 31 13 29 Z"
        tone={M.mud}
        lit="M13 29 C13 22 17 17.5 23 17.5 C19.5 20 18 24 18 28.5 C18 31 16.5 33 13 34 L9.5 33.5 C11 32 12.5 31 13 29 Z"
      >
        <path d="M14 23 C19 19.5 26 19 31 22 L31 17 L14 17 Z" fill={M.reed.shadow} />
      </Shape>
      <Eye x={18} y={26} glow="#ffe27a" r={2.1} />
    </g>
  );
}

export function DrownedAcolyte() {
  return (
    <g>
      <path d="M43 9 L40 44" stroke={INK} strokeWidth={3.6} strokeLinecap="round" />
      <path d="M43 9 L40 44" stroke={M.oakWood.shadow} strokeWidth={1.8} strokeLinecap="round" />
      <Shape d={circle(43, 8, 4)} tone={M.wisp} lit={circle(42, 7, 2.2)}>
        <Glint x={41.5} y={6.5} r={1} />
      </Shape>
      <Shape
        d="M5 46 C5 28 10 9 26 7 C38 6 41 18 41 31 L41 46 Z"
        tone={M.drowned}
        lit="M5 46 C5 28 10 9 26 7 C18 11 13 20 12 32 C11.5 38 12 42 13 46 Z"
        shade="M41 31 L41 46 L35 46 C36 38 36.5 30 35.5 22 C35 17 33 12 30 8.5 C37 10.5 41 19 41 31 Z"
      />
      <Shape
        d="M13 29 C13 21.5 17.5 16.5 24 16.5 C30 16.5 33 21.5 33 28 C33 35 29 40 23 40 C19 40 16.5 38.5 15 36.5 L10 34.5 C11 32.5 12.5 31 13 29 Z"
        tone={M.wight}
        lit="M13 29 C13 21.5 17.5 16.5 24 16.5 C20 19 18.5 23 18.5 28 C18.5 31 17 33 14 34.5 L10 34.5 C11 32.5 12.5 31 13 29 Z"
        shade="M33 28 C33 35 29 40 23 40 C27 37 29 33 29 27 C29 23 28 20 26 17 C30.5 18 33 22.5 33 28 Z"
      />
      {/* Water still running from the hood. */}
      {[
        [11, 38],
        [9, 43],
        [16, 44],
      ].map(([x, y]) => (
        <circle key={x + y} cx={x} cy={y} r={1.3} fill={M.wisp.base} stroke={INK} strokeWidth={0.6} />
      ))}
      <Eye x={18.5} y={25.5} glow="#9ff7ff" />
    </g>
  );
}

export function MireHulk() {
  return (
    <g>
      <Shape
        d="M4 44 C2 30 6 12 20 7 C33 3 45 12 45 27 C45 38 39 46 28 46 L6 46 Z"
        tone={M.mud}
        lit="M4 44 C2 30 6 12 20 7 C14 12 10.5 21 10.5 31 C10.5 37 11.5 42 13 46 L6 46 Z"
        shade="M45 27 C45 38 39 46 28 46 L24 46 C33 41 38.5 34 38.5 25 C38.5 17 35 11 30 7 C39 9 45 17 45 27 Z"
      >
        <path d="M8 31 C13 34 19 34 24 31" fill="none" stroke={INK} strokeWidth={1.2} strokeLinecap="round" />
        <path d="M30 16 L34 22 L31 27" fill="none" stroke={M.mud.shadow} strokeWidth={1.4} strokeLinecap="round" />
      </Shape>
      {/* Moss across the crown. */}
      <Shape
        d="M10 12 C16 5 30 3 39 9 C35 9 33 11 29 10 C24 9 21 12 17 11 C14 10.5 12 12 10 12 Z"
        tone={M.leaf}
        lit="M10 12 C16 5 26 3.5 32 5 C24 6 18 8 10 12 Z"
      />
      <Eye x={14} y={22} glow="#ffd36b" r={1.8} />
    </g>
  );
}

export function FenReaver() {
  return (
    <g>
      <Bow wood={M.silverWood.shadow} />
      <Shape d={shoulders(36)} tone={M.leather} lit="M5 46 C6 40 13 36 24 36 C17 38 13 42 12 46 Z" />
      <Shape
        d="M9 25 C9 16 15 11 24 11 C32 11 37 16 37 24 C37 32 32 37 24 37 C18 37 14 35 11.5 32 L7 30 C8 28.5 9 27 9 25 Z"
        tone={M.skin}
        lit="M9 25 C9 16 15 11 24 11 C19 13.5 15.5 18 15 25 C14.8 28 13.5 30 11 31 L7 30 C8 28.5 9 27 9 25 Z"
        shade="M37 24 C37 32 32 37 24 37 C29 34 32 29.5 32 23.5 C32 18 30 14 27 12 C33 13.5 37 18 37 24 Z"
      />
      {/* A helm of bone with a crest of reeds. */}
      <Shape
        d="M8.5 19 C9.5 11 16 6.5 24.5 6.5 C33 6.5 38.5 11.5 39 19 Z"
        tone={M.bone}
        lit="M8.5 19 C9.5 11 16 6.5 24.5 6.5 C19 9 15.5 13 15 19 Z"
        shade="M39 19 C38.5 11.5 33 6.5 24.5 6.5 C30 9.5 33 13.5 33.5 19 Z"
      />
      {[20, 25, 30].map((x) => (
        <path key={x} d={`M${x} 7 L${x + 3} 1`} stroke={M.reed.shadow} strokeWidth={1.8} strokeLinecap="round" />
      ))}
      <Eye x={15} y={24} glow="#ffb84d" r={2.2} />
    </g>
  );
}

export function BogWitch() {
  return (
    <g>
      <Shape
        d="M5 46 C5 30 9 18 18 13 L30 2 L29 14 C37 18 41 28 41 46 Z"
        tone={M.cloth}
        lit="M5 46 C5 30 9 18 18 13 L30 2 L24 14 C17 19 13 28 12.5 37 C12.3 41 12.6 44 13 46 Z"
        shade="M41 46 L35 46 C35 34 34 25 29.5 18 L29 14 C37 18 41 28 41 46 Z"
      />
      <Shape
        d="M14 29 C14 23 18 19 24 19 C29 19 32 23 32 29 C32 35 28.5 39.5 23 39.5 C19.5 39.5 17 38 15.5 36 L8 33 C10 31.5 13 31 14 29 Z"
        tone={M.bog}
        lit="M14 29 C14 23 18 19 24 19 C20.5 21.5 19 25 19 29 C19 31.5 17.5 33.5 14 34 L8 33 C10 31.5 13 31 14 29 Z"
      >
        <circle cx={13} cy={32} r={1} fill={M.bog.shadow} />
      </Shape>
      {/* A sprig of fen herbs at the brim. */}
      <path d="M30 15 C33 12 35 12 37 13" fill="none" stroke={M.leaf.shadow} strokeWidth={1.6} strokeLinecap="round" />
      <circle cx={37.5} cy={13} r={1.6} fill={M.leaf.base} stroke={INK} strokeWidth={0.7} />
      <Eye x={19} y={26.5} glow="#a6ff6b" r={2.1} />
    </g>
  );
}
