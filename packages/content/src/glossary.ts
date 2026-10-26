// The glossary as data. GLOSSARY.md is generated from this by pnpm verify; the content check fails
// when a string uses a term to avoid.

export const VOICE =
  'Plain, warm and brief, with an old-world flavour in names rather than in instructions. Say what happened and what to do next: "Smithing stopped: out of tin ore". Sentence case everywhere. Numbers always come from data through the formatter, never typed into text.';

export const TERMS: [term: string, meaning: string][] = [
  ['Action', 'One thing a lane repeats: chopping a pine, forging a helm, fighting a foe'],
  ['Advantage', "Your style beats the foe's: you deal more damage and take less"],
  ['Artisan lane', 'The lane that turns materials into bars and gear (Smithing)'],
  ['Away', 'Time you are not on the page; lanes keep working for up to 24 hours'],
  ['Away recap', 'What happened while you were away, best thing first'],
  ['Bar', 'Metal smelted from ore: copper, bronze, iron, steel'],
  ['Collection log', 'The record of every find you have made, by skill'],
  ['Combat lane', "The lane that fights; trains your weapon's style and Hitpoints"],
  ['Collect', 'Close the away recap: everything in it is already in your Storehouse'],
  ['Comes from', 'On an item: every action that produces it'],
  ['Daily goal', 'One larger goal a day'],
  ['Disadvantage', "The foe's style beats yours: you deal less damage and take more"],
  ['Drop', 'An item a foe leaves behind'],
  [
    'Easy, Fair, Costly, Too strong',
    'Your odds verdicts, by how much food a fight costs and whether you would retreat',
  ],
  ['Enlarge', 'Buy more Storehouse slots with gold'],
  ['Find', 'A rare extra from an action, at one of three rarities'],
  ['First steps', 'The six opening goals, each with a button'],
  ['Foe', 'Something to fight; each has a style, shown before you fight'],
  ['Gathering lane', 'The lane that cuts wood or mines ore; the fire opens a second one'],
  ['Gold', 'Earned from selling and from foes; buys food and Storehouse space'],
  ['Health', 'How much damage you can take; set by Hitpoints'],
  ['Hearth', 'The home page'],
  ['Hiscores', 'The ladders of every skill and the total'],
  ['Hitpoints', 'The skill that raises health, opens foes and lets you wear armour; trained by every fight'],
  ['Lane', 'One of your workers: Gathering, Artisan, Combat; each runs one action at a time'],
  ['Lasting mark', 'The bonus a Legendary find gives the first time you find it'],
  ['Legendary', 'The rarest find, about 1 in 5,000 actions'],
  ['Level', 'A step in a skill, 1 to 40; every level unlocks something'],
  ['Mastery', 'How practised you are at one action; each step makes it faster and richer'],
  ['Milestone', 'A long goal, such as total level 100'],
  ['Next action', "The action queued behind a lane's current one; it starts when the current one stops"],
  ['Notices', 'The tray of things that happened and need you'],
  ['Perk', 'A lasting bonus unlocked at a level'],
  ['Supply cache', 'What short goals and the daily goal pay in: gold for certain, and a draw for more'],
  ['Region', 'Where foes are fought: the march, the Sunken Fen and the Ashen Peaks, each a tab of Combat'],
  ['Rank', 'Your standing, from Wanderer to Legend of the Realm, rising with your total level'],
  ['Rare', 'A find of about 1 in 500 actions'],
  ['Retreat', 'Leaving a fight at low health with no food; nothing is lost and the lane stops'],
  ['Short goals', 'Three rolling goals of 10 to 15 minutes'],
  ['Slot', 'A space in the Storehouse for one kind of item, in any amount'],
  ['Stoke', 'Keep the fire burning'],
  ['Storehouse', 'Where everything you own is kept'],
  ['Storehouse full', 'No free slot for a new kind of item: a lane that would make one stops'],
  ['Style', 'Melee, Archery or Magic: set by the weapon you wear'],
  ['The fire', 'Burns while you play: more XP and a second Gathering lane'],
  ['Tier', 'A rank of material and gear: Copper, Bronze, Iron, Steel'],
  ['Total level', "Every skill's level added together"],
  ['Uncommon', 'The most frequent find, about 1 in 50 actions'],
  ['Unlock', 'What a level gives: an action, a recipe, a tier, a foe, a food or a perk'],
  ['Used in', 'On an item: every recipe and use that takes it'],
  ['Vendor', 'Buys anything you sell; sells food'],
  ['XP', 'Experience; earned by actions, it raises levels'],
  ['Your odds', "The fight engine's verdict on a foe with your current gear and food"],
];

export interface Avoid {
  /** Words to keep out of player-facing text (matched as whole words, ignoring case). */
  words: string[];
  use: string;
  /** Phrases where the word is allowed, such as the game's own name. */
  except?: string[];
}

export const AVOID: Avoid[] = [
  { words: ['inventory', 'bank'], use: 'Storehouse' },
  { words: ['queue', 'queued'], use: 'Next action' },
  { words: ['idle', 'AFK', 'offline'], use: 'Away', except: ['Idle Clash'] },
  { words: ['kill', 'kills', 'killed'], use: 'Defeat' },
  { words: ['prestige', 'rebirth'], use: 'Rekindling (later)' },
  { words: ['buff', 'buffs', 'debuff', 'debuffs'], use: 'Perk, or say what it does' },
];

/** Terms to avoid that appear in a text, after removing allowed phrases. */
export function avoidedTerms(text: string): string[] {
  const found: string[] = [];
  for (const a of AVOID) {
    let s = text;
    for (const e of a.except ?? []) s = s.split(e).join(' ');
    for (const w of a.words) if (new RegExp(`\\b${w}\\b`, 'i').test(s)) found.push(w);
  }
  return found;
}
