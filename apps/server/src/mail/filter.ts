// What a message may say (session 45). Plain text only: markup, control characters and invisible letters
// are taken out, lines run together, spaces collapse, and 250 characters is the most. Then the language
// players may not send one another is refused, the sender warned, and the attempt kept for the admin.
// Stricter than the names filter, because a message is free text: it sees through digits and symbols for
// letters, letters spelled out with spaces or dots between them, and letters held long ("fuuuck"), while
// leaving ordinary words that merely contain the letters ("Scunthorpe", "class hit", "assess") alone.

/** A character class from ranges of code points (written as numbers, so the source holds no invisible
 *  characters of its own). */
const ranges = (list: [number, number][]) =>
  new RegExp(`[${list.map(([a, b]) => `\\u${hex(a)}-\\u${hex(b)}`).join('')}]`, 'g');
const hex = (n: number) => n.toString(16).padStart(4, '0');
/** Control characters, read as a space. */
const CONTROL = ranges([
  [0x0000, 0x001f],
  [0x007f, 0x009f],
  [0x2028, 0x2029],
]);
/** The invisible characters used to hide words (zero-width, direction marks): taken out altogether. */
const HIDDEN = ranges([
  [0x200b, 0x200f],
  [0x202a, 0x202e],
  [0x2060, 0x206f],
  [0xfeff, 0xfeff],
]);
/** Accents, once letters are taken apart (NFKD): "fück" reads as "fuck". */
const MARKS = ranges([[0x0300, 0x036f]]);

/** The message as it will be kept: plain text on one line (its length checked by the sender's rules), or
 *  null if nothing is left. */
export function cleanMessage(raw: string): string | null {
  const text = raw
    .normalize('NFKC')
    // Markup is not text: <b>, <script>…</script>, <img src=…>.
    .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    // Control characters and the invisible ones used to hide words.
    .replace(HIDDEN, '')
    .replace(CONTROL, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text || null;
}

const LOOKALIKE: Record<string, string> = {
  '0': 'o',
  '1': 'i',
  '!': 'i',
  '|': 'i',
  '3': 'e',
  '4': 'a',
  '@': 'a',
  '5': 's',
  $: 's',
  '7': 't',
  '+': 't',
  '8': 'b',
  '9': 'g',
};

/** Roots refused anywhere in a word: no ordinary word holds them. */
const ANYWHERE = [
  'fuck',
  'fck',
  'shit',
  'nigg',
  'fagg',
  'whore',
  'rapist',
  'nazi',
  'hitler',
  'retard',
  'wank',
  'bollock',
  'motherf',
  'cocksuck',
  'dickhead',
  'bitch',
  'kike',
  'spastic',
  'tranny',
];

/** Refused at the start of a word ("Cuntface"), not inside one ("Scunthorpe"). */
const WORD_START = ['cunt', 'twat', 'slut', 'penis', 'vagina', 'porn', 'chink', 'pussy', 'dyke'];

/** Refused alone or with a common ending ("dick", "dickface"), not as the start of another word
 *  ("Dickens", "assess", "Cockburn"). */
const WHOLE = ['cock', 'dick', 'cum', 'tits', 'piss', 'arse', 'ass', 'prick', 'knob', 'kys', 'spic', 'coon', 'fag'];
const ENDINGS = ['', 's', 'es', 'y', 'ed', 'er', 'ers', 'ing', 'head', 'face', 'hole', 'wad', 'hat', 'bag'];

/** The words of a message as the filter reads them: lookalikes turned to letters, each word's letters
 *  only, runs of single letters ("f u c k", "f.u.c.k") read as one word, and a lone letter read with
 *  the word beside it. */
function wordsOf(text: string): string[] {
  const plain = text
    .toLowerCase()
    .normalize('NFKD')
    .replace(MARKS, '')
    .replace(/[0-9!|@$+]/g, (c) => LOOKALIKE[c] ?? c);
  const raw = plain.split(/[^a-z]+/).filter(Boolean);
  const words: string[] = [];
  let run = '';
  for (const w of raw) {
    if (w.length === 1) run += w;
    else {
      if (run) words.push(run);
      run = '';
      words.push(w);
    }
  }
  if (run) words.push(run);
  // A letter split off a word ("f uck", "fuc k") is read with it too.
  for (let i = 0; i + 1 < raw.length; i++)
    if (raw[i].length === 1 || raw[i + 1].length === 1) words.push(raw[i] + raw[i + 1]);
  return words;
}

/** A word with its held letters let go ("fuuuck" → "fuck", "shiiit" → "shit"). */
const unheld = (w: string) => w.replace(/(.)\1+/g, '$1');

function refused(word: string): boolean {
  for (const w of new Set([word, unheld(word)])) {
    if (ANYWHERE.some((bad) => w.includes(bad))) return true;
    if (WORD_START.some((bad) => w.startsWith(bad))) return true;
    if (WHOLE.some((bad) => ENDINGS.some((end) => w === bad + end))) return true;
  }
  return false;
}

/** Whether a message may be sent. */
export const messageAllowed = (text: string): boolean => !wordsOf(text).some(refused);
