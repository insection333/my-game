// The War College's four studies (session 41; ART.md, The castle's works and garrison): logistics a
// supply cart, siegecraft a battering ram, fortification a mason's square on a dressed stone, espionage
// a mask before a dagger.
import { circle, Glint, INK, M, Shape } from './style.tsx';

const Wheel = ({ x, y, r }: { x: number; y: number; r: number }) => (
  <Shape d={circle(x, y, r)} tone={M.oak} lit={circle(x - r * 0.3, y - r * 0.3, r * 0.55)}>
    <path d={`M${x - r} ${y} H${x + r} M${x} ${y - r} V${y + r}`} stroke={M.oak.shadow} strokeWidth={1.2} />
    <circle cx={x} cy={y} r={r * 0.28} fill={INK} />
  </Shape>
);

export function Logistics() {
  return (
    <g>
      <path d="M4 30 L12 30" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
      <Shape d="M10 26 H42 V34 H10 Z" tone={M.oak} lit="M10 26 H42 V27.6 H10 Z" />
      <Shape d="M14 12 H28 V26 H14 Z" tone={M.pine} lit="M14 12 H17 V26 H14 Z" shade="M25 12 H28 V26 H25 Z">
        <path d="M14 12 L28 26 M28 12 L14 26" stroke={M.pine.shadow} strokeWidth={1.2} />
      </Shape>
      <Shape d="M29 8 H40 V26 H29 Z" tone={M.straw} lit="M29 8 H32 V26 H29 Z">
        <path d="M29 14 H40 M29 20 H40" stroke={M.leather.shadow} strokeWidth={1.4} />
      </Shape>
      <Wheel x={17} y={37} r={7} />
      <Wheel x={36} y={37} r={7} />
    </g>
  );
}

export function Siegecraft() {
  return (
    <g>
      <Shape d="M10 20 L24 6 L38 20 L35 20 L24 9 L13 20 Z" tone={M.oak} lit="M10 20 L24 6 L25 7 L12 20 Z" />
      <path d="M17 13 V26 M31 13 V26" stroke={M.leather.shadow} strokeWidth={1.6} />
      <Shape d="M4 23 H38 V31 H4 Z" tone={M.oakBark} lit="M4 23 H38 V25 H4 Z">
        <path d="M12 23 V31 M22 23 V31" stroke={M.oakBark.shadow} strokeWidth={1} />
      </Shape>
      <Shape d="M38 21 H44 C46 23 46 31 44 33 H38 Z" tone={M.iron} lit="M38 21 H44 V23 H38 Z">
        <Glint x={41} y={24.4} r={1} />
      </Shape>
      <Shape d="M8 36 H34 V39 H8 Z" tone={M.oak} />
      <Wheel x={12} y={40} r={5} />
      <Wheel x={30} y={40} r={5} />
    </g>
  );
}

export function Fortification() {
  return (
    <g>
      <Shape d="M6 24 H36 V44 H6 Z" tone={M.stone} lit="M6 24 H10 V44 H6 Z" shade="M31 24 H36 V44 H31 Z">
        <path d="M6 34 H36 M20 24 V34 M14 34 V44 M28 34 V44" stroke={M.stone.shadow} strokeWidth={1.1} />
      </Shape>
      <Shape d="M36 24 L42 18 V38 L36 44 Z" tone={M.stone} shade="M36 24 L42 18 V38 L36 44 Z" />
      <Shape d="M6 24 L12 18 H42 L36 24 Z" tone={M.stone} lit="M6 24 L12 18 H42 L36 24 Z" />
      {/* The mason's square, laid across the stone's corner. */}
      <g transform="rotate(-12 24 16)">
        <Shape d="M14 4 H19 V22 H40 V27 H14 Z" tone={M.steel} lit="M14 4 H15.6 V27 H14 Z">
          <path d="M16.5 8 V12 M16.5 15 V19 M24 24.5 H28 M31 24.5 H35" stroke={M.steel.shadow} strokeWidth={1} />
          <Glint x={15.4} y={7} r={0.9} />
        </Shape>
      </g>
    </g>
  );
}

export function Espionage() {
  return (
    <g>
      <g transform="rotate(40 24 24)">
        <Shape d="M22.4 2 L25.6 2 L26 26 L22 26 Z" tone={M.steel} lit="M22.4 2 L24 2 L24 26 L22 26 Z">
          <Glint x={23.2} y={7} r={0.9} />
        </Shape>
        <Shape d="M16 26 H32 V29.4 H16 Z" tone={M.bronze} />
        <Shape d="M22 29.4 H26 V40 H22 Z" tone={M.leather} />
        <Shape d={circle(24, 42, 2.6)} tone={M.bronze} />
      </g>
      <Shape
        d="M4 20 C10 16 18 17 24 20 C30 17 38 16 44 20 C44 28 38 33 31 32 C28 31.6 26 29 24 27 C22 29 20 31.6 17 32 C10 33 4 28 4 20 Z"
        tone={M.seal}
        lit="M4 20 C10 16 18 17 24 20 C18 19.6 11 19.6 6.6 22.4 C6.4 25.6 7.4 28.4 9.6 30.4 C6 28.4 4 24.6 4 20 Z"
      >
        <path
          d="M10 23 C12 21.6 16 21.6 18 23.4 C16 25.6 12 25.6 10 23 Z M30 23.4 C32 21.6 36 21.6 38 23 C36 25.6 32 25.6 30 23.4 Z"
          fill={INK}
        />
      </Shape>
    </g>
  );
}
