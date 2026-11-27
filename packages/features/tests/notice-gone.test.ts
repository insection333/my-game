// A notice naming what the game no longer has (session 284): the server keeps a player's last hundred notices,
// and a later build may rename or let go of an item, a skill or a foe they name. Every string asked of the
// content throws when it is missing, and the tray is asked on every draw (the bell is always there), so one
// such notice broke the whole game into "Something broke here". It is now left out of the tray and the recap,
// as worn gear gone from the game is worn by no one.
import { XP_TABLE } from '@idle-clash/content';
import { newState, type GameEvent, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { FEATURES, recap } from '../src/index.ts';
import { slotsUsed } from '../src/shared/storehouse.ts';
import { T0 } from './helpers/expedition.ts';

describe('what the game no longer has', () => {
  it('leaves a notice naming it out, where it threw', () => {
    const gone: GameEvent[] = [
      { type: 'find', at: T0, item: 'gone-item', rarity: 'rare', first: true } as GameEvent,
      { type: 'levelUp', at: T0, skill: 'gone-skill', level: 10 },
    ];
    for (const e of gone) expect(() => recap.noticeLine(e)).not.toThrow();
    expect(gone.map((e) => recap.noticeLine(e))).toEqual([null, null]);
  });

  it('wears no gear gone from the game, where the loadout asked its name', () => {
    const s: State = {
      ...newState(1, T0),
      skills: { melee: { xp: XP_TABLE[20] }, hitpoints: { xp: XP_TABLE[20] } },
      items: { 'gone-sword': 1, bread: 5 },
      features: { combat: { worn: { weapon: 'gone-sword' }, health: null, healthAt: T0, retreated: null } },
    };
    const combat = FEATURES.find((f) => f.id === 'combat')!;
    expect(() => JSON.stringify(combat.slots['combat.loadout']({ state: s, now: T0 }))).not.toThrow();
  });

  it('keeps no space in the Storehouse for an item it no longer has, which is shown nowhere and cannot be sold', () => {
    const s: State = { ...newState(1, T0), items: { gold: 5, 'pine-logs': 3, 'gone-item': 7 } };
    expect(slotsUsed(s)).toBe(1);
  });
});
