// What a battle report is drawn with (session 42; ART.md, The castle's works and garrison): the four spy
// missions (a spyglass to scout, a vial to poison the wells, a lit charge to sabotage the gatehouse, a
// sealed order to forge), and what a battle moves: gold, war marks, and gold lost to a raid.
import { circle, ellipse, Glint, INK, M, Shape } from './style.tsx';

export function SpyScout() {
  return (
    <g transform="rotate(-35 24 24)">
      <Shape d="M6 19 H20 V29 H6 Z" tone={M.bronze} lit="M6 19 H20 V21.4 H6 Z" />
      <Shape d="M20 17.5 H33 V30.5 H20 Z" tone={M.leather} lit="M20 17.5 H33 V20 H20 Z">
        <path d="M24 17.5 V30.5 M29 17.5 V30.5" stroke={M.leather.shadow} strokeWidth={1} />
      </Shape>
      <Shape d="M33 15 H42 V33 H33 Z" tone={M.bronze} lit="M33 15 H42 V18 H33 Z" />
      <Shape d={ellipse(42, 24, 2.6, 8)} tone={M.eggshell} lit={ellipse(41.4, 21.4, 1.2, 3.6)} />
      <Shape d={ellipse(6, 24, 1.8, 4.6)} tone={M.iron} />
    </g>
  );
}

export function SpyPoison() {
  return (
    <g>
      <Shape d="M20 4 H28 V9 H20 Z" tone={M.oak} lit="M20 4 H22 V9 H20 Z" />
      <Shape
        d="M21 9 H27 V17 C35 20 39 26 37 34 C35 42 29 45 24 45 C19 45 13 42 11 34 C9 26 13 20 21 17 Z"
        tone={M.eggshell}
        lit="M21 9 H23 V18 C16 21 13 27 14.4 34 C15.4 39 18 42.6 21.4 44.4 C16 43 12.4 39 11 34 C9 26 13 20 21 17 Z"
      >
        <path d="M10 30 C16 28 30 32 38 29 V46 H10 Z" fill={M.goblin.base} />
        <path d="M10 30 C16 28 30 32 38 29" fill="none" stroke={M.goblin.light} strokeWidth={1.6} />
        {[
          [20, 37, 1.6],
          [27, 34, 1.2],
          [24, 40, 1],
        ].map(([x, y, r]) => (
          <circle key={x} cx={x} cy={y} r={r} fill={M.goblin.light} />
        ))}
      </Shape>
      {/* The skull's mark that says what it holds. */}
      <path
        d={`${circle(24, 22.5, 3.2)} M22.2 26 V27.6 M25.8 26 V27.6`}
        fill={M.bone.base}
        stroke={INK}
        strokeWidth={1.2}
      />
      <circle cx={22.8} cy={22.6} r={0.8} fill={INK} />
      <circle cx={25.2} cy={22.6} r={0.8} fill={INK} />
    </g>
  );
}

export function SpySabotage() {
  return (
    <g>
      <Shape d={circle(22, 29, 14)} tone={M.coal} lit={circle(17, 24, 7)}>
        <Glint x={16} y={22} r={1.6} />
      </Shape>
      <Shape d="M28 13 L34 17 L31 20.6 L25.4 16.6 Z" tone={M.iron} lit="M28 13 L34 17 L33.2 18 L27.2 14 Z" />
      <path d="M33 16 C36 12 36 9 40 7" fill="none" stroke={M.straw.shadow} strokeWidth={2} strokeLinecap="round" />
      <Shape
        d="M40 2 C42.4 4 45 5.4 44 8 C43 10.4 39 10.6 37.6 8.4 C36.6 6.6 38.4 4.6 40 2 Z"
        tone={M.flame}
        lit="M40 2 C38.4 4.6 36.6 6.6 37.6 8.4 C38.6 9.8 40.4 10.2 41.6 9.8 C39.6 8.4 39.2 5.4 40 2 Z"
      />
    </g>
  );
}

export function SpyForge() {
  return (
    <g>
      <Shape
        d="M10 8 H36 C38.8 8 40 10 40 12 V40 H14 C11.2 40 10 38 10 36 Z"
        tone={M.crumb}
        lit="M10 8 H15 V40 H14 C11.2 40 10 38 10 36 Z"
        shade="M36 8 C38.8 8 40 10 40 12 V40 H36 Z"
      >
        <path d="M16 15 H34 M16 20 H34 M16 25 H28" stroke={M.crumb.shadow} strokeWidth={1.4} strokeLinecap="round" />
      </Shape>
      <Shape d={circle(30, 34, 7)} tone={M.wax} lit={circle(28.4, 32.4, 3.6)}>
        <path d="M26.6 34 H33.4 M30 30.6 V37.4" stroke={M.wax.shadow} strokeWidth={1.4} />
      </Shape>
      <path d="M26 41 L24 46 M33 41 L35 46" stroke={M.wax.base} strokeWidth={3} strokeLinecap="round" />
    </g>
  );
}

export function Coins() {
  return (
    <g>
      {[
        [17, 36],
        [31, 36],
        [24, 26],
      ].map(([x, y]) => (
        <g key={`${x}${y}`}>
          <Shape d={`M${x - 10} ${y} V${y + 4} A10 3.6 0 0 0 ${x + 10} ${y + 4} V${y} Z`} tone={M.bronze} />
          <Shape d={ellipse(x, y, 10, 3.6)} tone={M.amber} lit={ellipse(x - 2, y - 0.8, 5, 1.6)} />
        </g>
      ))}
      <Shape d={circle(24, 13, 8)} tone={M.amber} lit={circle(22, 11, 4.4)}>
        <path d={circle(24, 13, 5)} fill="none" stroke={M.amber.shadow} strokeWidth={1.1} />
        <Glint x={21.6} y={10.4} r={1.1} />
      </Shape>
    </g>
  );
}

export function WarMarks() {
  return (
    <g>
      <path
        d="M17 32 L13 46 L19 42 L22 46 L24 34 Z M31 32 L35 46 L29 42 L26 46 L24 34 Z"
        fill={M.banner.shadow}
        stroke={INK}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Shape d={circle(24, 21, 15)} tone={M.wax} lit={circle(20, 17, 8)}>
        <path d={circle(24, 21, 11)} fill="none" stroke={M.wax.shadow} strokeWidth={1.2} />
      </Shape>
      <path d="M17 14 L31 28 M31 14 L17 28" stroke={M.amber.light} strokeWidth={2.6} strokeLinecap="round" />
      <path
        d="M15.6 15.4 L18.4 12.6 M32.4 15.4 L29.6 12.6"
        stroke={M.amber.base}
        strokeWidth={2.6}
        strokeLinecap="round"
      />
    </g>
  );
}

export function GoldLost() {
  return (
    <g>
      <Shape
        d="M12 18 C12 13 16 11 18 11 L16 6 H32 L30 11 C32 11 36 13 36 18 C40 24 40 34 34 40 C30 44 18 44 14 40 C8 34 8 24 12 18 Z"
        tone={M.leather}
        lit="M12 18 C12 13 16 11 18 11 L16 6 H19 C18 10 16 14 16 20 C14 26 14 34 18 42.4 C16 41.6 15 41 14 40 C8 34 8 24 12 18 Z"
      >
        <path d="M17 12 H31" stroke={M.leather.shadow} strokeWidth={1.6} />
      </Shape>
      {/* Torn open: its gold spilling. */}
      <path d="M30 30 L34 26 L36 31 L40 29" fill="none" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      <Shape d={circle(39, 37, 4.6)} tone={M.amber} lit={circle(37.8, 35.8, 2.4)} />
      <Shape d={circle(43, 44, 3.4)} tone={M.amber} />
    </g>
  );
}
