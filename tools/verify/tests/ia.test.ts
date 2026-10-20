import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { readPageMap } from '../ia.ts';

const doc = (menuRows: string[], slotRows: string[]) =>
  [
    '## 1. The menu',
    '| Entry | Page |',
    '| --- | --- |',
    ...menuRows.map((r) => `| ${r} | x |`),
    '',
    '## 3. Pages',
    '### Hearth',
    '| Slot | Where |',
    '| --- | --- |',
    ...slotRows.map((r) => `| ${r} | x |`),
    '## 4. Next',
  ].join('\n');

describe('readPageMap', () => {
  it('reads the menu, pages and slots', () => {
    const map = readPageMap(doc(['Hearth', 'Skills'], ['`hearth.today`', '`shell.lane` (×4)']));
    expect(map).toEqual({
      menu: ['Hearth', 'Skills'],
      pages: ['Hearth'],
      slots: ['hearth.today', 'shell.lane'],
      problems: [],
    });
  });

  it('refuses more than six menu entries', () => {
    const map = readPageMap(doc(['A', 'B', 'C', 'D', 'E', 'F', 'G'], ['`a.b`']));
    expect(map.problems).toContain('The menu has 7 entries; at most 6');
  });

  it('refuses a slot listed twice or badly named', () => {
    const map = readPageMap(doc(['A'], ['`a.b`', '`a.b`', '`Bad-Name`']));
    expect(map.problems).toEqual(['Slot "a.b" is listed twice', 'Slot "Bad-Name" is not named page.slot']);
  });

  it("reads the project's own IA.md cleanly", () => {
    const map = readPageMap(readFileSync(new URL('../../../IA.md', import.meta.url), 'utf8'));
    expect(map.problems).toEqual([]);
    expect(map.menu).toEqual(['Hearth', 'Skills', 'Combat', 'Storehouse', 'Hiscores']);
    expect(map.slots).toContain('item.panel');
    expect(map.slots).toContain('hearth.goals');
    expect(map.slots.length).toBeGreaterThan(20);
  });
});
