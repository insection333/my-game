// The three Sovereign Edicts (session 41; ART.md, The castle's works and garrison): each a banner hung
// from a gilded bar, in the colour it flies on the keep (CastleScene): Harvest gold with a silver coin, Vigor
// green with an oak leaf, Fortune blue with a star.
import type { ReactNode } from 'react';
import { circle, Glint, INK, M, Shape, type Tone } from './style.tsx';

function Banner({ cloth, children }: { cloth: Tone; children: ReactNode }) {
  return (
    <g>
      <path d="M24 2 V7" stroke={INK} strokeWidth={2} />
      <Shape d="M8 7 H40 V11 H8 Z" tone={M.bronze} lit="M8 7 H40 V8.4 H8 Z" />
      <Shape d={circle(8, 9, 2.6)} tone={M.bronze} />
      <Shape d={circle(40, 9, 2.6)} tone={M.bronze} />
      <Shape
        d="M11 11 H37 V45 L24 37.5 L11 45 Z"
        tone={cloth}
        lit="M11 11 H16 V42.1 L11 45 Z"
        shade="M32 11 H37 V45 L32 42.1 Z"
      >
        <path
          d="M13.5 13.5 H34.5 V40.7 L24 34.6 L13.5 40.7 Z"
          fill="none"
          stroke={M.amber.light}
          strokeWidth={1.2}
          opacity={0.8}
        />
      </Shape>
      {children}
    </g>
  );
}

export function EdictHarvest() {
  return (
    <Banner cloth={M.amber}>
      <Shape d={circle(24, 23, 7.5)} tone={M.steel} lit={circle(22.4, 21.4, 4.2)}>
        <path d={circle(24, 23, 4.6)} fill="none" stroke={M.steel.shadow} strokeWidth={1.1} />
        <Glint x={21.6} y={20.6} r={1.1} />
      </Shape>
    </Banner>
  );
}

export function EdictVigor() {
  return (
    <Banner cloth={M.leaf}>
      <Shape
        d="M24 14 C27 16 30.5 15.5 30 19 C32.6 20.4 32 23.4 29.6 24.4 C31 27 28.6 29.6 26 28.6 L24 33 L22 28.6 C19.4 29.6 17 27 18.4 24.4 C16 23.4 15.4 20.4 18 19 C17.5 15.5 21 16 24 14 Z"
        tone={M.heartwood}
        lit="M24 14 C21 16 17.5 15.5 18 19 C15.4 20.4 16 23.4 18.4 24.4 C17 27 19.4 29.6 22 28.6 L24 33 Z"
      >
        <path d="M24 17 V32" stroke={M.heartwood.shadow} strokeWidth={1.1} />
      </Shape>
    </Banner>
  );
}

export function EdictFortune() {
  return (
    <Banner cloth={M.sapphire}>
      <Shape
        d="M24 14.5 L26.4 20.6 L33 21 L27.9 25.1 L29.6 31.5 L24 27.9 L18.4 31.5 L20.1 25.1 L15 21 L21.6 20.6 Z"
        tone={M.amber}
        lit="M24 14.5 L21.6 20.6 L15 21 L20.1 25.1 L24 23.4 Z"
      />
    </Banner>
  );
}
