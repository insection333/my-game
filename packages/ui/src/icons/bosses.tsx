// The three bosses (session 16), drawn as the foes are (ART.md): busts in left-facing profile, light
// from the upper left, the eye the brightest point. Each fills the square and wears what marks it
// out: the Troll-chief a crown beaten from an iron band, the Drowned Warden a barnacled helm and its
// lantern's light, the Ember Wyrm horns and a jaw full of fire.
import { Eye, shoulders } from './foes.tsx';
import { circle, Glint, INK, M, Shape } from './style.tsx';

/** A glowing crack or seam: a dark line with a bright core. */
const Glow = ({ d, under, over }: { d: string; under: string; over: string }) => (
  <g>
    <path d={d} fill="none" stroke={under} strokeWidth={1.8} strokeLinecap="round" />
    <path d={d} fill="none" stroke={over} strokeWidth={0.7} strokeLinecap="round" />
  </g>
);

export function TrollChief() {
  return (
    <g>
      <Shape d={shoulders(36)} tone={M.fur} lit="M5 46 C6 40 13 36 24 36 C17 38 13 42 12 46 Z" />
      <Shape
        d="M7 30 C5 18 13 9 25 9 C37 9 45 16 45 27 C45 37 38 44 28 44 L16 44 C12 42 10.5 39 11 36 C8 34.5 7 32.5 7 30 Z"
        tone={M.troll}
        lit="M7 30 C5 18 13 9 25 9 C18 12 14.5 18 14 26 C13.6 30 12.6 33.5 11 36 C8 34.5 7 32.5 7 30 Z"
        shade="M45 27 C45 37 38 44 28 44 L22 44 C32 40.5 38.5 35 39 25.5 C39.5 19 37 14 32.5 10.5 C40 12.5 45 18.5 45 27 Z"
      >
        {/* War-paint across the brow, and a scar over the eye. */}
        <path
          d="M10 21 C15 18 22 18 27 20"
          fill="none"
          stroke={M.banner.base}
          strokeWidth={2.4}
          strokeLinecap="round"
        />
        <path d="M14 26 L21 19" stroke={M.troll.shadow} strokeWidth={1.2} strokeLinecap="round" />
      </Shape>
      {/* The crown: an iron band beaten into three points. */}
      <Shape
        d="M13 13 L15 4 L20 10 L25 2.5 L30 9.5 L36 4 L37 14 C29 11.5 21 11 13 13 Z"
        tone={M.iron}
        lit="M13 13 L15 4 L20 10 L25 2.5 L23 11 C19.5 11.3 16 12 13 13 Z"
      >
        <circle cx={25} cy={9.5} r={1.4} fill={M.garnet.base} />
      </Shape>
      <Glint x={16} y={7.5} r={0.9} />
      <Shape d={circle(6.5, 28, 4.2)} tone={M.troll} lit={circle(5.6, 26.8, 2.4)} />
      {/* Tusks. */}
      <Shape d="M13.5 37.5 L12 30.5 L17 36.5 Z" tone={M.bone} />
      <Shape d="M19.5 39 L19 32.5 L23 38.5 Z" tone={M.bone} />
      <Eye x={16.5} y={24.5} glow="#ffd04d" r={2.1} />
    </g>
  );
}

export function DrownedWarden() {
  return (
    <g>
      {/* The harpoon over the shoulder. */}
      <path d="M44 3 L38 44" stroke={INK} strokeWidth={3.6} strokeLinecap="round" />
      <path d="M44 3 L38 44" stroke={M.oakWood.shadow} strokeWidth={1.8} strokeLinecap="round" />
      <Shape d="M41 2 L47 1 L45.5 8 Z" tone={M.iron} />
      <Shape d={shoulders(34)} tone={M.drowned} lit="M5 46 C6 38 13 34 24 34 C17 36 13 40 12 46 Z" />
      {/* The helm: a rounded crest, its face a dark slit, green with the fen. */}
      <Shape
        d="M7 30 C6 17 13 7 25 7 C35 7 41 14 41 24 C41 33 36 39 27 40 L14 40 C10 38 8 34.5 7 30 Z"
        tone={M.iron}
        lit="M7 30 C6 17 13 7 25 7 C18.5 10 14.5 16 13.5 24 C13 29 12 33 10.5 37 C8.5 35.2 7.4 32.8 7 30 Z"
        shade="M41 24 C41 33 36 39 27 40 L22 40 C30 37 35 32 35.5 24 C36 17 33 12 29 8.5 C36 10 41 16 41 24 Z"
      >
        <path d="M6 22 C13 20 20 20 26 22 L26 27 C20 25.5 13 25.5 6 27 Z" fill={INK} />
        <path d="M27 9 C31 15 32 25 29 36" fill="none" stroke={M.drowned.shadow} strokeWidth={1.4} />
        {/* Barnacles and weed on the iron. */}
        {[
          [32, 14],
          [35, 21],
          [33, 30],
        ].map(([x, y]) => (
          <circle key={x} cx={x} cy={y} r={1.6} fill={M.bone.base} stroke={M.bone.shadow} strokeWidth={0.7} />
        ))}
      </Shape>
      <Glint x={14} y={13} r={1.1} />
      <path
        d="M16 40 C15 43 17 44 15.5 46"
        fill="none"
        stroke={M.leaf.shadow}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
      <Eye x={14} y={24.5} glow="#8ff7e4" r={1.9} />
    </g>
  );
}

export function EmberWyrm() {
  return (
    <g>
      {/* Horns sweeping back. */}
      <Shape
        d="M28 12 C34 4 40 2 46 3 C41 6 37 10 34 16 Z"
        tone={M.bone}
        lit="M28 12 C34 4 40 2 46 3 C39 4 34 7 30 12.5 Z"
      />
      <Shape d="M33 20 C39 16 44 16 47 18 C43 19 39 22 37 26 Z" tone={M.bone} />
      {/* The neck, and the long head facing left, its jaw open on the fire. */}
      <Shape
        d="M26 46 C25 38 28 32 33 28 L45 26 L46 46 Z"
        tone={M.obsidian}
        lit="M26 46 C25 38 28 32 33 28 L37 27.5 C32 32 30 38 31 46 Z"
      />
      <Shape
        d="M3 23 C8 17 16 13 25 12 C33 11 38 16 38 23 C38 29 34 33 28 34 L19 33 C14 32.5 9 31 4 29 C2.5 27 2 25 3 23 Z"
        tone={M.obsidian}
        lit="M3 23 C8 17 16 13 25 12 C19 14.5 13 18 10 22.5 C8.5 24.5 6 25.3 3 25.3 Z"
        shade="M38 23 C38 29 34 33 28 34 L24 33.8 C30 31.5 33 28 33.2 22.5 C33.4 18 31.5 14.5 28.5 12.2 C34.5 13 38 17.5 38 23 Z"
      >
        <Glow d="M20 17 L24 21 L22 26" under={M.flame.shadow} over={M.flame.light} />
        <Glow d="M30 16 L28 22" under={M.flame.shadow} over={M.flame.light} />
      </Shape>
      {/* The lower jaw, and fire between the teeth. */}
      <Shape d="M6 31 C11 33 17 35 24 35 L22 39 C15 39 9 36.5 5 33 Z" tone={M.obsidian} />
      <Shape
        d="M2 29 C6 30 10 31.5 15 32.5 C12 35 7 35.5 2.5 34 C1.5 32.5 1.5 30.5 2 29 Z"
        tone={M.flame}
        lit="M2 29 C6 30 10 31.5 15 32.5 C10 33 6 32.5 2.5 31.5 Z"
      />
      <Shape d="M8 28.5 L9.5 31.5 L11 28.8 Z" tone={M.bone} outline={false} />
      <Shape d="M13 29.5 L14.5 32.5 L16 30 Z" tone={M.bone} outline={false} />
      <Eye x={20} y={20} glow="#ffb24d" r={2} />
    </g>
  );
}

// The bosses' finds: what each leaves behind, a Rare and a Legendary.

export function ChieftainsTorc() {
  const gold = M.bronze;
  const ring = 'M19 39 C9 35 5 25 9 16 C13 8 21 5 28 6 C37 8 43 16 42 26 C41.5 32 37 37 31 39';
  return (
    <g>
      {/* A thick twisted ring of gold, open at the throat, its ends heavy knobs facing each other. */}
      <path d={ring} fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" />
      <path d={ring} fill="none" stroke={gold.base} strokeWidth={5.4} strokeLinecap="round" />
      <path d={ring} fill="none" stroke={gold.shadow} strokeWidth={5.4} strokeDasharray="1.4 2.6" />
      <path d="M8 24 C8 15 15 8 24 7" fill="none" stroke={gold.light} strokeWidth={1.4} strokeLinecap="round" />
      <Shape d={circle(18.5, 39.5, 4)} tone={gold} lit={circle(17.5, 38.5, 2.2)}>
        <Glint x={17.2} y={38.2} r={0.9} />
      </Shape>
      <Shape d={circle(31.5, 39.5, 4)} tone={gold} lit={circle(30.5, 38.5, 2.2)} />
    </g>
  );
}

export function CrownOfTheHill() {
  return (
    <g>
      <Shape
        d="M6 36 L5 14 L14 22 L19 7 L24 19 L29 7 L34 22 L43 14 L42 36 C30 39 18 39 6 36 Z"
        tone={M.iron}
        lit="M6 36 L5 14 L14 22 L19 7 L21.5 17 L13 26 C11 30 10.5 33.5 11 37 C9.2 36.8 7.5 36.5 6 36 Z"
        shade="M42 36 L43 14 L34 22 L36 30 C36 33 35.5 35.5 35 37.5 C37.5 37.2 39.8 36.7 42 36 Z"
      >
        <path d="M6 30 C18 33 30 33 42 30" fill="none" stroke={M.iron.shadow} strokeWidth={1.4} />
      </Shape>
      {/* Bone studs, and a rough green stone. */}
      {[12, 36].map((x) => (
        <Shape key={x} d={circle(x, 31.5, 2.1)} tone={M.bone} />
      ))}
      <Shape d="M19.5 26 L24 21.5 L28.5 26 L24 31 Z" tone={M.leaf} lit="M19.5 26 L24 21.5 L24 26 Z">
        <Glint x={22.5} y={24.5} r={0.9} />
      </Shape>
    </g>
  );
}

export function SunkenLocket() {
  return (
    <g>
      <path d="M24 3 C14 4 12 12 18 17" fill="none" stroke={INK} strokeWidth={3} />
      <path d="M24 3 C34 4 36 12 30 17" fill="none" stroke={INK} strokeWidth={3} />
      <path
        d="M24 3 C14 4 12 12 18 17 M24 3 C34 4 36 12 30 17"
        fill="none"
        stroke={M.iron.light}
        strokeWidth={1.2}
        strokeDasharray="1.6 1.4"
      />
      <Shape
        d="M24 16 C33 16 38 22 38 30 C38 38.5 32 44 24 44 C16 44 10 38.5 10 30 C10 22 15 16 24 16 Z"
        tone={M.steel}
        lit="M24 16 C17 16 12.5 20.5 12 27.5 C14.5 23 18.5 20 24 19.5 Z"
        shade="M38 30 C38 38.5 32 44 24 44 C30 41 34 36.5 34.5 29.5 C35 25 33.5 21 31 18.5 C35.5 21 38 25 38 30 Z"
      >
        <path d="M24 22 L24 38 M17 30 L31 30" stroke={M.steel.shadow} strokeWidth={1.2} />
        {/* The sea's crust on its lower edge. */}
        <circle cx={31} cy={38} r={2} fill={M.drowned.base} stroke={M.drowned.shadow} strokeWidth={0.7} />
        <circle cx={27} cy={41.5} r={1.4} fill={M.bone.base} stroke={M.bone.shadow} strokeWidth={0.6} />
      </Shape>
      <Glint x={17} y={24} r={1.2} />
    </g>
  );
}

export function WardensLantern() {
  return (
    <g>
      <path d="M24 2 L24 7" stroke={INK} strokeWidth={2.4} />
      <Shape d="M17 7 C17 5 31 5 31 7 L33 12 L15 12 Z" tone={M.iron} />
      {/* The glass, and the drowned light inside it. */}
      <Shape d="M16 12 L32 12 L34 36 L14 36 Z" tone={M.drowned} lit="M16 12 L22 12 L19 36 L14 36 Z">
        <path d={circle(24, 25, 6)} fill="#8ff7e4" opacity={0.85} />
        <path d={circle(24, 25, 3)} fill="#ffffff" />
        <path d="M24 12 L24 36" stroke={M.iron.shadow} strokeWidth={1.4} />
      </Shape>
      <Shape d="M12 36 L36 36 L34 42 L14 42 Z" tone={M.iron} lit="M12 36 L36 36 L35.4 38 L12.7 38 Z" />
      <Glint x={18} y={16} r={1} />
    </g>
  );
}

export function WyrmScale() {
  return (
    <g>
      <Shape
        d="M24 3 C34 9 41 19 40 30 C39 39 32 45 24 45 C16 45 9 39 8 30 C7 19 14 9 24 3 Z"
        tone={M.obsidian}
        lit="M24 3 C14 9 7 19 8 30 C8.5 35 10.5 38.5 13.5 41 C12.5 30 15.5 17 24 3 Z"
      >
        <path d="M24 8 C30 15 33 24 32 33" fill="none" stroke={M.obsidian.light} strokeWidth={1} />
        {/* An ember rim along its lower edge. */}
        <path
          d="M9.5 33 C12 41 18 44 24 44 C30 44 36 41 38.5 33"
          fill="none"
          stroke={M.flame.shadow}
          strokeWidth={2.4}
        />
        <path
          d="M9.5 33 C12 41 18 44 24 44 C30 44 36 41 38.5 33"
          fill="none"
          stroke={M.flame.light}
          strokeWidth={0.8}
        />
      </Shape>
      <Glint x={15} y={18} r={1.1} />
    </g>
  );
}

export function HeartOfTheWyrm() {
  return (
    <g>
      <Shape
        d="M24 44 C14 36 5 28 5 18 C5 10 11 5 17 5 C20.5 5 23 7 24 9.5 C25 7 27.5 5 31 5 C37 5 43 10 43 18 C43 28 34 36 24 44 Z"
        tone={M.flame}
        lit="M24 44 C14 36 5 28 5 18 C5 10 11 5 17 5 C12 9 10 14 10.5 20 C11 27 16 34 24 44 Z"
        shade="M43 18 C43 28 34 36 24 44 C30 36 36 28 36.5 20 C37 13 34 8 30 5.2 C37 5.5 43 10.5 43 18 Z"
      >
        <Glow d="M17 14 L22 20 L19 27 L25 33" under={M.flame.shadow} over="#ffffff" />
        <path d={circle(30, 17, 4)} fill="#fff6c8" opacity={0.8} />
      </Shape>
      <Glint x={13} y={13} r={1.4} />
    </g>
  );
}
