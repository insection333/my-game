// The art style guide, in code. Every icon is built from Shapes: a base fill, a shadow and a light
// clipped inside it (light comes from the top left), and one ink outline. Materials have exactly
// three tones. See ART.md for the rules these encode.
import { createContext, useId, type ReactNode } from 'react';

/** The outline: dark enough to hold the silhouette at 24 px on both themes' surfaces. */
export const INK = '#182024';
/** Outline width on the 48-unit grid (1 px at 24 px). */
export const LINE = 2;

export interface Tone {
  light: string;
  base: string;
  shadow: string;
}

const tone = (light: string, base: string, shadow: string): Tone => ({ light, base, shadow });

/** Materials. Metals step from warm to cold as tiers rise, so a tier reads before its shape. */
export const M = {
  copper: tone('#f2a774', '#c46a3a', '#86411f'),
  bronze: tone('#ecc985', '#b98a3e', '#7a5822'),
  iron: tone('#ccd3d7', '#8f989e', '#5a6268'),
  steel: tone('#f2f6f8', '#b8c5cd', '#768792'),
  ash: tone('#ecd3a3', '#c79f66', '#8c6b3b'),
  pine: tone('#e6b67c', '#b37c46', '#7a4f2a'),
  oak: tone('#d9a774', '#a8743f', '#6c4724'),
  bark: tone('#a2714a', '#6f4a2e', '#46301d'),
  heartwood: tone('#f4dcae', '#ddb67a', '#b2864d'),
  /** Logs step from pale to deep as tiers rise: pine (heartwood), ash, oak, yew. */
  ashWood: tone('#fbf3e2', '#e8d8b6', '#bca67c'),
  ashBark: tone('#b9b6a2', '#7f7c69', '#4f4d40'),
  oakWood: tone('#e8b57c', '#c08a4e', '#8a5d2e'),
  oakBark: tone('#a6835f', '#5f4632', '#37281c'),
  yewWood: tone('#e6a08a', '#b0604a', '#723628'),
  yewBark: tone('#a8664c', '#74402c', '#4a271a'),
  amber: tone('#ffd98a', '#e39a2c', '#a0611a'),
  /** Ores in the rock: copper's own metal, pale tin, rust-red iron, and coal's glossy black. */
  tin: tone('#f1f4f2', '#b9c3c0', '#7b8784'),
  ironOre: tone('#d99a7c', '#9a4f36', '#5f2c1e'),
  coal: tone('#737c82', '#3a4146', '#1d2226'),
  yew: tone('#e8a888', '#b4684a', '#77402a'),
  garnet: tone('#f39aa2', '#a82a3c', '#5c1420'),
  sapphire: tone('#a9cff7', '#2f66ba', '#183670'),
  amethyst: tone('#e6cbf8', '#9a63c9', '#5a3384'),
  starIron: tone('#cdd8ea', '#5d6b83', '#2c3446'),
  wax: tone('#e87e7a', '#a8323a', '#621a20'),
  silverbark: tone('#f4f6ef', '#c5ccbf', '#86917f'),
  leaf: tone('#bfdc8e', '#6f9e45', '#44682a'),
  leather: tone('#c08250', '#8b5530', '#5b361d'),
  crust: tone('#eebb6c', '#c9843b', '#8b5322'),
  crumb: tone('#fbe9c4', '#f0d39b', '#d6b072'),
  stone: tone('#b3ada4', '#7f786f', '#504b45'),
  fur: tone('#a69b92', '#71675f', '#463f3a'),
  skin: tone('#e8b9b0', '#c98d86', '#94605c'),
  straw: tone('#e2bd84', '#ac7f46', '#6c4b26'),
  eggshell: tone('#e4f2f3', '#a9cfd6', '#6c97a3'),
  moonstone: tone('#f2fbff', '#a9d0e6', '#5f8fae'),
  seal: tone('#41545c', '#2c3b41', '#1b262b'),
  /** Foes' skins and what they wear (session 8). */
  goblin: tone('#c9dc8e', '#80a046', '#4d6527'),
  orc: tone('#b3bf8f', '#6d7d50', '#414c30'),
  wisp: tone('#eafff7', '#98dcc9', '#4b9583'),
  wight: tone('#f1f4ee', '#bcc6c0', '#7c8b87'),
  troll: tone('#bfbf9f', '#83846a', '#50513f'),
  cloth: tone('#a6c491', '#577b4c', '#30492c'),
  banner: tone('#ec9182', '#b03c30', '#6c2119'),
  bone: tone('#fbf5e3', '#e1d3ad', '#a9976d'),
  feather: tone('#ffffff', '#d8dcd5', '#979f98'),
  eagle: tone('#ddbb8e', '#93693f', '#5b3f24'),
  /** The expansion's metals (session 12), past steel: moonsilver pale and cool, star-iron dark and blue,
   *  embersteel black with a hot edge, dawnsteel white-gold. */
  moonsilver: tone('#f6f9ff', '#bfcbe4', '#7584a8'),
  embersteel: tone('#c77b5c', '#5c3a36', '#2b1916'),
  dawnsteel: tone('#ffffff', '#f4ead0', '#c7a865'),
  /** The expansion's woods, each with its own bark. */
  mapleWood: tone('#f6c39a', '#d4834f', '#94502b'),
  mapleBark: tone('#a86a48', '#713f29', '#46261a'),
  silverWood: tone('#fbf6ea', '#e6dbc1', '#b6a585'),
  elderWood: tone('#d8a8c6', '#975f86', '#5a3553'),
  elderBark: tone('#77596d', '#4b3447', '#2c1d2a'),
  ancientWood: tone('#f0e9a8', '#bfb062', '#7c7033'),
  ancientBark: tone('#6c7a52', '#424d33', '#252c1d'),
  /** Their ores in the rock: ember glowing, dawnstone a pale gold crystal. */
  emberOre: tone('#ffd08a', '#ec6b2c', '#9b3013'),
  dawnstone: tone('#fff8dc', '#f3d27c', '#b78f37'),
  /** The cool blue-grey rock moonsilver is found in. */
  moonrock: tone('#cbd5e6', '#8d99b2', '#535e76'),
  /** The Sunken Fen's foes and the Ashen Peaks'. */
  bog: tone('#a9b981', '#62764a', '#39472b'),
  reed: tone('#e1d293', '#ae9b5d', '#706035'),
  drowned: tone('#c7e6df', '#7fa9a2', '#4a6d68'),
  mud: tone('#b49a76', '#7a5f43', '#4a3725'),
  cinder: tone('#d3d0cb', '#8e8a85', '#55524e'),
  obsidian: tone('#6f6a80', '#2d2a38', '#141219'),
  flame: tone('#fff0a8', '#ffa23a', '#d4511f'),
  /** Food: a pie's meat, a stew's broth. */
  meat: tone('#df9474', '#a04c35', '#62291c'),
  broth: tone('#e5ae69', '#ad6d33', '#6c421c'),
};

/** A circle as a path, so it can be shaded like any shape. */
export const circle = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`;

/** An ellipse as a path. */
export const ellipse = (cx: number, cy: number, rx: number, ry: number) =>
  `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${rx * 2} 0a${rx} ${ry} 0 1 0 ${-rx * 2} 0Z`;

/** An ellipse drawn the other way round: added to a shape's path, it cuts a hole (a ring). */
export const hole = (cx: number, cy: number, rx: number, ry: number) =>
  `M${cx - rx} ${cy}a${rx} ${ry} 0 1 1 ${rx * 2} 0a${rx} ${ry} 0 1 1 ${-rx * 2} 0Z`;

export interface ShapeProps {
  d: string;
  tone: Tone;
  /** The lit part (upper left), drawn inside the shape. */
  lit?: string;
  /** The shadowed part (lower right), drawn inside the shape. */
  shade?: string;
  /** Extra marks inside the shape: grain, rivets, rings. */
  children?: ReactNode;
  outline?: boolean;
}

export function Shape({ d, tone: t, lit, shade, children, outline = true }: ShapeProps) {
  const id = `s${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <g>
      <clipPath id={id}>
        <path d={d} />
      </clipPath>
      <path d={d} fill={t.base} />
      <g clipPath={`url(#${id})`}>
        {shade && <path d={shade} fill={t.shadow} />}
        {lit && <path d={lit} fill={t.light} />}
        {children}
      </g>
      {outline && <path d={d} fill="none" stroke={INK} strokeWidth={LINE} strokeLinejoin="round" />}
    </g>
  );
}

/** A small specular glint on metal and glass. */
export const Glint = ({ x, y, r = 1.4 }: { x: number; y: number; r?: number }) => (
  <circle cx={x} cy={y} r={r} fill="#ffffff" opacity={0.85} />
);

/** A skill seal's rim, in the metal of the highest tier its skill has reached: copper, bronze, iron,
 *  steel, then the climb's moonsilver, star-iron, embersteel and dawnsteel. Bronze when no tier is
 *  given (the icon sheet, a ladder's tab). */
export const RIM_TONES: readonly Tone[] = [
  M.copper,
  M.bronze,
  M.iron,
  M.steel,
  M.moonsilver,
  M.starIron,
  M.embersteel,
  M.dawnsteel,
];
export const RimTone = createContext<Tone>(M.bronze);
