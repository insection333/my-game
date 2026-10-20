// Melee's and Archery's finds, drawn as they were found (ART.md). Melee: a trophy cup, a raider's
// horn, a torn banner, a warlord's seal, a shard of a king's blade, a troll chief's tooth. Archery:
// goose fletchings, a hunter's charm, a silver arrowhead, a bowman's ring, a moonlit bowstring and an
// eagle-feather circlet.
import { circle, ellipse, hole, Glint, INK, LINE, M, Shape, type Tone } from './style.tsx';

export function BattleTrophy() {
  return (
    <g>
      <path
        d="M12 12 C3 12 3 25 14 26 M36 12 C45 12 45 25 34 26"
        fill="none"
        stroke={INK}
        strokeWidth={4.6}
        strokeLinecap="round"
      />
      <path
        d="M12 12 C3 12 3 25 14 26 M36 12 C45 12 45 25 34 26"
        fill="none"
        stroke={M.bronze.base}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      <Shape d="M15 44 L33 44 L31 38 L17 38 Z" tone={M.bronze} lit="M15 44 L17 38 L21 38 L20 44 Z" />
      <Shape d="M21.5 38 L26.5 38 L25.5 31 L22.5 31 Z" tone={M.bronze} />
      <Shape
        d="M10 7 L38 7 C38 21 33 31 24 31 C15 31 10 21 10 7 Z"
        tone={M.bronze}
        lit="M10 7 L18 7 C17.5 17 19 25 22 30.8 C15 29.5 10 20 10 7 Z"
        shade="M38 7 C38 21 33 31 24 31 C29 28 32 20 32 7 Z"
      >
        <path d="M12 12 H36" stroke={M.bronze.shadow} strokeWidth={1.4} />
        <Glint x={14.5} y={16} />
      </Shape>
    </g>
  );
}

export function RaidersWarHorn() {
  return (
    <g>
      <path d="M12 30 C16 40 32 40 38 30" fill="none" stroke={M.leather.shadow} strokeWidth={2} />
      <Shape
        d="M4 23 C6 15 13 12 19 15 C27 19 33 20 40 13 C43 10 45 8 46 7 C45 13 41 22 34 27 C27 32 19 32 12 31 C9 34 4 31 4 23 Z"
        tone={M.bone}
        lit="M4 23 C6 15 13 12 19 15 C27 19 33 20 40 13 C35 21 26 23 19 21 C13 19 8 21 5.5 27 C4.5 26 4 24.7 4 23 Z"
        shade="M46 7 C45 13 41 22 34 27 C27 32 19 32 12 31 C21 28 31 25 37 17 C40 13 43 10 46 7 Z"
      >
        {['M18 14 L13.5 31.5', 'M30 18.5 L27 30.5'].map((d) => (
          <g key={d}>
            <path d={d} stroke={INK} strokeWidth={4.4} />
            <path d={d} stroke={M.bronze.base} strokeWidth={2.6} />
          </g>
        ))}
      </Shape>
      <Shape d={ellipse(7, 25.5, 3.4, 6.5)} tone={M.bone} shade={ellipse(8, 26, 2, 4.6)}>
        <ellipse cx={8} cy={26} rx={2} ry={4.4} fill={INK} />
      </Shape>
    </g>
  );
}

export function TornBanner() {
  return (
    <g>
      <path d="M10 4 V46" stroke={INK} strokeWidth={5} strokeLinecap="round" />
      <path d="M10 4 V46" stroke={M.oakWood.base} strokeWidth={2.6} strokeLinecap="round" />
      <Shape
        d="M12 8 L42 8 L41 33 L36 29 L33 37 L28 31 L23 38 L19 32 L12 35 Z"
        tone={M.banner}
        lit="M12 8 L20 8 L19.5 32 L12 35 Z"
        shade="M42 8 L41 33 L36 29 L34 33 L35.5 8 Z"
      >
        <path
          d="M20 15 L27 23 L34 15 M20 21 L27 29 L34 21"
          fill="none"
          stroke={M.bronze.base}
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Shape>
      <path d="M8 8 H44" stroke={INK} strokeWidth={LINE + 1.2} strokeLinecap="round" />
    </g>
  );
}

export function WarlordsSeal() {
  return (
    <g>
      <Shape d="M18 34 L13 46 L18 43 L21 46 L24 35 Z M30 34 L35 46 L30 43 L27 46 L24 35 Z" tone={M.banner} />
      <Shape
        d="M24 4 C31 4 33 7 37.5 9.5 C41.5 13 44 17 44 23 C44 34 35 41 24 41 C13 41 4 34 4 23 C4 17 6.5 13 10.5 9.5 C15 7 17 4 24 4 Z"
        tone={M.wax}
        lit="M4 23 C4 17 6.5 13 10.5 9.5 C15 7 17 4 24 4 C16 8 11 15 11 23 C11 29 13 34 17 38 C9.5 35 4 29.5 4 23 Z"
        shade="M44 23 C44 34 35 41 24 41 C31 37 36.5 31 36.5 22.5 C36.5 16 34 11 30 6 C38.5 9 44 15 44 23 Z"
      >
        <circle cx={24} cy={22.5} r={11} fill={M.wax.shadow} />
        <path d="M16 28 L16 17 L20 21.5 L24 14 L28 21.5 L32 17 L32 28 Z" fill={M.wax.light} />
        <Glint x={11} y={16} r={1.2} />
      </Shape>
    </g>
  );
}

export function ShardOfAKingsBlade() {
  return (
    <g>
      <Shape
        d="M6 42 L30 10 L34 13 L37 9 L42 7 L40 13 L38 17 L41 18 L16 46 L12 44 L9 46 Z"
        tone={M.steel}
        lit="M6 42 L30 10 L34 13 L11.5 43.5 Z"
        shade="M41 18 L16 46 L12 44 L37 15.5 Z"
      >
        <path d="M11 43 L36 12" stroke={M.bronze.base} strokeWidth={1.6} />
        <Glint x={27} y={16} r={1.3} />
      </Shape>
    </g>
  );
}

export function TrollChiefsTooth() {
  return (
    <g>
      <path d="M10 4 C14 13 34 13 38 4" fill="none" stroke={INK} strokeWidth={3.6} strokeLinecap="round" />
      <path d="M10 4 C14 13 34 13 38 4" fill="none" stroke={M.leather.base} strokeWidth={1.8} strokeLinecap="round" />
      <Shape
        d="M15 16 C22 13 31 14 36 17 C35 28 30 38 21 45 C22 37 20 28 15 16 Z"
        tone={M.bone}
        lit="M15 16 C19 14.5 22 14 25 14 C25 24 23.5 35 21 45 C22 37 20 28 15 16 Z"
        shade="M36 17 C35 28 30 38 21 45 C26 36 29 26 30 16 C32.5 16.2 34.5 16.5 36 17 Z"
      />
      <Shape d="M14 11.5 H37 V18 H14 Z" tone={M.bronze} lit="M14 11.5 H37 V13.5 H14 Z" />
    </g>
  );
}

/** A feather on the diagonal, its vane in `tone`, quill pale. */
const Feather = ({ x, y, rot, tone }: { x: number; y: number; rot: number; tone: Tone }) => (
  <g transform={`rotate(${rot} ${x} ${y})`}>
    <Shape
      d={`M${x} ${y} C${x - 5} ${y - 9} ${x - 4.5} ${y - 22} ${x} ${y - 30} C${x + 4.5} ${y - 22} ${x + 5} ${y - 9} ${x} ${y} Z`}
      tone={tone}
      lit={`M${x} ${y} C${x - 5} ${y - 9} ${x - 4.5} ${y - 22} ${x} ${y - 30} Z`}
    >
      <path d={`M${x} ${y + 2} L${x} ${y - 27}`} stroke={tone.shadow} strokeWidth={0.9} />
    </Shape>
  </g>
);

export function GooseFletchings() {
  return (
    <g>
      <Feather x={20} y={42} rot={-28} tone={M.feather} />
      <Feather x={24} y={43} rot={0} tone={M.feather} />
      <Feather x={28} y={42} rot={28} tone={M.feather} />
      <Shape d={ellipse(24, 41.5, 6, 3.2)} tone={M.leather} lit={ellipse(22.5, 40.5, 3, 1.4)} />
    </g>
  );
}

export function HuntersCharm() {
  return (
    <g>
      <path
        d="M14 4 C14 12 20 16 24 16 C28 16 34 12 34 4"
        fill="none"
        stroke={INK}
        strokeWidth={3.6}
        strokeLinecap="round"
      />
      <path
        d="M14 4 C14 12 20 16 24 16 C28 16 34 12 34 4"
        fill="none"
        stroke={M.leather.base}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Shape
        d={circle(24, 30, 13)}
        tone={M.bone}
        lit={circle(21, 27, 8.5)}
        shade="M37 30 C37 37 31 43 24 43 C30 40 33.5 35.5 33.5 29 C33.5 24 31 20 28 18 C33 19.5 37 24 37 30 Z"
      >
        <path
          d="M24 39 C17 34 17 25 24 21 C31 25 31 34 24 39 Z M24 39 V22"
          fill="none"
          stroke={M.leather.shadow}
          strokeWidth={1.4}
          strokeLinejoin="round"
        />
      </Shape>
    </g>
  );
}

export function SilverArrowhead() {
  return (
    <g>
      <path d="M5 43 L22 26" stroke={INK} strokeWidth={4.6} strokeLinecap="round" />
      <path d="M5 43 L22 26" stroke={M.pine.base} strokeWidth={2.4} strokeLinecap="round" />
      <Shape
        d="M43 5 L36 26 L30 22 L24 27 L21 24 L26 18 L22 12 Z"
        tone={M.steel}
        lit="M43 5 L22 12 L26 18 Z"
        shade="M43 5 L36 26 L30 22 Z"
      >
        <path d="M43 5 L26 22" stroke={M.steel.shadow} strokeWidth={1} />
        <Glint x={29} y={13} r={1.3} />
      </Shape>
    </g>
  );
}

export function BowmansRing() {
  return (
    <g>
      <Shape
        d="M6 22 C6 13 14 8 24 8 C34 8 42 13 42 22 L42 28 C42 37 34 42 24 42 C14 42 6 37 6 28 Z"
        tone={M.bronze}
        lit="M6 22 C6 13 14 8 24 8 C17 10 12 15 12 22 L12 30 C12 33 13 36 15 38.5 C9.5 36 6 32.5 6 28 Z"
        shade="M42 22 L42 28 C42 37 34 42 24 42 C31 39.5 36 34.5 36 28 L36 22 C36 16 33 11.5 28.5 8.5 C36.5 10 42 15 42 22 Z"
      >
        <Glint x={11} y={17} />
      </Shape>
      <Shape d={ellipse(24, 22, 11, 7.5)} tone={M.bronze} shade={ellipse(24, 22, 11, 7.5)}>
        <ellipse cx={24} cy={23.5} rx={9} ry={5.5} fill={INK} />
      </Shape>
    </g>
  );
}

export function MoonlitBowstring() {
  // A coiled string, its loose end trailing, under a crescent moon.
  const coil =
    'M24 27 A2 2 0 0 0 20 27 A4 4 0 0 0 28 27 A6 6 0 0 0 16 27 A8 8 0 0 0 32 27 A10 10 0 0 0 12 27 A12 12 0 0 0 36 27 C36 34 40 38 43 44';
  return (
    <g>
      <path d={coil} fill="none" stroke={INK} strokeWidth={4.4} strokeLinecap="round" />
      <path d={coil} fill="none" stroke={M.moonstone.base} strokeWidth={2.2} strokeLinecap="round" />
      <path
        d="M13 20 A10 10 0 0 1 22 17"
        fill="none"
        stroke={M.moonstone.light}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
      <Shape
        d="M38 3 C32 5 30 13 34 18 C38 22 44 20 46 16 C41 17 36.5 13 38 3 Z"
        tone={M.moonstone}
        lit="M38 3 C32 5 30 13 34 18 C33 13 34.5 7 38 3 Z"
      />
    </g>
  );
}

export function EagleFeatherCirclet() {
  return (
    <g>
      <Feather x={15} y={33} rot={-32} tone={M.eagle} />
      <Feather x={18} y={31} rot={-10} tone={M.eagle} />
      <Shape d={`${ellipse(24, 33, 20, 9)} ${hole(24, 32, 15.5, 5.5)}`} tone={M.bronze} lit={ellipse(17, 29, 10, 3.5)}>
        <Glint x={10} y={31} r={1.2} />
      </Shape>
      <Shape d={circle(24, 41.2, 2.6)} tone={M.sapphire} lit={circle(23.2, 40.4, 1.3)} />
    </g>
  );
}
