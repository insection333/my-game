// Heraldry (session 41; ART.md, Heraldry): every lord and stronghold bears arms, drawn from its id, so a
// foe is known by their shield before their name. A heater shield in one colour, divided with a metal
// (per pale, per fess, per bend, a chief, a chevron or quarterly) or plain, and a charge in the other
// metal: a star, a tower, a crescent, a roundel, a cross or a key. Metal on colour, as the heralds' rule
// has it, so each reads at 24 px; the ink line holds the charge where it crosses the division.
import { useId } from 'react';
import { circle, INK, LINE, M, Shape, type Tone } from './style.tsx';

const SHIELD = 'M8 5 H40 V21 C40 33.5 32.5 40.5 24 45 C15.5 40.5 8 33.5 8 21 Z';
const LIT = 'M8 5 H13 V21 C13 31 17.5 38 24 42.6 C15.5 40.5 8 33.5 8 21 Z';
const SHADE = 'M34.5 5 H40 V21 C40 33.5 32.5 40.5 24 45 C30 40.5 34.5 33 34.5 21 Z';

/** The colours, and the two metals: gold and silver. */
const COLOURS: readonly Tone[] = [M.banner, M.sapphire, M.leaf, M.amethyst, M.coal];
const GOLD = M.amber;
const SILVER = { light: '#ffffff', base: '#e4e8e6', shadow: '#aab2b0' };

/** Each division: the part in metal, and its line. */
const DIVISIONS: readonly { part: string; line: string }[] = [
  { part: '', line: '' },
  { part: 'M24 0 H48 V48 H24 Z', line: 'M24 5 V45' },
  { part: 'M0 24 H48 V48 H0 Z', line: 'M8 24 H40' },
  { part: 'M8 5 L40 37 L40 48 L0 48 L0 5 Z', line: 'M8 5 L40 37' },
  { part: 'M0 0 H48 V15 H0 Z', line: 'M8 15 H40' },
  { part: 'M0 48 L0 38 L24 16 L48 38 L48 48 Z', line: 'M8 30.7 L24 16 L40 30.7' },
  { part: 'M24 0 H48 V24 H24 Z M0 24 H24 V48 H0 Z', line: 'M24 5 V45 M8 24 H40' },
];

/** The charges, centred where the shield's middle is. */
const CHARGES: readonly { d: string; lit: string }[] = [
  {
    // A star of five points.
    d: 'M24 14.5 L26.6 21.6 L34 21.8 L28.1 26.3 L30.2 33.4 L24 29.2 L17.8 33.4 L19.9 26.3 L14 21.8 L21.4 21.6 Z',
    lit: 'M24 14.5 L21.4 21.6 L14 21.8 L19.9 26.3 L24 24 Z',
  },
  {
    // A tower: crenellated, with a dark door.
    d: 'M17 33 V20 H19.5 V17 H22.2 V20 H25.8 V17 H28.5 V20 H31 V33 Z',
    lit: 'M17 33 V20 H19.5 V17 H20.6 V33 Z',
  },
  {
    // A crescent, horns up.
    d: 'M15.5 19 C15.5 26 19 31.5 24 31.5 C29 31.5 32.5 26 32.5 19 C30.5 23.5 27.5 26 24 26 C20.5 26 17.5 23.5 15.5 19 Z',
    lit: 'M15.5 19 C15.5 26 19 31.5 24 31.5 C21 29 18.5 24.5 15.5 19 Z',
  },
  { d: circle(24, 24, 8), lit: circle(22, 22, 4.4) },
  {
    // A cross, its arms even.
    d: 'M21.5 15 H26.5 V21.5 H33 V26.5 H26.5 V33 H21.5 V26.5 H15 V21.5 H21.5 Z',
    lit: 'M21.5 15 H23 V33 H21.5 Z M15 21.5 H33 V23 H15 Z',
  },
  {
    // A key, bit down.
    d: 'M24 13 C27.3 13 29.5 15.4 29.5 18.4 C29.5 20.6 28 22.5 26 23.2 V33 H29 V35.4 H26 V37 H22 V23.2 C20 22.5 18.5 20.6 18.5 18.4 C18.5 15.4 20.7 13 24 13 Z M24 16.2 C22.7 16.2 21.8 17.2 21.8 18.4 C21.8 19.6 22.7 20.6 24 20.6 C25.3 20.6 26.2 19.6 26.2 18.4 C26.2 17.2 25.3 16.2 24 16.2 Z',
    lit: 'M18.5 18.4 C18.5 15.4 20.7 13 24 13 C21.6 14.4 20.6 16.4 20.6 18.6 C20.6 21 22 22.6 23.4 23.4 V37 H22 V23.2 C20 22.5 18.5 20.6 18.5 18.4 Z',
  },
];

/** A seed from an id: FNV-1a, so the same id always bears the same arms. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export interface Arms {
  colour: Tone;
  metal: Tone;
  charge: Tone;
  division: number;
  figure: number;
}

/** The arms an id bears. */
export function armsOf(seed: string): Arms {
  const h = hash(seed);
  const gold = (h & 1) === 0;
  return {
    colour: COLOURS[(h >>> 1) % COLOURS.length],
    metal: gold ? GOLD : SILVER,
    charge: gold ? SILVER : GOLD,
    division: (h >>> 4) % DIVISIONS.length,
    figure: (h >>> 8) % CHARGES.length,
  };
}

export function Crest({ seed }: { seed: string }) {
  const id = `c${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const a = armsOf(seed);
  const div = DIVISIONS[a.division];
  const charge = CHARGES[a.figure];
  return (
    <g>
      <clipPath id={id}>
        <path d={SHIELD} />
      </clipPath>
      <Shape d={SHIELD} tone={a.colour} lit={LIT} shade={SHADE} outline={false} />
      {div.part && (
        <g clipPath={`url(#${id})`}>
          <Shape d={div.part} tone={a.metal} lit={LIT} shade={SHADE} outline={false} />
          <path d={div.line} fill="none" stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />
        </g>
      )}
      <Shape d={charge.d} tone={a.charge} lit={charge.lit}>
        {a.figure === 1 && <path d="M22 33 V28.5 A2 2 0 0 1 26 28.5 V33 Z" fill={INK} />}
      </Shape>
      <path d={SHIELD} fill="none" stroke={INK} strokeWidth={LINE} strokeLinejoin="round" />
    </g>
  );
}
