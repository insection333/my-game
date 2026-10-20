// Finds, drawn as they were found (ART.md). Woodcutting's six: Bird's nest is in the reference set
// (world.tsx); these are the other five. Rarity is said in words beside them, never by colour alone.
import { circle, ellipse, Glint, INK, LINE, M, Shape } from './style.tsx';

/** A faceted lump of amber, glassy, with a tiny fly caught inside. */
export function AmberNugget() {
  return (
    <g>
      <Shape
        d="M8.5 29.5 L11 18 L20 10.5 L31.5 11 L39.5 18.5 L40.5 30 L33 38.5 L20.5 40 Z"
        tone={M.amber}
        lit="M8.5 29.5 L11 18 L20 10.5 L31.5 11 L24.5 19.5 L15.5 24 Z"
        shade="M31.5 11 L39.5 18.5 L40.5 30 L33 38.5 L20.5 40 L26.5 31 L30 22 Z"
      >
        <path
          d="M15.5 24 L24.5 19.5 L31.5 11 M24.5 19.5 L30 22 L26.5 31 L20.5 40 M30 22 L39.5 18.5"
          fill="none"
          stroke={M.amber.shadow}
          strokeWidth={0.9}
          strokeLinejoin="round"
        />
        <ellipse cx={22} cy={29} rx={2.4} ry={1.5} fill={INK} opacity={0.7} transform="rotate(-25 22 29)" />
        <path
          d="M21 27.6 L18.6 25 M23 27.3 L24 24.4"
          stroke={INK}
          strokeWidth={0.8}
          opacity={0.6}
          strokeLinecap="round"
        />
        <Glint x={16} y={18.5} r={1.8} />
        <Glint x={20} y={15} r={0.9} />
      </Shape>
    </g>
  );
}

/** An acorn whittled smooth, a spiral carved into its nut. */
export function CarvedAcorn() {
  return (
    <g>
      <line x1={25} y1={9.5} x2={27.5} y2={4.5} stroke={INK} strokeWidth={4.2} strokeLinecap="round" />
      <line x1={25} y1={9.5} x2={27.5} y2={4.5} stroke={M.oakBark.base} strokeWidth={2.2} strokeLinecap="round" />
      <Shape
        d="M12.5 20 C12.5 32 17.5 40.5 24 43 C30.5 40.5 35.5 32 35.5 20 Z"
        tone={M.oakWood}
        lit="M12.5 20 C12.5 30 15.5 37.5 20 41 C18.5 35 18 27 19.5 20 Z"
        shade="M35.5 20 C35.5 32 30.5 40.5 24 43 C28 37.5 30 30 29.5 20 Z"
      >
        <path
          d="M24 25.5 C27.5 25.5 28.5 29.5 26 31.5 C23.5 33.5 20.5 31 21.5 28.5 C22.2 27 24 27 24.6 28.4"
          fill="none"
          stroke={M.oakWood.shadow}
          strokeWidth={1.3}
          strokeLinecap="round"
        />
      </Shape>
      <Shape
        d="M10 21.5 C10 13.5 16.5 8.5 24 8.5 C31.5 8.5 38 13.5 38 21.5 C30 23.5 18 23.5 10 21.5 Z"
        tone={M.oakBark}
        lit="M10 21.5 C10 13.5 16.5 8.5 24 8.5 C19 10.5 15.5 15 15 22.3 C13 22.1 11.4 21.8 10 21.5 Z"
        shade="M38 21.5 C38 13.5 31.5 8.5 24 8.5 C29.5 11 32.5 16 32.8 22.4 C34.8 22.2 36.5 21.9 38 21.5 Z"
      >
        {['M13 18 L18 12', 'M18.5 20.5 L25.5 11', 'M26 21 L32 13.5', 'M18 12 L24.5 20.8', 'M25 11 L31.5 20.4'].map(
          (d) => (
            <path key={d} d={d} fill="none" stroke={M.oakBark.shadow} strokeWidth={1} strokeLinecap="round" />
          ),
        )}
      </Shape>
    </g>
  );
}

/** A thick round of heartwood stood on its edge, the rings swirling round a dark knot. */
export function HeartwoodKnot() {
  return (
    <g>
      <Shape d={ellipse(27, 24, 15, 19)} tone={M.bark} shade={ellipse(32, 26, 10, 18)} />
      <Shape
        d={ellipse(22, 24, 15, 19)}
        tone={M.heartwood}
        lit={ellipse(18.5, 19.5, 9, 12)}
        shade="M37 24 C37 34.5 30.3 43 22 43 C28 39 31.5 32 31.5 24 C31.5 16 28 9 22 5 C30.3 5 37 13.5 37 24 Z"
      >
        <path d={ellipse(22, 24, 13.2, 17.2)} fill="none" stroke={M.bark.base} strokeWidth={2.2} />
        <path
          d="M12.5 30 C10.5 21 14 13 20 12 M16 33.5 C14 26 16.5 18.5 21.5 17.5 M28 36 C33 31.5 33.5 23 30 18.5 M24.5 37.5 C20 37 16.5 34 15.5 30"
          fill="none"
          stroke={M.heartwood.shadow}
          strokeWidth={1.1}
          strokeLinecap="round"
        />
        <path d={ellipse(25, 23.5, 5, 6.2)} fill="none" stroke={M.heartwood.shadow} strokeWidth={1.2} />
        <path d={ellipse(25.3, 23.6, 2.6, 3.4)} fill={M.bark.base} />
      </Shape>
    </g>
  );
}

/** A winged seed of the silverbark tree: a broad silver wing, veined, on a round seed. */
export function SilverbarkSeed() {
  return (
    <g>
      <Shape
        d="M9.5 34 C9.5 22.5 18 11.5 31 7.5 C38 5.5 42.8 8.8 41.8 14.5 C40.8 20.5 33 26 25 30.5 C21.5 32.5 19.5 35 18.5 39 Z"
        tone={M.silverbark}
        lit="M9.5 34 C9.5 22.5 18 11.5 31 7.5 C24 13 18.5 21 16.5 31 Z"
        shade="M41.8 14.5 C40.8 20.5 33 26 25 30.5 C21.5 32.5 19.5 35 18.5 39 L20 33 C28 27.5 36.5 21.5 41.8 14.5 Z"
      >
        {['M13.5 32 C15 23 21 14.5 29.5 9.8', 'M15 34 C20 25 27.5 16 38.5 10', 'M16.5 36 C23 29.5 31.5 23 40.5 16'].map(
          (d) => (
            <path key={d} d={d} fill="none" stroke={M.silverbark.shadow} strokeWidth={1} strokeLinecap="round" />
          ),
        )}
      </Shape>
      <Shape d={circle(13, 37.5, 6)} tone={M.heartwood} lit={circle(11.6, 36, 3.6)} shade={circle(15.4, 39.8, 4)} />
      <Glint x={11} y={35} r={1.3} />
      <Glint x={30} y={11.5} r={1.2} />
    </g>
  );
}

/** A crown woven of old branches, in leaf at every point. */
export function CrownOfTheOldWood() {
  const leaf = (x: number, y: number, rot: number) => (
    <g transform={`rotate(${rot} ${x} ${y})`}>
      <Shape d={ellipse(x, y, 2.8, 4.6)} tone={M.leaf} lit={ellipse(x - 0.9, y - 1.3, 1.4, 2.6)}>
        <path d={`M${x} ${y - 3.6} V${y + 3.6}`} stroke={M.leaf.shadow} strokeWidth={0.8} />
      </Shape>
    </g>
  );
  return (
    <g>
      <Shape
        d="M8.5 39.5 L7 18 L15.5 27 L17.5 11.5 L24 24.5 L30.5 11.5 L32.5 27 L41 18 L39.5 39.5 C30 42.5 18 42.5 8.5 39.5 Z"
        tone={M.oakBark}
        lit="M8.5 39.5 L7 18 L15.5 27 L17.5 11.5 L20.5 17.5 L19 30 C15 31.5 12 33.5 10.5 39.8 Z"
        shade="M39.5 39.5 L41 18 L32.5 27 L30.5 11.5 L28.5 15.5 L30 31 C34 32.5 37 35 38 40 Z"
      >
        <path
          d="M8 33.5 C18 36.5 30 36.5 40 33.5 M10 29.5 C15 31 20 31.5 24 31.5 M27.5 31.3 C32 31 35.5 30.3 39 29"
          fill="none"
          stroke={M.oakBark.shadow}
          strokeWidth={1.1}
          strokeLinecap="round"
        />
      </Shape>
      <path d="M8.5 39.5 C18 42.5 30 42.5 39.5 39.5" fill="none" stroke={INK} strokeWidth={LINE} />
      {leaf(7, 15, -25)}
      {leaf(17.5, 8.5, -10)}
      {leaf(30.5, 8.5, 10)}
      {leaf(41, 15, 25)}
      <Shape d={circle(24, 21.5, 3)} tone={M.amber} lit={circle(23.2, 20.7, 1.6)}>
        <Glint x={23} y={20.4} r={0.8} />
      </Shape>
    </g>
  );
}
