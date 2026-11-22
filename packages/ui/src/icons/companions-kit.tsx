// Companions (session 179; ART.md, Companions): fourteen small creatures, one for each skill and each boss,
// each sitting on a low tuft of its own ground, which marks the family, and facing left, towards the
// picture it sits beside. Light from the upper left, the eye the brightest point; whole bodies, so each
// reads by its silhouette at 24 px: the squirrel's tail, the mole's paws, the otter's long back, the moth's
// wings, the salamander's spots, the cat's ears, the goose's neck, the pup's ear, the falcon's hooked beak,
// the toad's squat, the tortoise's dome, the whelp's tusks, the frog's lantern, the wyrmling's wings.
import type { ReactNode } from 'react';
import { circle, ellipse, INK, M, Shape, type Tone } from './style.tsx';

const tone = (light: string, base: string, shadow: string): Tone => ({ light, base, shadow });
/** Their own coats, beside the materials: a red squirrel's, a mole's velvet, an otter's, a tabby's, a
 *  falcon's slate, a goose's grey, a salamander's black. */
export const C = {
  squirrel: tone('#eda36e', '#b8602f', '#763a1b'),
  velvet: tone('#8c8697', '#46414f', '#24212a'),
  otter: tone('#b68c66', '#7d5637', '#4b321f'),
  tabby: tone('#efc98f', '#c58d4c', '#80562a'),
  slate: tone('#b7c3ce', '#6c7a88', '#3c4752'),
  goose: tone('#eef0ec', '#b9bdb6', '#7c827a'),
  newt: tone('#5f6468', '#2f3337', '#16191b'),
  frog: tone('#bfe0b4', '#6e9f6a', '#3d6340'),
  pup: tone('#ecc996', '#c08f55', '#7f5a30'),
  /** A wyrm's black scale, its light raised to read on the dark theme. */
  scale: tone('#8e88a6', '#3b3649', '#1c1a24'),
  shell: tone('#d8b57c', '#9a7340', '#5e4421'),
};

/** The tuft each companion sits on: low ground of its own (moss for most; stone, bog or cinder for a
 *  boss's), drawn first so the creature stands on it. */
export function Tuft({ ground = M.leaf, children }: { ground?: Tone; children: ReactNode }) {
  return (
    <g>
      <Shape d={ellipse(24, 42.5, 18, 4)} tone={ground} lit={ellipse(19, 41, 12, 2.4)} />
      {children}
    </g>
  );
}

/** A bright eye: ink, with a white glint towards the light. */
export const Eye = ({ x, y, r = 1.8, iris }: { x: number; y: number; r?: number; iris?: string }) => (
  <g>
    <circle cx={x} cy={y} r={r} fill={INK} />
    {iris && <circle cx={x} cy={y} r={r * 0.62} fill={iris} />}
    <circle cx={x - r * 0.35} cy={y - r * 0.38} r={r * 0.38} fill="#ffffff" />
  </g>
);

/** Light on the upper left of a round form at (x, y) of radius r, and shade on its lower right. */
export const litAt = (x: number, y: number, r: number) => circle(x - r * 0.45, y - r * 0.5, r * 0.78);
export const shadeAt = (x: number, y: number, r: number) => circle(x + r * 0.85, y + r * 0.8, r * 1.05);
