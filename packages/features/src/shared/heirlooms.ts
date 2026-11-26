// Heirlooms (session 251, the plan of 26 November, phase 4): gear was one straight line of eight tiers, and a
// boss's Rare and Legendary finds, once their uses were spent, had nothing more to give. Six heirlooms, one a
// boss, are forged at Smithing 90 from ten of the boss's Rare find and its Legendary find: each a piece of the
// last tier's strength with one trait, its boss's way turned to the wearer. Never tempered and never sold, so
// an heirloom is not stronger than tempered dawnsteel, only different: it wins where its trait bites. Shared,
// because Smithing forges them and the fighter, Your odds, the arena and the Deep all fight with them.
import { type GearSlot, type Style } from '@idle-clash/content';
import { countOf, type State } from '@idle-clash/kernel';
import { bossById } from './expeditions/data.ts';

export type HeirloomTrait = 'standfast' | 'fury' | 'mire' | 'tide' | 'gale' | 'ember';
export interface Heirloom {
  item: string;
  boss: string;
  slot: GearSlot;
  style?: Style;
  trait: HeirloomTrait;
}

export const HEIRLOOMS: readonly Heirloom[] = [
  // The Barrow-king's wights rise as it falls: its helm stands fast as the wearer does.
  { item: 'barrow-helm', boss: 'barrow-king', slot: 'helm', trait: 'standfast' },
  // The Troll-chief rages as it is hurt: so does its blade.
  { item: 'troll-blade', boss: 'troll-chief', slot: 'weapon', style: 'melee', trait: 'fury' },
  // The Mire-mother mends: her mail mends the wearer after a fight won.
  { item: 'mire-mail', boss: 'mire-mother', slot: 'body', trait: 'mire' },
  // The Drowned Warden takes a full blow only from its beater: its bow is blunted half as much by any foe.
  { item: 'warden-bow', boss: 'drowned-warden', slot: 'weapon', style: 'archery', trait: 'tide' },
  // The Storm-roc's plumage turns blows: its greaves turn one hit in ten aside.
  { item: 'roc-greaves', boss: 'storm-roc', slot: 'legs', trait: 'gale' },
  // The Ember Wyrm's fire: its staff's critical hits on a boss burn half again.
  { item: 'wyrm-staff', boss: 'ember-wyrm', slot: 'weapon', style: 'magic', trait: 'ember' },
];

export const HEIRLOOM = {
  /** The Smithing level that opens the forging, and the boss's Rare finds each takes (with its Legendary). */
  OPENS: 90,
  TROPHIES: 10,
  /** The traits' numbers. */
  /** Below three quarters of health: a fighter eats at half, so health stands between half and full. */
  STANDFAST_BELOW: 0.75,
  STANDFAST_TAKEN: 0.8,
  FURY_BELOW: 0.75,
  FURY_DEALT: 1.2,
  MIRE_HEALS: 0.02,
  GALE_CHANCE: 0.1,
  EMBER_CRIT: 1.5,
} as const;

export const heirloomOf = (item: string): Heirloom | null => HEIRLOOMS.find((h) => h.item === item) ?? null;

/** What forging an heirloom takes: ten of its boss's Rare find and its Legendary find. */
export function heirloomCost(h: Heirloom): { item: string; count: number }[] {
  const boss = bossById(h.boss)!;
  return [
    { item: boss.finds.rare, count: HEIRLOOM.TROPHIES },
    { item: boss.finds.legendary, count: 1 },
  ];
}

/** The traits of the heirlooms worn, for the fighter. */
export function heirloomTraits(worn: readonly (string | null)[]): HeirloomTrait[] {
  return worn.flatMap((id) => (id ? [heirloomOf(id)?.trait].filter((t): t is HeirloomTrait => !!t) : []));
}

/** What an heirloom's forging lacks, by item, or nothing. */
export const heirloomShort = (state: State, h: Heirloom) =>
  heirloomCost(h).filter((c) => countOf(state, c.item) < c.count);
