// The Ashen Peaks' foes (session 12) and the vendor's later foods, drawn as the march's are (ART.md):
// busts in left-facing profile with the eye the brightest point; ash, obsidian and ember for the
// mountain's burnt slopes. Each food one warm, lit dish.
import { Eye, shoulders } from './foes.tsx';
import { circle, ellipse, Glint, INK, LINE, M, Shape } from './style.tsx';

/** A glowing crack: an ember line with a bright core. */
const Crack = ({ d }: { d: string }) => (
  <g>
    <path d={d} fill="none" stroke={M.flame.shadow} strokeWidth={1.8} strokeLinecap="round" />
    <path d={d} fill="none" stroke={M.flame.light} strokeWidth={0.7} strokeLinecap="round" />
  </g>
);

const Bow = ({ wood }: { wood: string }) => (
  <g>
    <path d="M41 4 C47 16 47 30 41 42" fill="none" stroke={wood} strokeWidth={2.4} strokeLinecap="round" />
    <path d="M41 4 L41 42" stroke={M.feather.shadow} strokeWidth={0.9} />
  </g>
);

export function AshTroll() {
  return (
    <g>
      <Shape
        d="M8 29 C6 17 14 6 26 6 C38 6 46 14 46 26 C46 37 39 45 28 45 L15 45 C11 42.5 10 39 11 36 C8 34.5 8 32 8 29 Z"
        tone={M.cinder}
        lit="M8 29 C6 17 14 6 26 6 C19 9 15 15 14.5 24 C14 29 13 33 11 36 C8 34.5 8 32 8 29 Z"
        shade="M46 26 C46 37 39 45 28 45 L22 45 C33 41 39 35 39.5 25 C40 17 37 11 32 7 C40 9 46 16 46 26 Z"
      >
        <Crack d="M31 12 L34 19 L32 25 L36 31" />
        <Crack d="M24 37 L27 41" />
        <path
          d="M12 19.5 C16 16.5 22 16 26 18"
          fill="none"
          stroke={M.cinder.shadow}
          strokeWidth={3}
          strokeLinecap="round"
        />
      </Shape>
      <Shape d={circle(7.5, 27, 4.5)} tone={M.cinder} lit={circle(6.5, 25.8, 2.6)} />
      <Shape d="M14 37.5 L13 32.5 L17 36.5 Z" tone={M.bone} />
      <Eye x={17.5} y={22} glow="#ffb84d" r={2} />
    </g>
  );
}

export function PeakSlinger() {
  return (
    <g>
      <Bow wood={M.elderWood.shadow} />
      <Shape d={shoulders(35)} tone={M.fur} lit="M5 46 C6 39 13 35 24 35 C17 37 13 41 12 46 Z" />
      <Shape
        d="M9 26 C9 17 15 12 24 12 C32 12 37 17 37 25 C37 33 32 38 24 38 C18 38 14 36 11.5 33 L7 31 C8 29.5 9 28 9 26 Z"
        tone={M.skin}
        lit="M9 26 C9 17 15 12 24 12 C19 14.5 15.5 19 15 26 C14.8 29 13.5 31 11 32 L7 31 C8 29.5 9 28 9 26 Z"
        shade="M37 25 C37 33 32 38 24 38 C29 35 32 30.5 32 24.5 C32 19 30 15 27 13 C33 14.5 37 19 37 25 Z"
      />
      {/* A fur hood with a ram's horn curling from it. */}
      <Shape
        d="M8 21 C9 12 16 7 25 7 C33 7 39 12 39.5 21 C35 17 30 15.5 24 15.5 C17 15.5 12 17.5 8 21 Z"
        tone={M.fur}
        lit="M8 21 C9 12 16 7 25 7 C19 9.5 14.5 13.5 13 18 C11 18.8 9.5 19.8 8 21 Z"
      />
      <path
        d="M28 9 C36 4 42 9 39 15 C37 18 33 17 33 14"
        fill="none"
        stroke={INK}
        strokeWidth={4.6}
        strokeLinecap="round"
      />
      <path
        d="M28 9 C36 4 42 9 39 15 C37 18 33 17 33 14"
        fill="none"
        stroke={M.bone.base}
        strokeWidth={2.8}
        strokeLinecap="round"
      />
      <Eye x={15} y={25} glow="#bfe8ff" r={2.1} />
    </g>
  );
}

export function AshShaman() {
  return (
    <g>
      {/* Smoke rising behind. */}
      <path
        d="M38 6 C35 10 41 13 38 18 M43 10 C40 14 45 17 42 22"
        fill="none"
        stroke={M.cinder.base}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Shape
        d="M5 46 C5 30 9 11 24 8 C35 6 40 16 40 30 L40 46 Z"
        tone={M.leather}
        lit="M5 46 C5 30 9 11 24 8 C17 12 12.5 21 12 32 C11.5 38 12 42 13 46 Z"
        shade="M40 30 L40 46 L34 46 C35 38 35.5 30 34.5 22 C34 17 32.5 12.5 30 9 C37 11 40 19 40 30 Z"
      />
      {/* The mask: pale bone, ember-ringed eye. */}
      <Shape
        d="M10 28 C10 20 15 15 22 15 C29 15 32 20 32 27 C32 34 28 39.5 21.5 39.5 C17 39.5 14 37.5 12 35 L7.5 33 C9 31.5 10 30 10 28 Z"
        tone={M.bone}
        lit="M10 28 C10 20 15 15 22 15 C18 17.5 16 21.5 16 27 C16 30 14.5 32.5 11.5 33.5 L7.5 33 C9 31.5 10 30 10 28 Z"
        shade="M32 27 C32 34 28 39.5 21.5 39.5 C26 36.5 28 32 28 26.5 C28 21.5 26.5 18 24 16 C29 17 32 21.5 32 27 Z"
      >
        <path d="M18 31 L18 37 M22 31.5 L22 38" stroke={M.banner.base} strokeWidth={1.4} strokeLinecap="round" />
      </Shape>
      <path d="M20 15 L17 6 M24 15 L25 5" stroke={M.feather.shadow} strokeWidth={1.6} strokeLinecap="round" />
      <circle cx={16} cy={24} r={4.2} fill={M.flame.shadow} opacity={0.5} />
      <Eye x={16} y={24} glow="#ffc35c" r={2.3} />
    </g>
  );
}

export function ObsidianGolem() {
  return (
    <g>
      <Shape
        d="M6 46 L4 30 L10 14 L22 6 L36 8 L44 20 L45 34 L40 46 Z"
        tone={M.obsidian}
        lit="M6 46 L4 30 L10 14 L22 6 L18 18 L13 32 L14 46 Z"
        shade="M45 34 L40 46 L32 46 L37 33 L36 21 L36 8 L44 20 Z"
      >
        <path
          d="M22 6 L18 18 L13 32 M18 18 L30 22 L36 21 M30 22 L28 34 L37 33"
          fill="none"
          stroke={M.obsidian.light}
          strokeWidth={0.9}
          opacity={0.6}
        />
        <Crack d="M8 36 L14 38 L20 42" />
        <Glint x={11} y={17} r={1.2} />
      </Shape>
      <circle cx={14} cy={24} r={4.5} fill={M.flame.shadow} opacity={0.55} />
      <Eye x={14} y={24} glow="#ffa23a" r={2.4} />
    </g>
  );
}

export function SkyReaver() {
  return (
    <g>
      <Bow wood={M.ancientWood.shadow} />
      <Shape d={shoulders(36)} tone={M.steel} lit="M5 46 C6 40 13 36 24 36 C17 38 13 42 12 46 Z" />
      <Shape
        d="M9 25 C9 16 15 11 24 11 C32 11 37 16 37 24 C37 32 32 37 24 37 C18 37 14 35 11.5 32 L7 30 C8 28.5 9 27 9 25 Z"
        tone={M.skin}
        lit="M9 25 C9 16 15 11 24 11 C19 13.5 15.5 18 15 25 C14.8 28 13.5 30 11 31 L7 30 C8 28.5 9 27 9 25 Z"
        shade="M37 24 C37 32 32 37 24 37 C29 34 32 29.5 32 23.5 C32 18 30 14 27 12 C33 13.5 37 18 37 24 Z"
      />
      {/* A winged helm: steel cap, feathered wing sweeping back. */}
      <Shape
        d="M30 12 C36 6 44 4 47 2 C46 8 42 13 36 16 Z"
        tone={M.feather}
        lit="M30 12 C36 6 44 4 47 2 C41 6 36 10 33 14 Z"
      >
        <path d="M34 13 L41 7 M36 15 L44 8" stroke={M.feather.shadow} strokeWidth={0.8} />
      </Shape>
      <Shape
        d="M8.5 19 C9.5 11 16 6.5 24.5 6.5 C33 6.5 38.5 11.5 39 19 Z"
        tone={M.steel}
        lit="M8.5 19 C9.5 11 16 6.5 24.5 6.5 C19 9 15.5 13 15 19 Z"
        shade="M39 19 C38.5 11.5 33 6.5 24.5 6.5 C30 9.5 33 13.5 33.5 19 Z"
      >
        <Glint x={14} y={12} r={1.2} />
      </Shape>
      <Eye x={15} y={24} glow="#9fdcff" r={2.2} />
    </g>
  );
}

export function EmberSorcerer() {
  return (
    <g>
      {/* A crown of flame above the hood. */}
      <Shape
        d="M14 12 C13 6 17 4 18 0 C20 4 22 3 23 0 C25 4 28 4 29 1 C31 5 33 8 31 12 Z"
        tone={M.flame}
        lit="M14 12 C13 6 17 4 18 0 C19 4 20 6 19 12 Z"
      />
      <Shape
        d="M5 46 C5 28 10 9 26 7 C39 6 44 18 44 31 L44 46 Z"
        tone={M.embersteel}
        lit="M5 46 C5 28 10 9 26 7 C18 11 13 20 12 32 C11.5 38 12 42 13 46 Z"
        shade="M44 31 L44 46 L37 46 C38 38 38.5 30 37.5 22 C37 17 35 12 32 8.5 C40 10.5 44 19 44 31 Z"
      >
        <Crack d="M34 20 L37 28 L35 36" />
      </Shape>
      <Shape
        d="M13 29 C13 21.5 17.5 16.5 24 16.5 C30 16.5 33 21.5 33 28 C33 35 29 40 23 40 C19 40 16.5 38.5 15 36.5 L10 34.5 C11 32.5 12.5 31 13 29 Z"
        tone={M.cinder}
        lit="M13 29 C13 21.5 17.5 16.5 24 16.5 C20 19 18.5 23 18.5 28 C18.5 31 17 33 14 34.5 L10 34.5 C11 32.5 12.5 31 13 29 Z"
        shade="M33 28 C33 35 29 40 23 40 C27 37 29 33 29 27 C29 23 28 20 26 17 C30.5 18 33 22.5 33 28 Z"
      />
      <circle cx={18.5} cy={25.5} r={4.4} fill={M.flame.base} opacity={0.4} />
      <Eye x={18.5} y={25.5} glow="#ffd36b" />
    </g>
  );
}

export function RoastFowl() {
  return (
    <g>
      <Shape d={ellipse(24, 38, 20, 6)} tone={M.iron} lit={ellipse(19, 36.5, 12, 3)} />
      <Shape
        d="M8 30 C8 20 16 14 26 14 C36 14 42 21 41 29 C40 36 33 39 24 39 C15 39 8 36 8 30 Z"
        tone={M.crust}
        lit="M8 30 C8 20 16 14 26 14 C19 16.5 14.5 22 14 29 C13.8 32 14.5 35 16 38 C11 36.5 8 34 8 30 Z"
        shade="M41 29 C40 36 33 39 24 39 C31 36.5 35 32 35.5 26 C36 21 34 17.5 31 15 C37.5 17 41.5 22.5 41 29 Z"
      >
        <path
          d="M17 24 C21 21 27 21 31 24"
          fill="none"
          stroke={M.crust.shadow}
          strokeWidth={1.2}
          strokeLinecap="round"
        />
        <Glint x={15} y={21} r={1.3} />
      </Shape>
      {/* The drumstick's bone, capped with a paper frill. */}
      <path d="M37 22 L45 14" stroke={INK} strokeWidth={4.4} strokeLinecap="round" />
      <path d="M37 22 L45 14" stroke={M.bone.base} strokeWidth={2.4} strokeLinecap="round" />
      <circle cx={45} cy={14} r={2.4} fill={M.bone.light} stroke={INK} strokeWidth={LINE * 0.6} />
    </g>
  );
}

export function HuntersFeast() {
  return (
    <g>
      <Shape
        d={ellipse(24, 34, 21, 9)}
        tone={M.oakWood}
        lit={ellipse(18, 31.5, 13, 5)}
        shade="M45 34 C45 39 36 43 24 43 C33 41 40 38 41 32 Z"
      />
      {/* A haunch, a loaf and greens on the board. */}
      <Shape
        d="M9 30 C8 23 14 19 21 20 C27 21 29 26 27 31 C25 35 19 37 14 36 C11 35 9.5 33 9 30 Z"
        tone={M.meat}
        lit="M9 30 C8 23 14 19 21 20 C16 22 13.5 25.5 13.5 30 C13.5 32.5 14.3 34.5 15.5 36 C12 35.5 9.6 33.5 9 30 Z"
      >
        <Glint x={13} y={24} r={1.1} />
      </Shape>
      <path d="M8 24 L3 19" stroke={INK} strokeWidth={4} strokeLinecap="round" />
      <path d="M8 24 L3 19" stroke={M.bone.base} strokeWidth={2.2} strokeLinecap="round" />
      <Shape d={ellipse(34, 27, 9, 6)} tone={M.crust} lit={ellipse(31.5, 25.5, 5, 3)}>
        <path d="M30 24 L33 29 M35 23 L38 28" stroke={M.crumb.base} strokeWidth={1.4} strokeLinecap="round" />
      </Shape>
      <circle cx={27} cy={36} r={2.4} fill={M.leaf.base} stroke={INK} strokeWidth={0.8} />
      <circle cx={31} cy={37.5} r={2} fill={M.leaf.light} stroke={INK} strokeWidth={0.8} />
    </g>
  );
}

export function WardensFeast() {
  return (
    <g>
      {/* A tall raised pie on a pewter dish, steam rising, a sprig on its crown. */}
      <path
        d="M17 9 C15 5 19 4 17 0 M24 8 C22 4 26 3 24 -1"
        fill="none"
        stroke={M.feather.shadow}
        strokeWidth={1.6}
        strokeLinecap="round"
        opacity={0.8}
      />
      <Shape d={ellipse(24, 41, 21, 5)} tone={M.iron} lit={ellipse(19, 40, 12, 2.6)} />
      <Shape
        d="M7 22 L9 38 C11 41 17 42 24 42 C31 42 37 41 39 38 L41 22 Z"
        tone={M.crust}
        lit="M7 22 L9 38 C10 39.5 12 40.5 14 41 L13 22 Z"
        shade="M41 22 L39 38 C38 39.6 36 40.6 33.5 41.2 L35 22 Z"
      >
        {[13, 19, 25, 31].map((x) => (
          <path key={x} d={`M${x} 26 L${x + 3} 36`} stroke={M.crust.shadow} strokeWidth={1.1} />
        ))}
      </Shape>
      <Shape
        d={ellipse(24, 22, 17, 7)}
        tone={M.crust}
        lit={ellipse(19, 20, 10, 4)}
        shade="M41 22 C41 26 33 29 24 29 C32 27 37 25 38 20 Z"
      >
        <path d="M12 21 C18 24 30 24 36 21" fill="none" stroke={M.crust.shadow} strokeWidth={1} />
        <Glint x={14} y={19} r={1.2} />
      </Shape>
      <path d="M24 15 L24 11" stroke={M.leaf.shadow} strokeWidth={1.6} strokeLinecap="round" />
      <circle cx={22} cy={11} r={2} fill={M.leaf.base} stroke={INK} strokeWidth={0.8} />
      <circle cx={26.5} cy={10.5} r={1.8} fill={M.leaf.light} stroke={INK} strokeWidth={0.8} />
    </g>
  );
}
