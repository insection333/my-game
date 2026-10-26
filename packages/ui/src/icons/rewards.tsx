// Rewards: the supply cache a goal pays in, opened with a short reveal. Oak boards, iron bands and a
// brass lock, by the icon rules (ART.md): light from the top left, three tones a material, one ink line.
import { Glint, INK, M, Shape } from './style.tsx';

export function SupplyCache() {
  return (
    <g>
      {/* The body: oak boards, darker on the right and below. */}
      <Shape
        d="M7 22 L41 22 L41 40 C41 41 40 42 39 42 L9 42 C8 42 7 41 7 40 Z"
        tone={M.oak}
        lit="M7 22 L19 22 L15 42 L9 42 C8 42 7 41 7 40 Z"
        shade="M41 22 L41 40 C41 41 40 42 39 42 L33 42 L36 22 Z"
      >
        <path d="M7 31 L41 31" stroke={M.oak.shadow} strokeWidth={1.2} />
      </Shape>
      {/* The lid, rounded, a shade lighter where the light falls on it. */}
      <Shape
        d="M6 22 L6 18 C6 11.5 11 8 17 8 L31 8 C37 8 42 11.5 42 18 L42 22 Z"
        tone={M.oak}
        lit="M6 22 L6 18 C6 11.5 11 8 17 8 L24 8 C16 9.5 12 13 11.5 22 Z"
        shade="M42 22 L42 18 C42 13.5 39.5 10.4 36 9 C38 12 38.6 16 38.5 22 Z"
      />
      {/* Iron bands over lid and body. */}
      {[13, 35].map((x) => (
        <Shape
          key={x}
          d={`M${x - 2} 8.6 L${x + 2} 8.4 L${x + 2} 42 L${x - 2} 42 Z`}
          tone={M.iron}
          lit={`M${x - 2} 8.6 L${x - 0.6} 8.5 L${x - 0.6} 42 L${x - 2} 42 Z`}
        />
      ))}
      <path d="M6 22 L42 22" stroke={INK} strokeWidth={2} />
      {/* The brass lock plate and its keyhole. */}
      <Shape
        d="M20 19 L28 19 L28 28 C28 29 27 30 26 30 L22 30 C21 30 20 29 20 28 Z"
        tone={M.amber}
        lit="M20 19 L24 19 L22.5 30 L22 30 C21 30 20 29 20 28 Z"
      >
        <Glint x={22.2} y={21.2} r={0.9} />
      </Shape>
      <path d="M24 23 L24 26.5" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />
    </g>
  );
}
