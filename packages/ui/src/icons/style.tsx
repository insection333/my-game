// The art style guide, in code. Every icon is built from Shapes: a base fill, a shadow and a light
// clipped inside it (light comes from the top left), and one ink outline. Materials have exactly
// three tones. See ART.md for the rules these encode.
import { useId, type ReactNode } from 'react';

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
};

/** A circle as a path, so it can be shaded like any shape. */
export const circle = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`;

/** An ellipse as a path. */
export const ellipse = (cx: number, cy: number, rx: number, ry: number) =>
  `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${rx * 2} 0a${rx} ${ry} 0 1 0 ${-rx * 2} 0Z`;

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
