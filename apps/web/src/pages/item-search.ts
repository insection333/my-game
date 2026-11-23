// Finding an item in the Storehouse (session 186): a player a year in holds up to 192 kinds of item in
// panels by kind, where nothing found one but scrolling. Every word typed must begin a word of the name
// ("bar" finds the bars, not silverbark logs), in any case, without apostrophes or accents.

/** Kinds of item held from which the search is offered: past the first Storehouse's 24 spaces and an
 *  enlargement, where the grid runs past a phone's screen. */
export const SEARCH_FROM = 30;

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/['’]/g, '').toLowerCase();

const words = (s: string) =>
  fold(s)
    .split(/[\s-]+/)
    .filter(Boolean);

export function itemMatches(name: string, query: string): boolean {
  const n = words(name);
  return words(query).every((w) => n.some((x) => x.startsWith(w)));
}
