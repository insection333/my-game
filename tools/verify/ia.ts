// Reads IA.md: the menu, the pages and every slot. The manifest check (session 3) compares each
// feature's slot contributions against this list.

export interface ViewSpec {
  /** The page heading in IA.md this view belongs to. */
  page: string;
  path: string;
  /** Slots that must be visible without scrolling at 390 x 844 and at 1,440 x 900. */
  phone: string[];
  desktop: string[];
  /** Who the page is opened as: the run's newcomer (the default), a player three weeks in, or a
   *  visitor who is not signed in. */
  as?: 'veteran' | 'visitor';
}

export interface PageMap {
  menu: string[];
  pages: string[];
  slots: string[];
  views: ViewSpec[];
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

/** Every table in the text, as its rows of trimmed cells (header first, divider dropped). */
function tables(md: string): string[][][] {
  const out: string[][][] = [];
  let rows: string[][] = [];
  for (const line of [...md.split('\n'), '']) {
    if (line.startsWith('|')) {
      if (!/^\|\s*-/.test(line))
        rows.push(
          line
            .split('|')
            .slice(1, -1)
            .map((c) => c.trim()),
        );
    } else if (rows.length) {
      out.push(rows);
      rows = [];
    }
  }
  return out;
}

const isViewTable = (t: string[][]) => t[0]?.[0] === 'View';
const ticks = (cell: string) => [...cell.matchAll(/`([^`]+)`/g)].map((m) => m[1]);

/** In each slot table's rows, the first cell that starts with a backticked name: the slot column. */
function slotCells(md: string): string[] {
  return tables(md)
    .filter((t) => !isViewTable(t))
    .flatMap((t) => t.slice(1).flatMap((row) => row.find((c) => c.startsWith('`')) ?? []));
}

/** The "Visible without scrolling" tables, under the page heading each sits in. */
function viewSpecs(md: string): ViewSpec[] {
  const specs: ViewSpec[] = [];
  const pagesText = section(md, /^## 3\. Pages/);
  const parts = pagesText.split(/^### /m).slice(1);
  for (const part of parts) {
    const page = part.split('\n')[0].trim();
    for (const t of tables(part).filter(isViewTable)) {
      for (const row of t.slice(1))
        specs.push({ page, path: row[0], phone: ticks(row[1] ?? ''), desktop: ticks(row[2] ?? '') });
    }
  }
  return specs;
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
  const views = viewSpecs(md);
  for (const v of views) {
    for (const slot of [...v.phone, ...v.desktop]) {
      if (!slots.includes(slot)) problems.push(`View ${v.path} expects slot "${slot}", which IA.md does not list`);
    }
  }
  return { menu, pages, slots, views, problems };
}
