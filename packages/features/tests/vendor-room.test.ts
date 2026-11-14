// The vendor and a full Storehouse (session 101): Buy 10 on a food not carried, with every space taken, was
// pressable and did nothing at all; the row now says there is no room, and its Buy is closed.
import { XP_TABLE } from '@idle-clash/content';
import { newState, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import type { FoodView } from '../src/storehouse/index.ts';
import { storehouse } from '../src/storehouse/index.ts';
import { START_SLOTS } from '../src/shared/storehouse.ts';

const T0 = Date.UTC(2026, 10, 14, 9);
const ores = ['copper-ore', 'tin-ore', 'iron-ore', 'coal', 'copper-bar', 'bronze-bar', 'iron-bar', 'pine-logs'];
const logs = ['oak-logs', 'birds-nest', 'amber-nugget', 'carved-acorn', 'copper-sword', 'bronze-sword'];
const gear = ['copper-staff', 'bronze-staff', 'copper-bow', 'bronze-bow', 'copper-helm', 'bronze-helm', 'copper-body'];
const held = [...ores, ...logs, ...gear, 'bronze-body', 'copper-legs'];
const player = (items: string[]): State => ({
  ...newState(5, T0),
  skills: { hitpoints: { xp: XP_TABLE[10] } },
  items: { gold: 5_000, ...Object.fromEntries(items.map((i) => [i, 3])) },
});
const row = (s: State, item: string) =>
  (storehouse.slots['combat.food']({ state: s, now: T0 }) as unknown as FoodView).shop.find((r) => r.item === item)!;

describe("the vendor's food in a full Storehouse", () => {
  it('says there is no room for a food not carried, and only then', () => {
    expect(held.length).toBe(START_SLOTS - 1);
    const full = player([...held, 'bread']);
    expect(row(full, 'meat-pie')).toMatchObject({ noRoom: 'No room in the Storehouse' });
    expect(row(full, 'bread').noRoom).toBeNull(); // carried already: more bread needs no new space
    expect(row(player(held), 'meat-pie').noRoom).toBeNull();
  });
});
