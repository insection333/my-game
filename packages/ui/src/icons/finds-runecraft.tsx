// Runecraft's finds (session 14), drawn as the other finds are (ART.md): what turns up at the standing
// stones, from a stub of chalk to a chart of the ancients' stars.
import { circle, Glint, INK, M, Shape } from './style.tsx';
import { tone } from './fish.tsx';

const R = {
  chalk: tone('#ffffff', '#ecebe4', '#b6b3a6'),
  slate: tone('#8a979c', '#56636a', '#2f393e'),
  seer: tone('#e6cbf8', '#9a63c9', '#5a3384'),
  parchment: tone('#fffaf0', '#f0e2c4', '#c4ad80'),
  gold: tone('#ffe9a3', '#e2b04a', '#94691b'),
  night: tone('#4a5f8a', '#2a3a5e', '#141d33'),
};
const GLOW = '#9ff7ff';

export function ChalkStub() {
  return (
    <g>
      <Shape
        d="M12 32 L30 14 C32 12 35 12 37 14 L40 17 C42 19 42 22 40 24 L22 42 C20 44 17 44 15 42 L12 39 C10 37 10 34 12 32 Z"
        tone={R.chalk}
        lit="M12 32 L30 14 C32 12 35 12 37 14 L15 36.5 C13.5 38 12 38.5 11 37.5 C10.3 35.8 10.8 33.5 12 32 Z"
        shade="M40 24 L22 42 C20 44 17 44 15 42 L36 21 C38 19 39.5 18 41 18.5 C41.8 20.3 41.3 22.5 40 24 Z"
      />
      <path d="M4 44 C8 42 12 43 16 41" fill="none" stroke={R.chalk.shadow} strokeWidth={1.4} strokeLinecap="round" />
    </g>
  );
}

/** A stone with a rune's mark; `cracked` splits it through. */
function RuneStone({ cracked }: { cracked?: boolean }) {
  return (
    <g>
      <Shape
        d="M10 12 C14 7 34 6 38 11 C42 16 42 33 38 38 C34 43 14 43 10 38 C6 33 6 17 10 12 Z"
        tone={R.slate}
        lit="M10 12 C14 7 34 6 38 11 C30 10 18 11 14 15 C11 19 10.5 30 12 39.5 C11 39 10.5 38.6 10 38 C6 33 6 17 10 12 Z"
      >
        <path d="M17 16 L31 34 M31 16 L17 34" stroke={INK} strokeWidth={2.8} strokeLinecap="round" />
        <path d="M17 16 L31 34 M31 16 L17 34" stroke={GLOW} strokeWidth={1.3} strokeLinecap="round" opacity={0.85} />
        {cracked && <path d="M24 7 L21 18 L27 26 L22 43" fill="none" stroke={INK} strokeWidth={2} />}
      </Shape>
    </g>
  );
}
export const CrackedRune = () => <RuneStone cracked />;

export function SeersStone() {
  return (
    <g>
      <Shape d={circle(24, 26, 16)} tone={R.seer} lit={circle(19, 21, 9)}>
        {/* A hole worn through it, to look through. */}
        <path d={circle(26, 28, 4.5)} fill={R.seer.shadow} stroke={INK} strokeWidth={1.2} />
        <Glint x={17} y={18} r={1.8} />
      </Shape>
    </g>
  );
}

export function RubbingOfALostRune() {
  return (
    <g>
      <Shape
        d="M8 9 L40 7 L41 39 C34 37 30 41 24 39 C18 37 14 41 8 40 Z"
        tone={R.parchment}
        lit="M8 9 L40 7 L40 11 L9 13 Z"
      >
        {/* The rune taken in charcoal: dark where the stone stood proud. */}
        <path
          d="M24 13 L24 34 M24 18 L32 24 M24 27 L16 21"
          stroke={R.slate.shadow}
          strokeWidth={4}
          strokeLinecap="round"
          opacity={0.8}
        />
        <path d="M13 15 C16 30 15 31 13 35" fill="none" stroke={R.slate.base} strokeWidth={1} opacity={0.4} />
      </Shape>
    </g>
  );
}

export function RuneOfTheOldKings() {
  return (
    <g>
      <Shape
        d="M10 12 C14 7 34 6 38 11 C42 16 42 33 38 38 C34 43 14 43 10 38 C6 33 6 17 10 12 Z"
        tone={R.gold}
        lit="M10 12 C14 7 34 6 38 11 C30 10 18 11 14 15 C11 19 10.5 30 12 39.5 C11 39 10.5 38.6 10 38 C6 33 6 17 10 12 Z"
        shade="M38 11 C42 16 42 33 38 38 C34 43 14 43 10 38 C18 40 31 40 34.5 36 C37 31 37.5 18 38 11 Z"
      >
        {/* A crown carved over the mark. */}
        <path d="M16 18 L19 13 L24 17 L29 13 L32 18 Z" fill={R.gold.shadow} stroke={INK} strokeWidth={1} />
        <path d="M24 21 L24 36 M24 25 L30 30 M24 31 L18 27" stroke={INK} strokeWidth={2.8} strokeLinecap="round" />
        <path d="M24 21 L24 36 M24 25 L30 30 M24 31 L18 27" stroke="#fff6c8" strokeWidth={1.3} strokeLinecap="round" />
        <Glint x={14} y={14} r={1.4} />
      </Shape>
    </g>
  );
}

export function StarChartOfTheAncients() {
  const stars: [number, number][] = [
    [14, 15],
    [22, 20],
    [31, 14],
    [35, 25],
    [26, 30],
    [16, 33],
  ];
  return (
    <g>
      <Shape d="M6 8 L42 8 L42 40 L6 40 Z" tone={R.night} lit="M6 8 L42 8 L42 11 L6 11 Z">
        <path
          d={`M${stars.map(([x, y]) => `${x} ${y}`).join(' L')}`}
          fill="none"
          stroke={R.gold.light}
          strokeWidth={0.9}
          opacity={0.7}
        />
        {stars.map(([x, y]) => (
          <circle key={`${x},${y}`} cx={x} cy={y} r={1.6} fill="#fff6c8" />
        ))}
      </Shape>
      {/* The chart's rods at top and bottom. */}
      {[8, 40].map((y) => (
        <g key={y}>
          <path d={`M3 ${y} L45 ${y}`} stroke={INK} strokeWidth={4.4} strokeLinecap="round" />
          <path d={`M3 ${y} L45 ${y}`} stroke={M.oakWood.base} strokeWidth={2.4} strokeLinecap="round" />
        </g>
      ))}
    </g>
  );
}
