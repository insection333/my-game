// Reads IA.md: the menu, the pages and every slot. The manifest check (session 3) compares each
// feature's slot contributions against this list.

export interface PageMap {
  menu: string[];
  pages: string[];
  slots: string[];
  problems: string[];
}

const SLOT_ID = /^[a-z]+\.[a-z][a-zA-Z]*$/;
export const MAX_MENU_ENTRIES = 6;

function section(md: string, heading: RegExp): string {
  const lines = md.split('\n');
  const start = lines.findIndex((l) => heading.test(l));
  if (start < 0) return '';
  const end = lines.findIndex((l, i) => i > start && /^## /.test(l));
  return lines.slice(start + 1, end < 0 ? undefined : end).join('\n');
}

/** First cells of a section's table rows, skipping the header and divider rows. */
function firstCells(text: string): string[] {
  return text
    .split('\n')
    .filter((l) => l.startsWith('|') && !/^\|\s*-/.test(l))
    .map((l) => l.split('|')[1]?.trim() ?? '');
}

/** In each table row, the first cell that starts with a backticked name: the slot column. */
function slotCells(md: string): string[] {
  return md
    .split('\n')
    .filter((l) => l.startsWith('|'))
    .flatMap(
      (l) =>
        l
          .split('|')
          .map((c) => c.trim())
          .find((c) => c.startsWith('`')) ?? [],
    );
}

/** The first run of consecutive table lines in a section. */
function firstTable(text: string): string {
  const lines = text.split('\n');
  const start = lines.findIndex((l) => l.startsWith('|'));
  if (start < 0) return '';
  const end = lines.findIndex((l, i) => i > start && !l.startsWith('|'));
  return lines.slice(start, end < 0 ? undefined : end).join('\n');
}

export function readPageMap(md: string): PageMap {
  const problems: string[] = [];
  const menu = firstCells(firstTable(section(md, /^## 1\. The menu/))).slice(1);
  if (!menu.length) problems.push('IA.md has no menu table under "## 1. The menu"');
  if (menu.length > MAX_MENU_ENTRIES) problems.push(`The menu has ${menu.length} entries; at most ${MAX_MENU_ENTRIES}`);

  const pagesText = section(md, /^## 3\. Pages/);
  const pages = [...pagesText.matchAll(/^### (.+)$/gm)].map((m) => m[1].trim());
  if (!pages.length) problems.push('IA.md has no pages under "## 3. Pages"');

  const slots: string[] = [];
  for (const cell of slotCells(md)) {
    const m = /^`([^`]+)`/.exec(cell);
    if (!m) continue;
    if (!SLOT_ID.test(m[1])) problems.push(`Slot "${m[1]}" is not named page.slot`);
    else if (slots.includes(m[1])) problems.push(`Slot "${m[1]}" is listed twice`);
    else slots.push(m[1]);
  }
  if (!slots.length) problems.push('IA.md lists no slots');
  return { menu, pages, slots, problems };
}
