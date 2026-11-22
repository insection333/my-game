// Companions (session 179): fourteen small creatures that join a player by chance, one for each skill and
// each boss, shown beside their picture; their deeds and their place among the honours. Part of the strings
// file (en.ts).
export const companions: Record<string, string> = {
  'honour.kind.companion': 'Companion',
  'honour.none.companion': 'No companion',
  'honour.companion.note':
    'A companion joins you by chance as you train its skill, or as you beat its boss. It gives nothing but company.',
  'honour.companion.squirrel': 'Red squirrel',
  'honour.companion.mole': 'Mole',
  'honour.companion.otter': 'Otter',
  'honour.companion.moth': 'Ley moth',
  'honour.companion.salamander': 'Salamander',
  'honour.companion.cat': 'Kitchen cat',
  'honour.companion.goose': 'Grey goose',
  'honour.companion.hound': 'Hound pup',
  'honour.companion.falcon': 'Falcon',
  'honour.companion.toad': 'Toad',
  'honour.companion.tortoise': 'Tortoise',
  'honour.companion.stone-whelp': 'Stone whelp',
  'honour.companion.lantern-frog': 'Lantern frog',
  'honour.companion.wyrmling': 'Wyrmling',
  // Their deeds: each one's words say where it joins you and the span it joins within, never the point.
  'deed.companion.name': '{companion} joins you',
  'deed.companion.text': 'Train {skill}: somewhere between levels {from} and {to}, a companion joins you.',
  'deed.companionBoss.name': '{companion} joins you',
  'deed.companionBoss.text': 'Beat {boss}: somewhere within your first {to} wins, a companion follows you home.',
  'deed.companions.name': '{count} companions',
  'deed.companions.text': 'Have {count} companions join you.',
  'deeds.family.companion': 'Companions',
  'deeds.family.companions': 'Companions gathered',
};
