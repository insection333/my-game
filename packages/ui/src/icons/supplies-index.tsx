// The supplies by tier (session 14), registered beside the rest (index.tsx): each tier's arrows in its
// metal and wood, its rune with its own mark in its own light, its whetstones bound in its metal, and
// from tier 2 the key to its standing stones.
import type { IconDef } from './index.tsx';
import { FletchingSeal, RunecraftSeal } from './seals.tsx';
import { M, type Tone } from './style.tsx';
import { Arrows, Rune, StoneKey, Whetstone } from './supplies.tsx';
import { tone } from './fish.tsx';

interface TierArt {
  metal: string;
  name: string;
  tone: Tone;
  wood: Tone;
  rune: string;
  stone: Tone;
  glow: string;
  mark: string;
}

const TIERS: TierArt[] = [
  // A spark: a jagged stroke.
  {
    metal: 'copper',
    name: 'Copper',
    tone: M.copper,
    wood: M.pine,
    rune: 'Spark',
    stone: M.stone,
    glow: '#ffe27a',
    mark: 'M21 13 L28 22 L20 27 L27 36',
  },
  // A gale: three streaming lines.
  {
    metal: 'bronze',
    name: 'Bronze',
    tone: M.bronze,
    wood: M.ash,
    rune: 'Gale',
    stone: M.stone,
    glow: '#e4f8ff',
    mark: 'M15 17 C21 13 27 21 33 17 M15 25 C21 21 27 29 33 25 M15 33 C21 29 27 37 31 33',
  },
  // A tide: two waves.
  {
    metal: 'iron',
    name: 'Iron',
    tone: M.iron,
    wood: M.oak,
    rune: 'Tide',
    stone: M.stone,
    glow: '#7fd0ff',
    mark: 'M14 21 C18 16 22 26 26 21 C30 16 33 24 34 21 M14 30 C18 25 22 35 26 30 C30 25 33 33 34 30',
  },
  // The earth: a hill with its root.
  {
    metal: 'steel',
    name: 'Steel',
    tone: M.steel,
    wood: M.yew,
    rune: 'Earth',
    stone: M.mud,
    glow: '#b4e07a',
    mark: 'M14 33 L24 15 L34 33 M19 26 L29 26 M24 33 L24 38',
  },
  // The moon: a crescent.
  {
    metal: 'moonsilver',
    name: 'Moonsilver',
    tone: M.moonsilver,
    wood: M.mapleWood,
    rune: 'Moon',
    stone: M.moonrock,
    glow: '#f2f6ff',
    mark: 'M28 13 C17 15 17 35 28 37 C22 31 22 19 28 13 Z',
  },
  // A star: six rays.
  {
    metal: 'star-iron',
    name: 'Star-iron',
    tone: M.starIron,
    wood: M.silverWood,
    rune: 'Star',
    stone: M.starIron,
    glow: '#c9bcff',
    mark: 'M24 13 L24 37 M14 19 L34 31 M34 19 L14 31',
  },
  // An ember: a flame.
  {
    metal: 'embersteel',
    name: 'Embersteel',
    tone: M.embersteel,
    wood: M.elderWood,
    rune: 'Ember',
    stone: M.obsidian,
    glow: '#ffb24d',
    mark: 'M24 13 C30 21 32 26 29 32 C27 36 21 36 19 32 C17 27 21 23 24 13 Z',
  },
  // The dawn: the sun on the skyline.
  {
    metal: 'dawnsteel',
    name: 'Dawnsteel',
    tone: M.dawnsteel,
    wood: M.ancientWood,
    rune: 'Dawn',
    stone: tone('#fff3cf', '#e2c983', '#a4873f'),
    glow: '#ff8a5c',
    mark: 'M14 32 L34 32 M18 32 C18 23 30 23 30 32 M24 15 L24 20 M15 20 L18 23 M33 20 L30 23',
  },
];

export const SUPPLY_ICONS: Record<string, IconDef> = {
  fletching: { draw: FletchingSeal, family: 'skill', title: 'Fletching' },
  runecraft: { draw: RunecraftSeal, family: 'skill', title: 'Runecraft' },
  ...Object.fromEntries(
    TIERS.flatMap((t, i): [string, IconDef][] => [
      [
        `${t.metal}-arrows`,
        { draw: () => <Arrows metal={t.tone} wood={t.wood} />, family: 'supply', title: `${t.name} arrows` },
      ],
      [
        `${t.metal}-whetstones`,
        { draw: () => <Whetstone metal={t.tone} />, family: 'supply', title: `${t.name} whetstones` },
      ],
      [
        `${t.rune.toLowerCase()}-rune`,
        { draw: () => <Rune stone={t.stone} glow={t.glow} mark={t.mark} />, family: 'supply', title: `${t.rune} rune` },
      ],
      ...(i === 0
        ? []
        : ([
            [
              `${t.metal}-key`,
              { draw: () => <StoneKey metal={t.tone} glow={t.glow} />, family: 'supply', title: `${t.name} key` },
            ],
          ] as [string, IconDef][])),
    ]),
  ),
};
