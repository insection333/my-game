// Kindling's art (session 17, ART.md, Kindling): the flames a kindled skill's seal wears on its rim, one
// for each Kindling up to five, and the three Paths, each its emblem on an ember seal (the round ember
// face marks the family): Bounty a bound sheaf, Lore an open book, Fortune a starred gold coin.
import type { ReactNode } from 'react';
import { circle, Glint, INK, M, Shape, type Tone } from './style.tsx';

const tone = (light: string, base: string, shadow: string): Tone => ({ light, base, shadow });
const EMBER = tone('#a2543a', '#6a3324', '#3d1b12');
const PAGE = tone('#fffaf0', '#efe2c4', '#b9a57d');
const COVER = M.wax;
const WHEAT = tone('#fff0b0', '#e6b84e', '#a0742a');

/** One flame, standing on the seal's rim at the top; turned about the centre to stand elsewhere. */
function Flame({ turn }: { turn: number }) {
  return (
    <g transform={`rotate(${turn} 24 24)`}>
      <Shape
        d="M24 0.6 C26.4 3.6 28.4 5.8 28 8.2 C27.7 10.2 26 11.2 24 11.2 C22 11.2 20.3 10.2 20 8.2 C19.6 5.8 21.6 3.6 24 0.6 Z"
        tone={M.flame}
        shade="M24 0.6 C26.4 3.6 28.4 5.8 28 8.2 C27.7 10.2 26 11.2 24 11.2 C25.4 9.6 26 7.4 24 0.6 Z"
      >
        <path
          d="M24 5 C25.3 6.6 26 7.6 25.8 8.7 C25.6 9.7 24.8 10.1 24 10.1 C23.2 10.1 22.4 9.7 22.2 8.7 C22 7.6 22.7 6.6 24 5 Z"
          fill={M.flame.light}
        />
      </Shape>
    </g>
  );
}

/** The flames on a kindled seal: one to five, spread evenly about the top of the rim. */
export function KindledFlames({ count }: { count: number }) {
  const n = Math.min(5, Math.max(0, Math.floor(count)));
  const step = 26;
  return (
    <g data-flames={n}>
      {Array.from({ length: n }, (_, i) => (
        <Flame key={i} turn={(i - (n - 1) / 2) * step} />
      ))}
    </g>
  );
}

/** The ember seal every Path is drawn on. */
function EmberSeal({ children }: { children: ReactNode }) {
  return (
    <g>
      <Shape
        d={circle(24, 24, 21.5)}
        tone={EMBER}
        lit="M2.5 24 A21.5 21.5 0 0 1 24 2.5 L24 7 A17 17 0 0 0 7 24 Z"
        shade="M45.5 24 A21.5 21.5 0 0 1 24 45.5 L24 41 A17 17 0 0 0 41 24 Z"
      >
        <path d={circle(24, 24, 18.4)} fill="none" stroke={M.flame.base} strokeWidth={1.2} opacity={0.75} />
      </Shape>
      {children}
    </g>
  );
}

/** Bounty: a sheaf of wheat, bound at the waist with a cord. */
export const PathBounty = () => {
  const stalks: [number, number][] = [
    [15, 13],
    [24, 10],
    [33, 13],
  ];
  return (
    <EmberSeal>
      {stalks.map(([x, y]) => (
        <g key={x}>
          <line
            x1={24 + (x - 24) * 0.25}
            y1={39}
            x2={x}
            y2={y + 6}
            stroke={INK}
            strokeWidth={3.4}
            strokeLinecap="round"
          />
          <line
            x1={24 + (x - 24) * 0.25}
            y1={39}
            x2={x}
            y2={y + 6}
            stroke={WHEAT.light}
            strokeWidth={1.4}
            strokeLinecap="round"
          />
        </g>
      ))}
      {stalks.map(([x, y]) => (
        <g key={`ear${x}`} transform={`rotate(${(x - 24) * 1.6} ${x} ${y + 3})`}>
          <Shape
            d={`M${x} ${y - 4} C${x + 3.4} ${y - 1} ${x + 3.4} ${y + 6} ${x} ${y + 9} C${x - 3.4} ${y + 6} ${x - 3.4} ${y - 1} ${x} ${y - 4} Z`}
            tone={WHEAT}
            lit={`M${x} ${y - 4} C${x - 3.4} ${y - 1} ${x - 3.4} ${y + 6} ${x} ${y + 9} Z`}
          >
            {[0, 3.4].map((dy) => (
              <path
                key={dy}
                d={`M${x - 3} ${y + dy} L${x} ${y + dy + 1.6} L${x + 3} ${y + dy}`}
                fill="none"
                stroke={WHEAT.shadow}
                strokeWidth={0.9}
              />
            ))}
          </Shape>
        </g>
      ))}
      <Shape
        d="M18.5 28 C22 26.6 26 26.6 29.5 28 L29.5 31.6 C26 30.2 22 30.2 18.5 31.6 Z"
        tone={M.leather}
        lit="M18.5 28 C22 26.6 26 26.6 29.5 28 L29.5 29.4 C26 28.2 22 28.2 18.5 29.4 Z"
      />
    </EmberSeal>
  );
};

/** Lore: an open book, its pages written. */
export const PathLore = () => (
  <EmberSeal>
    <Shape d="M8 17.5 L8 34.5 C15 32.4 20 33 24 36.5 C28 33 33 32.4 40 34.5 L40 17.5 L24 20 Z" tone={COVER} />
    <Shape
      d="M10 14.6 C15.5 12.6 20.5 13.6 24 16.6 L24 33.6 C20.5 30.8 15.5 30.2 10 32 Z"
      tone={PAGE}
      lit="M10 14.6 C15.5 12.6 20.5 13.6 24 16.6 L24 21 C20.5 18.4 15.5 17.8 10 19.6 Z"
    >
      {[19.6, 23, 26.4].map((y) => (
        <path
          key={y}
          d={`M13 ${y} C16 ${y - 1} 19 ${y - 0.6} 21.6 ${y + 0.6}`}
          fill="none"
          stroke={PAGE.shadow}
          strokeWidth={1}
        />
      ))}
    </Shape>
    <Shape
      d="M38 14.6 C32.5 12.6 27.5 13.6 24 16.6 L24 33.6 C27.5 30.8 32.5 30.2 38 32 Z"
      tone={PAGE}
      shade="M38 24 L38 32 C32.5 30.2 27.5 30.8 24 33.6 L24 28 C28 26 33 25.4 38 24 Z"
    >
      {[19.6, 23, 26.4].map((y) => (
        <path
          key={y}
          d={`M26.4 ${y + 0.6} C29 ${y - 0.6} 32 ${y - 1} 35 ${y}`}
          fill="none"
          stroke={PAGE.shadow}
          strokeWidth={1}
        />
      ))}
    </Shape>
  </EmberSeal>
);

/** Fortune: a gold coin stamped with a four-pointed star. */
export const PathFortune = () => (
  <EmberSeal>
    <Shape
      d={circle(24, 24, 12.5)}
      tone={M.amber}
      lit={circle(21, 21, 8.6)}
      shade="M36.5 24 A12.5 12.5 0 0 1 24 36.5 L24 33 A9 9 0 0 0 33 24 Z"
    >
      <path d={circle(24, 24, 9.4)} fill="none" stroke={M.amber.shadow} strokeWidth={1.1} />
      <path
        d="M24 16.4 L25.9 22.1 L31.6 24 L25.9 25.9 L24 31.6 L22.1 25.9 L16.4 24 L22.1 22.1 Z"
        fill={M.amber.shadow}
      />
      <path d="M24 16.4 L25.9 22.1 L24 24 L16.4 24 L22.1 22.1 Z" fill={M.amber.light} opacity={0.8} />
    </Shape>
    <Glint x={18.6} y={18.4} />
  </EmberSeal>
);
