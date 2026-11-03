// Title badges (session 43; ART.md, Badges): a rare feat's mark worn beside the title, read at 16 to 24
// px. Each is one bold emblem in gold on a dark lozenge rimmed in gold, so the family is known at once:
// a tower (a castle grown great), a skull (half a million foes), a star (the whole log), a flame (every
// skill kindled), a wyrm's head (the Ember Wyrm beaten a hundred times), a crown (the last rank).
import type { ReactNode } from 'react';
import { Glint, INK, M, Shape } from './style.tsx';

const GROUND = { light: '#4a5a62', base: '#2c3b41', shadow: '#1b262b' };

function Lozenge({ children }: { children: ReactNode }) {
  return (
    <g>
      <Shape
        d="M24 2 L45 24 L24 46 L3 24 Z"
        tone={GROUND}
        lit="M24 2 L3 24 L8 24 L24 8 Z"
        shade="M45 24 L24 46 L24 40 L40 24 Z"
      />
      <path d="M24 6.4 L40.6 24 L24 41.6 L7.4 24 Z" fill="none" stroke={M.amber.base} strokeWidth={2} />
      {children}
    </g>
  );
}

export function BadgeTower() {
  return (
    <Lozenge>
      <Shape
        d="M17 33 V18 H19.6 V15 H22.2 V18 H25.8 V15 H28.4 V18 H31 V33 Z"
        tone={M.amber}
        lit="M17 33 V18 H19.6 V15 H20.8 V33 Z"
      />
      <path d="M22 33 V28.6 A2 2 0 0 1 26 28.6 V33 Z" fill={INK} />
    </Lozenge>
  );
}

export function BadgeSkull() {
  return (
    <Lozenge>
      <Shape
        d="M24 13 C30 13 33 17 33 22 C33 25 31.6 27 30 28 V32 H18 V28 C16.4 27 15 25 15 22 C15 17 18 13 24 13 Z"
        tone={M.bone}
        lit="M24 13 C18 13 15 17 15 22 C15 25 16.4 27 18 28 V32 H20 V27 C18 25 18 19 24 13 Z"
      />
      <circle cx={20.6} cy={22} r={2.2} fill={INK} />
      <circle cx={27.4} cy={22} r={2.2} fill={INK} />
      <path d="M22 32 V29 M24 32 V29 M26 32 V29" stroke={INK} strokeWidth={1.2} />
    </Lozenge>
  );
}

export function BadgeStar() {
  return (
    <Lozenge>
      <Shape
        d="M24 12 L27 20.4 L35.6 20.6 L28.8 26 L31.2 34.4 L24 29.4 L16.8 34.4 L19.2 26 L12.4 20.6 L21 20.4 Z"
        tone={M.amber}
        lit="M24 12 L21 20.4 L12.4 20.6 L19.2 26 L24 23 Z"
      >
        <Glint x={22} y={21} r={1} />
      </Shape>
    </Lozenge>
  );
}

export function BadgeFlame() {
  return (
    <Lozenge>
      <Shape
        d="M24 11 C27 16 33 19 32 27 C31 32 28 35 24 35 C20 35 17 32 16 27 C15.4 22 18 19 20 17 C20 20 21 22 23 23 C22 18 22 15 24 11 Z"
        tone={M.flame}
        lit="M24 11 C22 15 22 18 23 23 C21 22 20 20 20 17 C18 19 15.4 22 16 27 C17 32 20 35 24 35 C21 32 20 28 21 24 Z"
      />
    </Lozenge>
  );
}

export function BadgeWyrm() {
  return (
    <Lozenge>
      <Shape
        d="M14 30 C14 22 19 16 26 15 L30 11 L31 16 C34 17 35 20 34 23 L28 24 L33 27 C31 31 27 33 22 33 C18 33 15 32 14 30 Z"
        tone={M.emberOre}
        lit="M14 30 C14 22 19 16 26 15 L27 16.4 C21 18 17.4 23 17 30 Z"
      />
      <circle cx={28.6} cy={19} r={1.3} fill={M.amber.light} stroke={INK} strokeWidth={0.8} />
    </Lozenge>
  );
}

export function BadgeCrown() {
  return (
    <Lozenge>
      <Shape
        d="M15 31 L13.6 17 L19.4 22.4 L24 14 L28.6 22.4 L34.4 17 L33 31 Z"
        tone={M.amber}
        lit="M15 31 L13.6 17 L19.4 22.4 L18 31 Z"
      >
        <Glint x={24} y={18} r={1} />
      </Shape>
      <Shape d="M15 31 H33 V34 H15 Z" tone={M.amber} />
      <circle cx={24} cy={27} r={1.8} fill={M.garnet.base} stroke={INK} strokeWidth={0.8} />
    </Lozenge>
  );
}
