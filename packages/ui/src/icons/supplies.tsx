// Step 14's supplies, the reference drawings put to the owner before the family is drawn (ART.md):
// arrows (Archery's), runes (Magic's), whetstones (Melee's) and the keys that open the higher standing
// stones. Each takes its tier's metal or wood, so a tier reads before its shape.
import { circle, ellipse, Glint, INK, M, Shape, type Tone } from './style.tsx';

/** A bundle of three arrows on the diagonal: the tier's metal at the heads, its wood in the shafts. */
export function Arrows({ metal = M.iron, wood = M.oak }: { metal?: Tone; wood?: Tone }) {
  // Fanned from the nocks, so each arrow's head stands apart.
  const fan = [-13, 13, 0];
  return (
    <g>
      {fan.map((deg) => (
        <g key={deg} transform={`rotate(${deg} 11 40)`}>
          {/* Fletching at the nock, low on the left. */}
          <Shape d="M8 44 L6 36 L11.5 39.5 Z" tone={M.feather} />
          <Shape d="M8 44 L16 42 L12.5 36.5 Z" tone={M.banner} />
          <path d="M9 41 L36 14" stroke={INK} strokeWidth={3.8} strokeLinecap="round" />
          <path d="M9 41 L36 14" stroke={wood.base} strokeWidth={1.9} strokeLinecap="round" />
          <Shape d="M33 11 L43 5 L37 15 Z" tone={metal} lit="M33 11 L43 5 L35.5 12.5 Z" />
        </g>
      ))}
    </g>
  );
}

/** A rune: a flat stone, its carved mark glowing in the tier's light. */
export function Rune({ stone = M.stone, glow = '#9ff7ff' }: { stone?: Tone; glow?: string }) {
  return (
    <g>
      <Shape
        d="M10 12 C14 7 34 6 38 11 C42 16 42 33 38 38 C34 43 14 43 10 38 C6 33 6 17 10 12 Z"
        tone={stone}
        lit="M10 12 C14 7 34 6 38 11 C30 10 18 11 14 15 C11 19 10.5 30 12 39.5 C11 39 10.5 38.6 10 38 C6 33 6 17 10 12 Z"
        shade="M38 11 C42 16 42 33 38 38 C34 43 14 43 10 38 C18 40 31 40 34.5 36 C37 31 37.5 18 38 11 Z"
      >
        <path
          d="M24 13 L24 36 M24 18 L32 24 M24 27 L16 21"
          fill="none"
          stroke={glow}
          strokeWidth={5}
          strokeLinecap="round"
          opacity={0.35}
        />
        <path
          d="M24 13 L24 36 M24 18 L32 24 M24 27 L16 21"
          fill="none"
          stroke={INK}
          strokeWidth={2.8}
          strokeLinecap="round"
        />
        <path
          d="M24 13 L24 36 M24 18 L32 24 M24 27 L16 21"
          fill="none"
          stroke={glow}
          strokeWidth={1.4}
          strokeLinecap="round"
        />
      </Shape>
    </g>
  );
}

/** A whetstone: a long grey stone on the diagonal, bound in the tier's metal at its middle. */
export function Whetstone({ metal = M.iron }: { metal?: Tone }) {
  return (
    <g>
      <Shape
        d="M6 36 L32 8 C34 6 37 6 39.5 8.5 L41 10 C43 12 43 15 41 17 L15 45 C13 47 10 47 8 45 L6 43 C4 41 4 38 6 36 Z"
        tone={M.stone}
        lit="M6 36 L32 8 C34 6 37 6 39.5 8.5 L11 39 C9 41 7.5 42.5 6.5 43.5 C4.5 41 4.5 38 6 36 Z"
        shade="M41 17 L15 45 C13 47 10 47 8 45 L36 15 C38 13 40 12 41.5 11 C42.6 13 42.4 15.5 41 17 Z"
      >
        <path d="M14 33 L30 16" stroke={M.stone.light} strokeWidth={1} opacity={0.7} />
        {/* The grit of the stone. */}
        {[
          [11, 39],
          [29, 14],
          [33, 13],
          [12.5, 42],
          [31, 19],
          [35.5, 16],
        ].map(([x, y]) => (
          <circle key={`${x},${y}`} cx={x} cy={y} r={0.8} fill={M.stone.shadow} />
        ))}
      </Shape>
      <Shape d="M18 24 L25 31 L22 34.5 L15 27.5 Z" tone={metal} lit="M18 24 L25 31 L23.5 32.7 L16.5 25.7 Z">
        <Glint x={19} y={26} r={0.9} />
      </Shape>
    </g>
  );
}

/** A key bound from bars: the tier's metal, a rune-stone set in its bow. */
export function StoneKey({ metal = M.steel, glow = '#9ff7ff' }: { metal?: Tone; glow?: string }) {
  return (
    <g>
      <Shape
        d="M20 22 L40 42 L36.5 45.5 L33 42 L30.5 44.5 L27.5 41.5 L30 39 L28 37 L25.5 39.5 L22.5 36.5 L25 34 L16.5 25.5 Z"
        tone={metal}
        lit="M20 22 L40 42 L38.5 43.5 L18.5 23.5 Z"
      />
      <Shape
        d={`${circle(15, 15, 11.5)} M15 9 a6 6 0 1 1 0 12 a6 6 0 1 1 0 -12 Z`}
        tone={metal}
        lit="M3.5 15 A11.5 11.5 0 0 1 15 3.5 L15 9 A6 6 0 0 0 9 15 Z"
        shade="M26.5 15 A11.5 11.5 0 0 1 15 26.5 L15 21 A6 6 0 0 0 21 15 Z"
      />
      <Shape d={ellipse(15, 15, 4.6, 4.6)} tone={M.stone} lit={ellipse(13.8, 13.8, 2.3, 2.3)}>
        <path d="M15 12 L15 18 M12.5 15 L17.5 15" stroke={glow} strokeWidth={1.4} strokeLinecap="round" />
      </Shape>
    </g>
  );
}
