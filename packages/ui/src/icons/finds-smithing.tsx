// Smithing's finds, drawn as they were found (ART.md): a horseshoe, rivets, a guild seal, a quenching
// flask, an ember that never went out, and an old king's hammer. Ember's own colour stays with the
// fire: the ember here glows in amber.
import { circle, ellipse, Glint, INK, LINE, M, Shape } from './style.tsx';

export function LuckyHorseshoe() {
  return (
    <g>
      <Shape
        d="M9 38 C6 26 9 9 24 8 C39 9 42 26 39 38 L32 38 C34.5 28 33 15.5 24 15 C15 15.5 13.5 28 16 38 Z"
        tone={M.iron}
        lit="M9 38 C6 26 9 9 24 8 C17 11 13 18 13 27 C13 31 13.6 35 14.4 38 Z"
        shade="M39 38 C42 26 39 9 24 8 C31 11 35.5 18 35.5 27 C35.5 31 35 35 34.2 38 Z"
      >
        {[
          [12.2, 31],
          [12.4, 22],
          [16, 14.5],
          [35.8, 31],
          [35.6, 22],
          [32, 14.5],
        ].map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x - 0.9} y={y - 1.4} width={1.8} height={2.8} rx={0.5} fill={INK} />
        ))}
        <Glint x={11.5} y={17} r={1.3} />
      </Shape>
      <path d="M8 38 H17 M31 38 H40" stroke={INK} strokeWidth={LINE} strokeLinecap="round" />
    </g>
  );
}

export function MasterworkRivets() {
  const rivet = (x: number, y: number, rot: number) => (
    <g key={`${x}-${y}`} transform={`rotate(${rot} ${x} ${y})`}>
      <Shape
        d={`M${x - 2.2} ${y} H${x + 2.2} V${y + 11} H${x - 2.2} Z`}
        tone={M.steel}
        lit={`M${x - 2.2} ${y} H${x - 0.6} V${y + 11} H${x - 2.2} Z`}
      />
      <Shape
        d={`M${x - 7} ${y + 0.5} C${x - 7} ${y - 6} ${x + 7} ${y - 6} ${x + 7} ${y + 0.5} Z`}
        tone={M.steel}
        lit={`M${x - 7} ${y + 0.5} C${x - 7} ${y - 4} ${x - 2} ${y - 5} ${x} ${y - 4.6} L${x - 3} ${y + 0.5} Z`}
        shade={`M${x + 7} ${y + 0.5} C${x + 7} ${y - 3} ${x + 5} ${y - 4.4} ${x + 3} ${y - 4.6} L${x + 3.5} ${y + 0.5} Z`}
      >
        <Glint x={x - 3} y={y - 2.3} r={1} />
      </Shape>
    </g>
  );
  return (
    <g>
      {rivet(14, 21, -15)}
      {rivet(33, 15, 12)}
      {rivet(27, 31, 4)}
    </g>
  );
}

export function GuildSmithsSeal() {
  return (
    <g>
      <Shape
        d="M24 5 C28 7 31 5 34 8 C35 12 39 13 40 17 C39 21 42 24 40 28 C37 30 38 34 34 37 C30 37 28 41 24 41 C20 41 18 37 14 37 C10 34 11 30 8 28 C6 24 9 21 8 17 C9 13 13 12 14 8 C17 5 20 7 24 5 Z"
        tone={M.wax}
        lit="M24 5 C20 7 17 5 14 8 C13 12 9 13 8 17 C9 21 6 24 8 28 L16 22 C16 15 20 11 24 11 Z"
        shade="M40 17 C39 21 42 24 40 28 C37 30 38 34 34 37 C30 37 28 41 24 41 L26 35 C32 34 35 29 35 23 Z"
      >
        <path d={circle(24, 23, 11)} fill="none" stroke={M.wax.shadow} strokeWidth={1.4} />
        <path
          d="M15.5 21 H31 C31 23 29.5 24 27.5 24 L26.5 27 H29 V29.5 H19 V27 H21.5 L20.5 24 C18 24 15.5 23 15.5 21 Z"
          fill={M.wax.shadow}
        />
        <Glint x={16} y={13} r={1.4} />
      </Shape>
    </g>
  );
}

export function QuenchingFlask() {
  return (
    <g>
      <Shape
        d="M19.5 6 H28.5 V17 L38.5 37 C40 40.5 38 43 34.5 43 H13.5 C10 43 8 40.5 9.5 37 L19.5 17 Z"
        tone={M.moonstone}
        lit="M19.5 6 H22 V17.5 L12.5 37.5 C11.8 39.2 12.2 41 13.5 43 C10 43 8 40.5 9.5 37 L19.5 17 Z"
        shade="M28.5 6 H26.5 V17.5 L35.5 37.5 C36.2 39.2 35.8 41 34.5 43 C38 43 40 40.5 38.5 37 L28.5 17 Z"
      >
        <path d="M14 29 H34 L38.5 37 C40 40.5 38 43 34.5 43 H13.5 C10 43 8 40.5 9.5 37 Z" fill={M.starIron.base} />
        <path d="M14 29 H34" stroke={M.starIron.light} strokeWidth={1} />
        <Glint x={21} y={21} r={1.3} />
      </Shape>
      <Shape d="M18 2.5 H30 V8 H18 Z" tone={M.leather} lit="M18 2.5 H21 V8 H18 Z" />
    </g>
  );
}

export function EmberOfTheFirstForge() {
  return (
    <g>
      <Shape
        d="M7 31 L12 17 L24 10 L36 14 L42 27 L37 39 L22 42 L11 39 Z"
        tone={M.coal}
        lit="M7 31 L12 17 L24 10 L20 21 Z"
        shade="M36 14 L42 27 L37 39 L22 42 L29 32 Z"
      >
        <path
          d="M14 30 C17 22 22 25 24 19 C27 24 33 21 34 28 C35 33 30 36 24 36 C18 36 13 34 14 30 Z"
          fill={M.amber.base}
          stroke={M.amber.shadow}
          strokeWidth={1}
        />
        <path d={ellipse(24, 30, 5.5, 3.6)} fill={M.amber.light} />
        <Glint x={15} y={21} r={1.2} />
      </Shape>
    </g>
  );
}

export function OldKingsHammer() {
  return (
    <g transform="rotate(40 24 24)">
      <Shape
        d="M21.8 17 H26.2 V46 H21.8 Z"
        tone={M.oak}
        lit="M21.8 17 H23.6 V46 H21.8 Z"
        shade="M25 17 H26.2 V46 H25 Z"
      >
        <path d="M21.8 33 H26.2 M21.8 36 H26.2 M21.8 39 H26.2" stroke={M.leather.shadow} strokeWidth={1.1} />
      </Shape>
      <Shape
        d="M9 5 H39 L37 17 H11 Z"
        tone={M.iron}
        lit="M9 5 H39 L38.6 7.6 H9.4 Z"
        shade="M11.4 14.6 H36.6 L37 17 H11 Z"
      >
        <Glint x={13} y={9.5} r={1.3} />
      </Shape>
      <Shape d="M20 4 H28 V18 H20 Z" tone={M.bronze} lit="M20 4 H22.4 V18 H20 Z" shade="M26 4 H28 V18 H26 Z">
        <path d={circle(24, 11, 1.8)} fill={M.garnet.base} stroke={INK} strokeWidth={0.8} />
      </Shape>
    </g>
  );
}
