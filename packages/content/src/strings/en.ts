// Every player-facing word in the game. Templates take {named} parameters, always already formatted
// (see numbers.ts). The content check fails on a missing key, an unused key, or a term GLOSSARY.md
// says to avoid. Keep sections in order; within a feature's section, keys follow its content.
export const en: Record<string, string> = {
  // The lanes
  'lane.gathering': 'Gathering',
  'lane.gathering2': 'Gathering (the fire)',
  'lane.artisan': 'Artisan',
  'lane.combat': 'Combat',

  // Why a lane stopped (kernel codes)
  'stop.unavailable': 'That action is not available',
  'stop.wrongLane': 'That action belongs in another lane',
  'stop.fireOut': 'The fire went out',
  'stop.stoppedByPlayer': 'Stopped',
  'stop.mended': 'Stopped while your save was mended',
  'stop.levelTooLow': 'Needs level {level}',

  // Effects: what perks and mastery do
  'effect.speed': '{pct} faster',
  'effect.extraYield': '+{pct} chance of an extra item',
  'effect.findChance': 'Rare and Legendary finds {pct} likelier',
  'effect.masteryGain': 'mastery {pct} faster',
  'effect.saveInput': '{pct} chance to save an ingredient',
  'effect.damage': '+{pct} damage',
  'effect.accuracy': '+{pct} to hit',
  'effect.guard': '{pct} less damage taken',
  'effect.spoils': '+{pct} gold and drops',
  'effect.maxHealth': '+{amount} health',
  'effect.regen': 'health returns {pct} faster',
  'effect.foodHeal': 'food heals {pct} more',
  'effect.retreatAt': 'retreat at {pct} health instead of {base}',

  // Skills, shared by every skill page
  'skill.level': 'Level {level}',
  'skill.toNext': '{xp} XP to level {level}',
  'skill.top': 'Top level reached',
  'skill.nextUnlock': 'Level {level}: {unlock}',
  'skill.xpAway': '{xp} XP away',
  'unlock.perk': '{name} {rank} ({effect})',
  'unlock.perkOnce': '{name} ({effect})',
  'action.opensAt': 'Opens at level {level}',
  'action.xpPerHour': '{xp} XP an hour',
  'action.gives': '{item} ×{count}',
  'mastery.step': 'Mastery {step}',

  // Woodcutting
  'skill.woodcutting': 'Woodcutting',
  'help.woodcutting.title': 'Woodcutting',
  'help.woodcutting.body':
    'Cut trees in the Gathering lane for logs. Logs sell to the vendor, and Smithing turns them into bows and staves. Old trees open four levels after their kind: slower, but two logs each.',
  'action.woodcutting.pine-tree': 'Pine tree',
  'action.woodcutting.old-pine': 'Old pine',
  'action.woodcutting.ash-tree': 'Ash tree',
  'action.woodcutting.old-ash': 'Old ash',
  'action.woodcutting.oak-tree': 'Oak tree',
  'action.woodcutting.old-oak': 'Old oak',
  'action.woodcutting.yew-tree': 'Yew tree',
  'action.woodcutting.old-yew': 'Old yew',
  'item.pine-logs': 'Pine logs',
  'item.ash-logs': 'Ash logs',
  'item.oak-logs': 'Oak logs',
  'item.yew-logs': 'Yew logs',
  'perk.quick-swing': 'Quick swing',
  'perk.plenty': 'Plenty',
  'perk.woodsmans-eye': "Woodsman's eye",
  'perk.practised-hands': 'Practised hands',
  'perk.master-woodcutter': 'Master woodcutter',
};
