// Cooking's pies and stews (session 13), from tier 3: each mixes the tier's fish with the one before.
// A pie is a dish with a golden crust and two fish heads looking up out of it (the reference the owner
// approved); a stew is a wooden bowl, as the vendor's hearty stew is, with the fish's tail breaking the
// broth. Each tier's fish gives the dish its colour, so pies and stews read apart by tier.
import { ellipse, Glint, INK, LINE, M, Shape, type Tone } from './style.tsx';
import { tone } from './fish.tsx';

/** The fish whose heads and tails show in each dish. */
const HEADS = {
  pike: tone('#cfe0a0', '#6f8a3c', '#3f5222'),
  carp: tone('#f4f8ff', '#b8c8e6', '#6b7ea6'),
  char: tone('#7d6a70', '#4a3a40', '#271c21'),
  salmon: tone('#f4f7f6', '#c3ccce', '#7f8b90'),
  eel: tone('#7d8f96', '#4a5a61', '#2a363b'),
  sturgeon: tone('#fff3cf', '#e2c983', '#a4873f'),
};

/** A fish's head standing up out of a pie's crust, its snout to the sky. */
function Head({ x, y, skin }: { x: number; y: number; skin: Tone }) {
  return (
    <Shape
      d={`M${x - 4.5} ${y + 13} C${x - 5} ${y + 6} ${x - 3} ${y + 1} ${x} ${y - 2} C${x + 3} ${y + 1} ${x + 5} ${y + 6} ${x + 4.5} ${y + 13} Z`}
      tone={skin}
      lit={`M${x - 4.5} ${y + 13} C${x - 5} ${y + 6} ${x - 3} ${y + 1} ${x} ${y - 2} C${x - 1.5} ${y + 3} ${x - 2} ${y + 8} ${x - 1.5} ${y + 13} Z`}
      shade={`M${x + 4.5} ${y + 13} C${x + 5} ${y + 6} ${x + 3} ${y + 1} ${x} ${y - 2} C${x + 2} ${y + 3} ${x + 2.2} ${y + 8} ${x + 1.8} ${y + 13} Z`}
    >
      <path
        d={`M${x - 4} ${y + 8.5} C${x - 1.5} ${y + 9.8} ${x + 1.5} ${y + 9.8} ${x + 4} ${y + 8.5}`}
        fill="none"
        stroke={skin.shadow}
        strokeWidth={1.2}
      />
      <circle cx={x - 1.6} cy={y + 4} r={1.5} fill={INK} />
      <circle cx={x - 2} cy={y + 3.5} r={0.5} fill="#ffffff" />
    </Shape>
  );
}

function Pie({ front, back, crust = M.crust }: { front: Tone; back: Tone; crust?: Tone }) {
  return (
    <g>
      <Shape
        d="M5 29 L8 38.5 C10 42 16 43.5 24 43.5 C32 43.5 38 42 40 38.5 L43 29 Z"
        tone={M.iron}
        lit="M5 29 L8 38.5 C9 40 11 41.1 13 41.9 L11 29 Z"
        shade="M43 29 L40 38.5 C38.8 40.5 36.5 41.9 33.5 42.7 L36 29 Z"
      />
      <Shape
        d={ellipse(24, 28.5, 20, 9.5)}
        tone={crust}
        lit={ellipse(19, 26, 12, 5)}
        shade="M44 28.5 C44 34 35 38 24 38 C33 35.5 40 33 41 26.5 Z"
      >
        <Glint x={10} y={27} r={1.1} />
      </Shape>
      <Head x={17} y={13} skin={front} />
      <Head x={31} y={10} skin={back} />
      {/* The crust's lip in front of each head, where it broke through. */}
      {[
        [17, 26],
        [31, 23],
      ].map(([x, y]) => (
        <Shape
          key={x}
          d={`M${x - 6.5} ${y} C${x - 5} ${y + 3.6} ${x + 5} ${y + 3.6} ${x + 6.5} ${y} C${x + 4} ${y + 1.6} ${x - 4} ${y + 1.6} ${x - 6.5} ${y} Z`}
          tone={crust}
          lit={`M${x - 6.5} ${y} C${x - 5} ${y + 2} ${x - 2} ${y + 2.6} ${x} ${y + 2.7} L${x} ${y + 1.2} C${x - 3} ${y + 1.2} ${x - 5} ${y + 0.8} ${x - 6.5} ${y} Z`}
        />
      ))}
    </g>
  );
}

/** A stew: a wooden bowl of broth, the tier's fish tail rising out of it and a spoon behind. */
function Stew({ broth, tail }: { broth: Tone; tail: Tone }) {
  return (
    <g>
      <path d="M30 22 L44 6" stroke={INK} strokeWidth={4.4} strokeLinecap="round" />
      <path d="M30 22 L44 6" stroke={M.oakWood.base} strokeWidth={2.2} strokeLinecap="round" />
      <Shape
        d="M4 26 C4 37 13 44 24 44 C35 44 44 37 44 26 Z"
        tone={M.oakWood}
        lit="M4 26 C4 33 8 39 14 42 C11 37 10 31 10.5 26 Z"
        shade="M44 26 C44 37 35 44 24 44 C31 41 37 34 37.5 26 Z"
      />
      <Shape d={ellipse(24, 26, 20, 7)} tone={broth} lit={ellipse(18, 24.5, 10, 3.5)}>
        <circle cx={12.5} cy={26.5} r={2.3} fill={M.amber.base} stroke={INK} strokeWidth={0.8} />
        <circle cx={33} cy={27.5} r={1.8} fill={M.leaf.base} stroke={INK} strokeWidth={0.7} />
        <Glint x={10} y={24} r={1.1} />
      </Shape>
      {/* The tail, rising out of the broth. */}
      <Shape
        d="M20 27.5 C20.5 22 21 18 19.5 14 C17.5 11.5 15 10 13.5 7.5 C17 8 19.5 9 21.5 11 C23 8.5 25.5 6.5 29 5.5 C27 8.5 25.5 11 25 14.5 C24.5 18.5 25.5 22.5 26.5 27.5 Z"
        tone={tail}
        lit="M20 27.5 C20.5 22 21 18 19.5 14 C17.5 11.5 15 10 13.5 7.5 C16.5 9.5 19.5 12 21.5 15.5 C22.5 19.5 22 23.5 22.5 27.5 Z"
      />
      <path d="M17.5 27.6 C21 29.3 26 29.3 29 27.6" fill="none" stroke={broth.shadow} strokeWidth={1.4} />
      <path d="M4 26 C4 37 13 44 24 44 C35 44 44 37 44 26" fill="none" stroke={INK} strokeWidth={LINE} />
    </g>
  );
}

export const PikePie = () => <Pie front={HEADS.pike} back={HEADS.pike} />;
export const CarpPie = () => <Pie front={HEADS.carp} back={HEADS.carp} crust={tone('#f7d38c', '#d39a48', '#916026')} />;
export const CharPie = () => <Pie front={HEADS.char} back={HEADS.char} crust={tone('#f2c178', '#c47d33', '#83491b')} />;
export const SalmonStew = () => <Stew broth={tone('#ffd2b0', '#e39a72', '#a65a39')} tail={HEADS.salmon} />;
export const EelStew = () => <Stew broth={tone('#d7d79a', '#9c9a55', '#5f5d2c')} tail={HEADS.eel} />;
export const SturgeonStew = () => <Stew broth={tone('#ffe7a6', '#e2b35a', '#9c7429')} tail={HEADS.sturgeon} />;
