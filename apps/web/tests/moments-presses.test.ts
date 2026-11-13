// Moments for what the player's own presses and rewards bring (sessions 92 and 93): a milestone's gold
// drawn, and a Rare find used answered.
import { FEATURES, recap } from '@idle-clash/features';
import type { GameEvent } from '@idle-clash/kernel';
import { hasIcon } from '@idle-clash/ui';
import { describe, expect, it } from 'vitest';
import { momentsFrom } from '../src/shell/moments.ts';

const T = Date.UTC(2026, 9, 21, 9);

describe('moments for presses and rewards', () => {
  // Session 92: a milestone paid in gold drew an empty box in its moment (and a dot in the tray): its
  // picture, 'gold', was named but never drawn.
  it('draws a milestone paid in gold with a drawn picture, in its moment and its notice', () => {
    const e: GameEvent = { type: 'goalDone', at: T, goal: 'milestone-total-50', name: 'Reach total level 50' };
    const [m] = momentsFrom([e], T - 1, FEATURES);
    expect(m.icon).not.toBeNull();
    expect(hasIcon(m.icon!)).toBe(true);
    const line = recap.noticeLine(e)!;
    expect(hasIcon(line.icon!)).toBe(true);
  });

  // Session 93: a Rare find used was answered only when it crossed a mastery step, and then by the step
  // alone; the use now has its toast, leading the step it brought.
  it('answers a find used, leading any mastery step it brought', () => {
    const action = { feature: 'woodcutting', id: 'oak-tree' };
    const used: GameEvent = { type: 'findUsed', at: T, item: 'carved-acorn', action, completions: 500 };
    const [alone] = momentsFrom([used], T - 1, FEATURES);
    expect(alone).toMatchObject({
      size: 'toast',
      title: 'Carved acorn used on Oak tree',
      body: '+500 mastery completions',
      icon: 'carved-acorn',
    });
    const [led] = momentsFrom([used, { type: 'masteryStep', at: T, action, step: 6 }], T - 1, FEATURES);
    expect(led.title).toBe('Carved acorn used on Oak tree');
    expect(led.body).toMatch(/^\+500 mastery completions\. Also: Oak tree: mastery 6/);
  });

  // Steps one action climbed at once read as the step reached, not each in turn ("Pine tree: mastery 1;
  // Pine tree: mastery 2; …").
  it('says the step reached when one action climbs several at once', () => {
    const action = { feature: 'woodcutting', id: 'pine-tree' };
    const steps: GameEvent[] = [1, 2, 3, 4].map((step) => ({ type: 'masteryStep', at: T, action, step }));
    const used: GameEvent = { type: 'findUsed', at: T, item: 'carved-acorn', action, completions: 500 };
    const [m] = momentsFrom([used, ...steps], T - 1, FEATURES);
    expect(m.body).toBe('+500 mastery completions. Also: Pine tree: mastery 4.');
  });

  // Session 98: raising a relic changed its row in silence; it is answered as a work raised is.
  it('answers a relic raised, a banner at its last rank', () => {
    const [m] = momentsFrom([{ type: 'relicRaised', at: T, relic: 'relic-woodcutting', rank: 1 }], T - 1, FEATURES);
    expect(m).toMatchObject({
      size: 'toast',
      title: 'Heartwood charm raised to rank 1 of 5',
      body: 'Now: +1% Woodcutting XP',
      icon: 'relic-woodcutting',
    });
    const [top] = momentsFrom([{ type: 'relicRaised', at: T, relic: 'relic-woodcutting', rank: 5 }], T - 1, FEATURES);
    expect(top).toMatchObject({
      size: 'banner',
      title: 'Heartwood charm fully raised',
      body: 'Now: +5% Woodcutting XP',
    });
  });
});
