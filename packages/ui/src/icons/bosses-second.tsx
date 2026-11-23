// The second boss of each region (session 210), drawn as the first three are (ART.md, bosses.tsx): busts in
// left-facing profile, light from the upper left, the eye the brightest point, each wearing what marks it
// out: the Barrow-king a broken bronze circlet over a wight's face in a grave-hood, the Mire-mother a bog
// hag's wide mouth and the reeds growing on her back, the Storm-roc a hooked golden beak and a crest
// crossed by lightning.
import { Eye, shoulders } from './foes.tsx';
import { circle, Glint, INK, M, Shape } from './style.tsx';

/** A glowing seam: a dark line with a bright core. */
const Glow = ({ d, under, over }: { d: string; under: string; over: string }) => (
  <g>
    <path d={d} fill="none" stroke={under} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <path d={d} fill="none" stroke={over} strokeWidth={0.7} strokeLinecap="round" strokeLinejoin="round" />
  </g>
);
const GRAVE = '#b8ffcf';

export function BarrowKing() {
  return (
    <g>
      <Shape d={shoulders(35)} tone={M.cloak} lit="M5 46 C6 40 13 35 24 35 C17 37 13 41 12 46 Z" />
      {/* The grave-hood, ragged at its hem. */}
      <Shape
        d="M8 34 C5 21 11 8 25 7 C37 6.5 44 15 43 27 C42.5 33 40 38 36 41 L33 38 L30 42 L27 39 L22 42 C15 41 10 38.5 8 34 Z"
        tone={M.cloak}
        lit="M8 34 C5 21 11 8 25 7 C17 10.5 12.5 17 11.5 25 C11 29 11.5 32.5 13 36 C10.6 35.6 9 35 8 34 Z"
        shade="M43 27 C42.5 33 40 38 36 41 L33 38 L30 42 L29 39 C34.5 35.5 37.4 30 37.6 23.5 C37.8 17 35 12.5 31 9.4 C38.5 11.5 43.4 18 43 27 Z"
      />
      {/* The gaunt face, turned to the left. */}
      <Shape
        d="M7 29 C6 21 10 15.5 17 14 C23 12.8 28 15.5 28.6 21.5 C29.2 27 27 31.5 23 34 L18.5 36.4 C14 37.4 10.6 36 9 33 C8.2 31.8 7.4 30.5 7 29 Z"
        tone={M.wight}
        lit="M7 29 C6 21 10 15.5 17 14 C13 17 11 21 11 25.6 C11 28.4 10.4 30.8 9 33 C8.2 31.8 7.4 30.5 7 29 Z"
        shade="M28.6 21.5 C29.2 27 27 31.5 23 34 L20 35.6 C23.6 32 25 27.6 24.4 22.4 C24 19 22.6 16.4 20.4 14.4 C25 14.6 28.2 17.4 28.6 21.5 Z"
      >
        {/* The sunken cheek, and the grin of a skull. */}
        <path d="M12 26 C14 28.5 17 29 20 28" fill="none" stroke={M.wight.shadow} strokeWidth={1.2} />
        <path d="M8.6 31.4 C11.6 32.4 14.6 32.2 17.6 31" fill="none" stroke={INK} strokeWidth={1.1} />
        <path d="M10.4 31.6 L10.8 33.2 M13 32 L13.2 33.6 M15.6 31.8 L15.6 33.4" stroke={INK} strokeWidth={0.8} />
      </Shape>
      {/* The circlet of old bronze, one of its points broken off. */}
      <Shape
        d="M10 15.5 L10.6 7.5 L15 11.6 L19 4.6 L22.4 11 L25.4 9.4 L28 12.6 L31 7 L32.2 15 C25 12.6 17.4 13 10 15.5 Z"
        tone={M.bronze}
        lit="M10 15.5 L10.6 7.5 L15 11.6 L19 4.6 L18.6 12.4 C15.6 13.2 12.8 14.2 10 15.5 Z"
      >
        <circle cx={21} cy={12.6} r={1.3} fill={GRAVE} />
      </Shape>
      <Glint x={13} y={9.5} r={0.9} />
      {/* Grave-light breathed from the mouth. */}
      <Glow d="M7 31 C4.5 30 3.5 27.5 4.6 25" under={M.wisp.shadow} over={GRAVE} />
      <Eye x={14.4} y={21.6} glow={GRAVE} r={2} />
    </g>
  );
}

export function MireMother() {
  return (
    <g>
      {/* Reeds and moss grown up from her back. */}
      {[
        [35, 4],
        [39, 7],
        [42.5, 11],
      ].map(([x, y]) => (
        <g key={x}>
          <path d={`M${x - 3} 20 C${x - 2} 14 ${x - 1} 9 ${x} ${y}`} fill="none" stroke={INK} strokeWidth={2.6} />
          <path
            d={`M${x - 3} 20 C${x - 2} 14 ${x - 1} 9 ${x} ${y}`}
            fill="none"
            stroke={M.reed.base}
            strokeWidth={1.2}
          />
        </g>
      ))}
      <Shape d={shoulders(31)} tone={M.bog} lit="M5 46 C6 37 13 31 24 31 C17 34 13 39 12 46 Z" />
      {/* The wide, flat head of a bog-hag, her mouth a long seam. */}
      <Shape
        d="M3 30 C2 22 8 15 18 13 C29 11 39 14.5 42 22 C44.4 28.4 41.6 35.6 34 38.6 L12 40 C7 38.6 3.6 35 3 30 Z"
        tone={M.bog}
        lit="M3 30 C2 22 8 15 18 13 C12 17 8.4 21.6 8 27 C7.8 30.4 8.4 33.4 10 36.4 C6 35.4 3.4 33 3 30 Z"
        shade="M42 22 C44.4 28.4 41.6 35.6 34 38.6 L28 39 C35 35.4 38 30 37.4 23.6 C37 19.4 35.4 16.4 32.4 13.8 C37 15.2 40.6 18 42 22 Z"
      >
        <path d="M3.4 30 C10 33.4 19 34 28 31" fill="none" stroke={INK} strokeWidth={1.5} strokeLinecap="round" />
        {/* Warts, and mud dried on her jowl. */}
        {[
          [24, 21, 1.6],
          [30, 25, 1.3],
          [20, 36, 1.4],
        ].map(([x, y, r]) => (
          <circle key={x} cx={x} cy={y} r={r} fill={M.mud.base} stroke={M.mud.shadow} strokeWidth={0.6} />
        ))}
      </Shape>
      {/* Weed hanging from her chin. */}
      <path
        d="M9 38 C8.6 41 10 43 9 46 M14 39.4 C14 42 15 43.6 14.4 46"
        fill="none"
        stroke={M.leaf.shadow}
        strokeWidth={2}
        strokeLinecap="round"
      />
      {/* The eye in its bulge, on top of the head. */}
      <Shape d={circle(14.4, 15.4, 5)} tone={M.bog} lit={circle(13, 14, 2.8)} />
      <Glint x={11.6} y={12.6} r={0.9} />
      <Eye x={14.2} y={15.8} glow="#ffd04d" r={2.2} />
    </g>
  );
}

export function StormRoc() {
  return (
    <g>
      {/* The crest swept back, a storm's lightning across it. */}
      <Shape
        d="M27 10 C33 3 40 1 47 2 C42 5 38 8 35 13 Z"
        tone={M.cloak}
        lit="M27 10 C33 3 40 1 47 2 C40 3 34 6 30 11 Z"
      />
      <Shape d="M33 15 C39 10 44 9.4 47.6 10.6 C44 12.4 41 15 39 19 Z" tone={M.cloak} />
      <Glow d="M32 7 L36.5 9.4 L35 12 L40 13.4" under="#3b6b99" over="#d8f0ff" />
      <Shape d={shoulders(36)} tone={M.eagle} lit="M5 46 C6 40 13 36 24 36 C17 38 13 42 12 46 Z">
        <path d="M14 42 L18 38 M22 43 L26 38 M30 43 L33 38" stroke={M.eagle.shadow} strokeWidth={1.2} />
      </Shape>
      {/* The head, a great bird's in profile. */}
      <Shape
        d="M12 26 C10 16 17 8 27 8 C37 8 43 15 43 25 C43 33 38 39 31 41 L22 41 C19 37 17 33 15.4 30 Z"
        tone={M.cloak}
        lit="M12 26 C10 16 17 8 27 8 C20.6 11 16.6 16.4 16.2 23 C16 26 16.4 28.6 17.4 31.4 L15.4 30 C13.4 29.2 12.4 27.8 12 26 Z"
        shade="M43 25 C43 33 38 39 31 41 L27 41 C33.6 37.4 37.2 32 37.4 25.4 C37.6 19 34.6 13.4 30 10.2 C38 12 43 17.6 43 25 Z"
      >
        <path d="M20 30 C25 32 31 31.6 36 28" fill="none" stroke={M.cloak.light} strokeWidth={1.1} />
      </Shape>
      {/* The hooked golden beak. */}
      <Shape
        d="M16 21 C10 19.6 4 22 2 27.6 C1.4 30.8 3 33.6 5.4 34.4 C6 31.4 8.4 29.6 11.6 29.6 L16.6 30.4 Z"
        tone={M.bronze}
        lit="M16 21 C10 19.6 4 22 2 27.6 C5 24.6 9.4 23.4 15.4 24.4 Z"
      />
      <path d="M5.4 34.4 C7 33 9 32.6 11.6 32.8" fill="none" stroke={INK} strokeWidth={1} />
      <Glint x={7.4} y={24.4} r={0.9} />
      <Eye x={21.4} y={19.4} glow="#ffe27a" r={2.1} />
    </g>
  );
}
