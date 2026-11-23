// The Deep's relics (session 215): three keepsakes in the relics' family, each hung from its cord and drawn as
// one object lit from the upper left: a delver's satchel (more meals carried), a lantern of the Deep (foes hit
// softer in its light) and a deepsteel edge (blows land harder).
import { circle, Glint, INK, M, Shape, type Tone } from './style.tsx';
import { Hung } from './relics.tsx';

const tone = (light: string, base: string, shadow: string): Tone => ({ light, base, shadow });
const DEEPSTEEL = tone('#bfd6e6', '#4f6e86', '#223646');
const GLOW = tone('#fff3c4', '#ffc95a', '#d98a1e');

export const DelversSatchel = () => (
  <Hung to={18}>
    {/* The pouch, its flap and a brass buckle. */}
    <Shape
      d="M10 22 C10 19 12 18 15 18 L33 18 C36 18 38 19 38 22 L38 40 C38 43 36 45 33 45 L15 45 C12 45 10 43 10 40 Z"
      tone={M.leather}
      lit="M10 22 C10 19 12 18 15 18 L22 18 C17 21 15 27 15 34 C15 38 15.5 42 17 45 L15 45 C12 45 10 43 10 40 Z"
    />
    <Shape
      d="M10 22 C10 19 12 18 15 18 L33 18 C36 18 38 19 38 22 L38 28 C33 33 15 33 10 28 Z"
      tone={tone('#d29a68', '#9c6239', '#623b20')}
      lit="M10 22 C10 19 12 18 15 18 L21 18 C17 20 15 24 14 30 C12.5 29.5 11 28.7 10 28 Z"
    />
    <Shape d="M21 29 L27 29 L27 35 L21 35 Z" tone={M.bronze} lit="M21 29 L24 29 L24 35 L21 35 Z" />
    <path d="M24 31 L24 33.5" stroke={INK} strokeWidth={1.2} strokeLinecap="round" />
    <Glint x={22.5} y={30.5} r={0.8} />
  </Hung>
);

export const LanternOfTheDeep = () => (
  <Hung to={13}>
    {/* The cap, the glass glowing between its bars, and the foot. */}
    <Shape d="M17 13 L31 13 L34 19 L14 19 Z" tone={M.obsidian} lit="M17 13 L24 13 L22 19 L14 19 Z" />
    <Shape d="M16 19 L32 19 L32 38 L16 38 Z" tone={GLOW} lit={circle(22, 27, 6)}>
      <path d={circle(24, 29, 4)} fill={GLOW.light} />
    </Shape>
    {[21.3, 26.7].map((x) => (
      <path key={x} d={`M${x} 19 L${x} 38`} stroke={INK} strokeWidth={1.6} />
    ))}
    <Shape d="M14 38 L34 38 L32 44 L16 44 Z" tone={M.obsidian} lit="M14 38 L22 38 L21 44 L16 44 Z" />
    <Glint x={18.5} y={22} r={1} />
  </Hung>
);

export const DeepsteelEdge = () => (
  <Hung to={14}>
    {/* A short blade of deepsteel, its edge bright, bound at the tang. */}
    <Shape
      d="M20 14 L28 14 L29 20 L33 41 L24 47 L15 41 L19 20 Z"
      tone={DEEPSTEEL}
      lit="M20 14 L24 14 L24 47 L15 41 L19 20 Z"
    >
      <path d="M24 21 L24 43" stroke={DEEPSTEEL.shadow} strokeWidth={1.2} />
      <path d="M15.5 40.5 L24 46.5" stroke={tone('#ffffff', '#e8f6ff', '#a9d0e6').light} strokeWidth={1.4} />
    </Shape>
    <Shape d="M18 18 L30 18 L30 22 L18 22 Z" tone={M.leather} lit="M18 18 L24 18 L24 22 L18 22 Z" />
    <Glint x={19.5} y={30} r={1} />
  </Hung>
);
