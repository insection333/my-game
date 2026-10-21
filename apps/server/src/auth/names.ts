// Names other players will see: the obvious offences and the names that would pass for the game's
// own are refused at sign-up and on renaming. The admin page renames anything this misses.
// The list is kept short on purpose: it catches common English profanity, written plainly or with
// digits and symbols for letters, without refusing ordinary names that merely contain the letters.

/** Names that would read as the game speaking. */
const RESERVED = ['admin', 'administrator', 'moderator', 'mod', 'idleclash', 'system', 'support', 'staff'];

/** Roots refused anywhere in a name: they hide inside no ordinary word. */
const ANYWHERE = ['fuck', 'shit', 'nigg', 'fagg', 'whore', 'rapist', 'nazi', 'hitler', 'retard', 'wank', 'bollock'];

/** Roots refused at the start of a word ("Cuntface"), but not inside one ("Scunthorpe"). */
const WORD_START = ['cunt', 'twat', 'slut', 'bitch', 'penis', 'vagina', 'porn'];

/** Words refused alone or with a common ending ("Dick", "Dickhead"), not as the start of another
 *  word ("Dickens", "Assam", "Cockburn"). */
const WHOLE = ['cock', 'dick', 'cum', 'tits', 'piss', 'arse', 'ass', 'prick', 'knob'];
const ENDINGS = ['', 's', 'y', 'head', 'face', 'hole', 'wad'];

const LOOKALIKE: Record<string, string> = {
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '8': 'b',
  '@': 'a',
  $: 's',
};

const squash = (name: string) =>
  name
    .toLowerCase()
    .replace(/[01345784@$]/g, (c) => LOOKALIKE[c] ?? c)
    .replace(/[_-]/g, ' ')
    .replace(/[^a-z ]/g, '');

export function nameAllowed(name: string): boolean {
  const plain = squash(name);
  const joined = plain.replace(/ /g, '');
  if (RESERVED.includes(joined)) return false;
  if (ANYWHERE.some((w) => joined.includes(w))) return false;
  // Single letters spelled out with spaces ("f u c k") are read as one word.
  const words = [...plain.split(' ').filter(Boolean), joined];
  if (words.some((w) => WORD_START.some((bad) => w.startsWith(bad)))) return false;
  return !words.some((w) => WHOLE.some((bad) => ENDINGS.some((end) => w === bad + end)));
}
