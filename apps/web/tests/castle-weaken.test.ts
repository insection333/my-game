// A lord the walls hold (session 142): two lords near one rating can hardly take each other (the
// defender's walls hold an even siege to 15–40%), and two poisonings take it near certain, yet the row
// said only "About 0% to win" beside its Siege. A scouted lord under even odds now says the spies can tip
// it, until they have.
import { castleEngine as E } from '@idle-clash/features';
import { describe, expect, it } from 'vitest';
import { spiesWouldTip } from '../src/pages/castle/targets.ts';

const lord = { id: 'l', name: 'Lord', rating: 4_800, spyChance: 0.6, struck: null, shieldedUntil: null, merc: null };
const stronghold = { ...lord, merc: {} as E.Mercenary };

describe('a lord the walls hold', () => {
  it('points to the spies when a scouted lord is under even odds', () => {
    expect(spiesWouldTip(lord, 0)).toBe(true);
    expect(spiesWouldTip(lord, 0.35)).toBe(true);
  });

  it('says nothing at even odds or better, before a scouting, or of a stronghold', () => {
    expect(spiesWouldTip(lord, 0.5)).toBe(false);
    expect(spiesWouldTip(lord, 0.9)).toBe(false);
    expect(spiesWouldTip(lord, null)).toBe(false);
    expect(spiesWouldTip(stronghold, 0.2)).toBe(false);
  });
});
