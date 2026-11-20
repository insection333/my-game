// Gold as a player types it into the treasury's box (session 158): whole gold, grouped however they group
// thousands (spaces, commas, apostrophes, or dots in threes: "1.000.000"), or in the short forms the game
// itself writes ("250K", "1.2M", "1,5M"). Anything else is not an amount. Null when it is not one.

const SHORT: Record<string, number> = { k: 1e3, m: 1e6, b: 1e9 };
const MOST = 1e15;

export function goldTyped(text: string): number | null {
  const plain = text.trim().replace(/[\s_']/g, '');
  // A short form: a number with at most one decimal mark, then K, M or B.
  const short = /^(\d+(?:[.,]\d+)?)([kmb])$/i.exec(plain);
  if (short) {
    const [whole, part = ''] = short[1].split(/[.,]/);
    // "1.2M" is 12 hundred-thousands; "1.2345K" is 1,234.5, not whole gold.
    const zeros = Math.log10(SHORT[short[2].toLowerCase()]) - part.length;
    const gold = zeros >= 0 ? Number(whole + part) * 10 ** zeros : Number(whole + part) / 10 ** -zeros;
    return Number.isSafeInteger(gold) && gold < MOST ? gold : null;
  }
  // Commas or dots grouping thousands, in threes ("1,000,000", "1.000.000"); any other is a decimal mark,
  // and "1,5" or "1.5" is not whole gold.
  const grouped = /^\d{1,3}([.,])\d{3}(\1\d{3})*$/.test(plain) ? plain.replace(/[.,]/g, '') : plain;
  return /^\d{1,15}$/.test(grouped) ? Number(grouped) : null;
}
