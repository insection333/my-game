// Magic's finds, drawn as they were found (ART.md): a glimmer stone, a wisp in a lantern, a tablet
// scratched with runes, a wight's ring, an orb of star glass and a sorcerer's eye.
import { circle, ellipse, hole, Glint, INK, M, Shape } from './style.tsx';

/** A four-pointed sparkle. */
const Sparkle = ({ x, y, r }: { x: number; y: number; r: number }) => (
  <path
    d={`M${x} ${y - r} L${x + r * 0.28} ${y - r * 0.28} L${x + r} ${y} L${x + r * 0.28} ${y + r * 0.28} L${x} ${y + r} L${x - r * 0.28} ${y + r * 0.28} L${x - r} ${y} L${x - r * 0.28} ${y - r * 0.28} Z`}
    fill="#ffffff"
    stroke={INK}
    strokeWidth={0.8}
    strokeLinejoin="round"
  />
);

export function GlimmerStone() {
  return (
    <g>
      <Shape
        d="M7 30 C6 20 14 12 25 12 C36 12 43 19 42 29 C41 38 33 42 24 42 C14 42 7.5 37 7 30 Z"
        tone={M.moonstone}
        lit="M7 30 C6 20 14 12 25 12 C18 15 14 21 14 28 C14 33 15.5 37 18 40.5 C11.5 38.5 7.5 34.5 7 30 Z"
        shade="M42 29 C41 38 33 42 24 42 C30.5 39 35 34 35.5 27 C36 21 34 16.5 30.5 13 C38 15 42.5 21 42 29 Z"
      >
        <Glint x={14} y={21} r={1.6} />
      </Shape>
      <Sparkle x={37} y={8} r={5} />
      <Sparkle x={9} y={10} r={3} />
    </g>
  );
}

export function WispLantern() {
  return (
    <g>
      <path d="M17 9 C17 2 31 2 31 9" fill="none" stroke={INK} strokeWidth={3.6} />
      <path d="M17 9 C17 2 31 2 31 9" fill="none" stroke={M.iron.base} strokeWidth={1.6} />
      <Shape d="M13 8 H35 L37 13 H11 Z" tone={M.iron} lit="M13 8 H20 L19 13 H11 Z" />
      <Shape d="M13 13 H35 V38 H13 Z" tone={M.wisp} lit="M13 13 H20 V38 H13 Z" shade="M30 13 H35 V38 H30 Z">
        <path
          d="M24 17 C29 22 30 27 28 31 C26.5 34 21.5 34 20 31 C18.5 28 20 25 22 23 C22.5 25.5 24 26 24.5 24 C25 22 24.5 19.5 24 17 Z"
          fill="#ffffff"
          stroke={M.wisp.shadow}
          strokeWidth={1}
        />
      </Shape>
      <path d="M24 13 V38" stroke={INK} strokeWidth={1.4} />
      <Shape d="M11 38 H37 L35 44 H13 Z" tone={M.iron} lit="M11 38 H18 L17 44 H13 Z" shade="M30 38 H37 L35 44 H29 Z" />
    </g>
  );
}

export function RuneScratchedTablet() {
  return (
    <g>
      <Shape
        d="M9 44 L9 14 C9 7 15 4 24 4 C33 4 39 7 39 14 L39 44 Z"
        tone={M.stone}
        lit="M9 44 L9 14 C9 7 15 4 24 4 C18 6 15 10 15 15 L15 44 Z"
        shade="M39 14 L39 44 L33 44 L33 14 C33 10 31 7 28 5 C35 6 39 9 39 14 Z"
      >
        {[
          'M17 14 L17 22 L21 18',
          'M25 13 L29 22 M29 13 L25 22',
          'M17 28 L21 36 L21 28',
          'M26 28 L26 37 M24 31 L30 31 L28 35',
        ].map((d) => (
          <path
            key={d}
            d={d}
            fill="none"
            stroke={M.stone.shadow}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        <path d="M30 37 L36 41" stroke={INK} strokeWidth={1} />
      </Shape>
    </g>
  );
}

export function WightsRing() {
  return (
    <g>
      <Shape
        d={`${ellipse(24, 30, 16, 12)} ${hole(24, 30, 10.5, 7)}`}
        tone={M.wight}
        lit={ellipse(16, 25, 9, 6)}
        shade="M40 30 C40 37 33 42 24 42 C31 39 35.5 35 35.5 30 Z"
      >
        <Glint x={12} y={26} r={1.2} />
      </Shape>
      <Shape d="M15 18 L24 8 L33 18 L24 24 Z" tone={M.iron} />
      <Shape d={ellipse(24, 15.5, 5.6, 5)} tone={M.sapphire} lit={ellipse(22.5, 14, 2.8, 2.4)}>
        <Glint x={22} y={13.5} r={1} />
      </Shape>
    </g>
  );
}

export function StarGlassOrb() {
  return (
    <g>
      <Shape
        d="M12 44 C12 38 17 36 24 36 C31 36 36 38 36 44 Z"
        tone={M.bronze}
        lit="M12 44 C12 38 17 36 24 36 C19 38 17.5 41 18 44 Z"
      />
      <Shape
        d={circle(24, 21, 16)}
        tone={M.starIron}
        lit={circle(19, 16, 9)}
        shade="M40 21 C40 30 33 37 24 37 C32 33 35.5 27 35 19 C34.5 13 31 8.5 26 5.2 C34 6 40 13 40 21 Z"
      >
        {[
          [30, 14, 1],
          [17, 26, 0.9],
          [27, 29, 1.1],
          [33, 22, 0.7],
          [21, 12, 0.7],
        ].map(([x, y, r]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="#ffffff" />
        ))}
        <Glint x={15} y={14} r={1.8} />
      </Shape>
    </g>
  );
}

export function SorcerersEye() {
  return (
    <g>
      <path d="M8 4 L18 13 M40 4 L30 13" stroke={M.bronze.shadow} strokeWidth={1.6} strokeDasharray="2 1.4" />
      <Shape
        d="M4 27 C10 16 17 12 24 12 C31 12 38 16 44 27 C38 38 31 42 24 42 C17 42 10 38 4 27 Z"
        tone={M.bronze}
        lit="M4 27 C10 16 17 12 24 12 C18 15 13 20 10 27 Z"
        shade="M44 27 C38 38 31 42 24 42 C30 39 35 34 38 27 Z"
      />
      <Shape d={ellipse(24, 27, 13, 9.5)} tone={M.bone} shade="M37 27 C34 33 29 36.5 24 36.5 C29 34 32 31 33 27 Z" />
      <Shape d={circle(24, 27, 7)} tone={M.amethyst} lit={circle(22, 25, 4)}>
        <circle cx={24.5} cy={27.5} r={3} fill={INK} />
        <Glint x={21.6} y={24.4} r={1.3} />
      </Shape>
    </g>
  );
}
