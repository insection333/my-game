// The Reliquary's nine war relics (session 41), drawn as the expeditions' relics are (relics.tsx): one
// object each, in its own materials, the light from the upper left.
import { circle, ellipse, Glint, INK, M, Shape } from './style.tsx';

const GLOW = { light: '#e9fbff', base: '#9fe3f5', shadow: '#4ba3c2' };

export function BannerOfTheFirstKing() {
  return (
    <g>
      <Shape d="M9 4 H12.4 V46 H9 Z" tone={M.oak} lit="M9 4 H10.2 V46 H9 Z" />
      <Shape d={circle(10.7, 4, 2.6)} tone={M.amber} />
      <Shape
        d="M12.4 7 H40 L35.5 15 L40 23 L37 25.5 L39 31 L33 28.5 L28 33 L25 28 L12.4 30 Z"
        tone={M.banner}
        lit="M12.4 7 H40 L38.6 9.6 H12.4 Z"
        shade="M12.4 26 L25 24.4 L28 29 L33 25 L37 27 L39 31 L33 28.5 L28 33 L25 28 L12.4 30 Z"
      />
      {/* The first king's crown, in gold on the red. */}
      <Shape
        d="M18 21.5 L17 13.5 L21 17 L24.5 11.5 L28 17 L32 13.5 L31 21.5 Z"
        tone={M.amber}
        lit="M18 21.5 L17 13.5 L21 17 L20 21.5 Z"
      >
        <Glint x={24.4} y={14.6} r={1} />
      </Shape>
    </g>
  );
}

export function AegisShard() {
  return (
    <g>
      <ellipse cx={24} cy={25} rx={18} ry={18} fill={GLOW.light} opacity={0.35} />
      <Shape
        d="M10 14 C16 7 30 6 38 12 L33 21 L36 28 L27 31 L24 42 C16 39 9 31 8 22 Z"
        tone={M.moonsilver}
        lit="M10 14 C16 7 30 6 38 12 L36.6 14.6 C29 10 18 10.4 13 16 C11 21 12 28 15 33 C11 30 8.4 26 8 22 Z"
        shade="M24 42 L27 31 L36 28 L30 33 Z"
      >
        <path d="M14 15 C20 10.6 28 10.4 34 13.4" fill="none" stroke={M.amber.base} strokeWidth={2} />
      </Shape>
      <path d="M33 21 L36 28 L27 31 L24 42" fill="none" stroke={GLOW.base} strokeWidth={1.6} />
      <Shape d={circle(22, 22, 4.4)} tone={GLOW} lit={circle(20.8, 20.8, 2.4)}>
        <Glint x={20.6} y={20.4} r={1.1} />
      </Shape>
    </g>
  );
}

export function WyrmglassLens() {
  return (
    <g>
      <Shape d="M28 31 L42 44 L39 47 L25.5 34 Z" tone={M.bronze} lit="M28 31 L42 44 L41 45 L27 32 Z" />
      <Shape d={circle(20, 20, 15)} tone={M.bronze} lit={circle(17, 17, 9)} />
      <Shape
        d={circle(20, 20, 11)}
        tone={M.goblin}
        lit="M9 20 A11 11 0 0 1 20 9 C14 12 11.6 15.6 11.4 20 Z"
        shade="M31 20 A11 11 0 0 1 20 31 C25 28 28.6 24.6 29 20 Z"
      >
        {/* The wyrm's slit eye, held in the glass. */}
        <path d={ellipse(20, 20, 2, 7)} fill={INK} opacity={0.7} />
        <Glint x={15} y={14.6} r={1.6} />
      </Shape>
    </g>
  );
}

export function SentinelsEye() {
  return (
    <g>
      <path d="M24 2 V8" stroke={M.steel.shadow} strokeWidth={2} />
      <Shape d={circle(24, 9.5, 2.6)} tone={M.steel} />
      <Shape
        d="M4 26 C10 16 17 12 24 12 C31 12 38 16 44 26 C38 36 31 40 24 40 C17 40 10 36 4 26 Z"
        tone={M.steel}
        lit="M4 26 C10 16 17 12 24 12 C18 14 12 19 8.6 26 Z"
        shade="M44 26 C38 36 31 40 24 40 C30 37 35.6 32 39.4 26 Z"
      />
      <Shape
        d="M10 26 C14 19.6 19 17 24 17 C29 17 34 19.6 38 26 C34 32.4 29 35 24 35 C19 35 14 32.4 10 26 Z"
        tone={M.bone}
      />
      <Shape d={circle(24, 26, 7)} tone={M.sapphire} lit={circle(22, 24, 3.6)}>
        <circle cx={24} cy={26} r={3} fill={INK} />
        <Glint x={21.6} y={23.4} r={1.4} />
      </Shape>
    </g>
  );
}

export function OathboundHorn() {
  return (
    <g>
      {/* The baldric it hangs from. */}
      <path d="M9 36 C8 22 20 12 34 13" fill="none" stroke={M.leather.base} strokeWidth={2.2} strokeLinecap="round" />
      <Shape
        d="M4 36 C14 37.5 24 32 30 9 L44 14 C40 35 24 45 5 42 Z"
        tone={M.bone}
        lit="M4 36 C14 37.5 24 32 30 9 L33.4 10.2 C28.6 30 19 39.6 4.6 39 Z"
        shade="M44 14 C40 35 24 45 5 42 L5.2 40.6 C22 41.6 36 33 40.8 12.8 Z"
      />
      {/* Gold at the mouthpiece and bands round the horn. */}
      <Shape d="M3 35 L7 35.6 L7.6 42.4 L3.4 42 Z" tone={M.amber} />
      {['M16 34.6 L19.4 33.2 L22 42.4 L18.6 43.2 Z', 'M25.6 27.8 L28.6 25.4 L34.6 34.6 L31.6 36.6 Z'].map((d) => (
        <Shape key={d} d={d} tone={M.amber} />
      ))}
      <Shape d="M30 9 L44 14 L43 17.4 L29.2 12 Z" tone={M.amber} lit="M30 9 L44 14 L43.7 15 L29.7 10 Z" />
    </g>
  );
}

export function GildedLedger() {
  return (
    <g>
      <Shape d="M10 9 H38 V42 H10 Z" tone={M.wax} lit="M10 9 H14 V42 H10 Z" shade="M34 9 H38 V42 H34 Z" />
      <Shape d="M38 11 H41 V44 H12 V42 H38 Z" tone={M.crumb} lit="M38 11 H39 V44 H38 Z" />
      {[
        [10, 9, 1, 1],
        [38, 9, -1, 1],
        [10, 42, 1, -1],
        [38, 42, -1, -1],
      ].map(([x, y, dx, dy]) => (
        <Shape key={`${x}${y}`} d={`M${x} ${y} H${x + 7 * dx} L${x} ${y + 7 * dy} Z`} tone={M.amber} />
      ))}
      <Shape d={circle(24, 25.5, 6)} tone={M.amber} lit={circle(22.6, 24, 3.2)}>
        <path d="M24 21.5 V29.5 M21.5 23.5 H26.5 M21.5 27.5 H26.5" stroke={M.amber.shadow} strokeWidth={1.2} />
        <Glint x={22} y={23.2} r={1} />
      </Shape>
      <Shape d="M36 22 H44 V29 H36 Z" tone={M.amber} lit="M36 22 H44 V23.4 H36 Z" />
    </g>
  );
}

export function EmberOfSieges() {
  return (
    <g>
      <ellipse cx={24} cy={30} rx={18} ry={14} fill={M.flame.base} opacity={0.25} />
      <Shape
        d="M24 3 C28 9 35 12 33 21 C38 18 39 13 38 10 C44 17 44 27 38 33 L10 33 C4 26 6 18 11 13 C11 17 12.5 19.6 15 21 C13 13 19 9 24 3 Z"
        tone={M.flame}
        lit="M24 3 C19 9 13 13 15 21 C12.5 19.6 11 17 11 13 C6 18 4 26 10 33 L16 33 C11 27 14 18 24 3 Z"
      />
      <Shape d={circle(24, 34, 10)} tone={M.emberOre} lit={circle(21, 31, 5.4)}>
        <path
          d="M17 31 L22 35 L20 40 M26 28 L28 34 L33 36"
          fill="none"
          stroke={M.flame.light}
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
      </Shape>
    </g>
  );
}

export function MendersMortar() {
  return (
    <g>
      {/* A mason's trowel laid over the tub of mortar. */}
      <Shape d="M8 26 H40 L37 44 H11 Z" tone={M.oak} lit="M8 26 H13 L15 44 H11 Z" shade="M35 26 H40 L37 44 H33 Z">
        <path d="M9 32 H39 M10 38 H38" stroke={M.oak.shadow} strokeWidth={1.1} />
      </Shape>
      <Shape d={ellipse(24, 26, 16, 4.6)} tone={M.stone} lit={ellipse(20, 25, 9, 2.4)} />
      <g transform="rotate(-28 26 18)">
        <Shape d="M14 14 L36 14 L32 23 L18 23 Z" tone={M.steel} lit="M14 14 L36 14 L35.3 15.6 L14.7 15.6 Z">
          <Glint x={18} y={16.4} r={1} />
        </Shape>
        <path d="M25 14 V8" stroke={INK} strokeWidth={2.4} />
        <Shape d="M22.5 2 H27.5 V8 H22.5 Z" tone={M.leather} lit="M22.5 2 H24 V8 H22.5 Z" />
      </g>
    </g>
  );
}

export function TidingsStone() {
  return (
    <g>
      <ellipse cx={24} cy={24} rx={17} ry={19} fill={GLOW.light} opacity={0.3} />
      <Shape
        d="M14 44 L11 20 C11 10 17 4 24 4 C31 4 37 10 37 20 L34 44 Z"
        tone={M.moonrock}
        lit="M14 44 L11 20 C11 10 17 4 24 4 C19 7 16 12 16 20 L18 44 Z"
        shade="M34 44 L37 20 C37 14 35 9 31 6.4 C33 11 33 15 32.6 20 L30 44 Z"
      />
      {/* A rune that carries word between castles: two arrows passing. */}
      <path
        d="M19 30 L29 16 M29 16 L24.4 17 M29 16 L28.6 20.6 M29 31 L19 17 M19 17 L19.4 21.6 M19 17 L23.6 17.6"
        fill="none"
        stroke={GLOW.base}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      <path d="M8 44 H40" stroke={INK} strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}
