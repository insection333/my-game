// Six finds per skill (GAME_DESIGN.md section 8): a lesser and a greater at each rarity.
import type { SkillId } from './content.ts';

export const FINDS: Record<Exclude<SkillId, 'hitpoints'>, [string, string][]> = {
  woodcutting: [
    ["Bird's nest", 'Amber nugget'],
    ['Carved acorn', 'Heartwood knot'],
    ['Silverbark seed', 'Crown of the old wood'],
  ],
  mining: [
    ['Rough garnet', 'Rough sapphire'],
    ['Ancient coin', 'Crystal geode'],
    ['Star-iron shard', 'Heart of the mountain'],
  ],
  fishing: [
    ['Pearl mussel', 'River pearl'],
    ['Message in a bottle', 'Drowned signet'],
    ['Scale of the deep', "Fen-king's crown"],
  ],
  cooking: [
    ['Wild herbs', 'Saffron threads'],
    ["Grandmother's recipe", 'Silver ladle'],
    ['Ever-warm pot', 'Cauldron of plenty'],
  ],
  fletching: [
    ['Heron quill', 'Hawk feather'],
    ["Fletcher's knife", 'Waxed bowstring'],
    ['Arrow of the first hunt', 'Quiver of the wild hunt'],
  ],
  runecraft: [
    ['Chalk stub', 'Cracked rune'],
    ["Seer's stone", 'Rubbing of a lost rune'],
    ['Rune of the old kings', 'Star chart of the ancients'],
  ],
  smithing: [
    ['Lucky horseshoe', 'Masterwork rivets'],
    ["Guild smith's seal", 'Quenching flask'],
    ['Ember of the first forge', "Old king's hammer"],
  ],
  melee: [
    ['Battle trophy', "Raider's war-horn"],
    ['Torn banner', "Warlord's seal"],
    ["Shard of a king's blade", "Troll-chief's tooth"],
  ],
  archery: [
    ['Goose fletchings', "Hunter's charm"],
    ['Silver arrowhead', "Bowman's ring"],
    ['Moonlit bowstring', 'Eagle-feather circlet'],
  ],
  magic: [
    ['Glimmer stone', 'Wisp lantern'],
    ['Rune-scratched tablet', "Wight's ring"],
    ['Star-glass orb', "Sorcerer's eye"],
  ],
};
