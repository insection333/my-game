// Tempering gear with boss trophies (session 216): at Smithing 90 a worn piece is tempered a step with its
// tier's bars and a boss's Rare find; a weapon only by trophies of bosses who fight in its style, armour by
// any; +1% damage or 1% less taken a step, five a piece, the set held under 10% each way; counted in Your odds.
import { XP_TABLE } from '@idle-clash/content';
import type { State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { FOES } from '../src/shared/combat/data.ts';
import { fighterOf } from '../src/shared/combat/state.ts';
import { oddsFor } from '../src/shared/combat/odds.ts';
import { stepsOf } from '../src/shared/temper.ts';
import { temperLine, temperedWords } from '../src/shared/temper-view.ts';
import { temper } from '../src/smithing/temper.ts';
import { fighterOfLevel } from './helpers/expedition.ts';

const golem = FOES.find((f) => f.id === 'obsidian-golem')!;
/** A fighter at 99 in melee (a tier-8 sword and armour), Smithing at `smithing`, with dawnsteel bars and finds. */
function smith(smithing = 90, items: Record<string, number> = {}): State {
  const s = fighterOfLevel(99, 1, 'melee');
  return {
    ...s,
    skills: { ...s.skills, smithing: { xp: XP_TABLE[smithing] } },
    items: { ...s.items, 'dawnsteel-bar': 10_000, ...items },
  };
}
const times = (s: State, slot: 'weapon' | 'helm' | 'body' | 'legs', n: number) => {
  for (let i = 0; i < n; i++) s = temper(s, slot).state;
  return s;
};

describe('tempering', () => {
  it('opens at Smithing 90, and takes the weapon’s style’s trophies only', () => {
    expect(temper(smith(89, { 'chieftains-torc': 5 }), 'weapon').result).toEqual({ ok: false, reason: 'locked' });
    // The Wyrm fights in Magic: its scale cannot temper a sword.
    expect(temper(smith(90, { 'wyrm-scale': 5 }), 'weapon').result).toEqual({ ok: false, reason: 'trophies' });
    const s = smith(90, { 'chieftains-torc': 1, 'mire-pearl': 2 });
    const once = temper(s, 'weapon');
    expect(once.result).toEqual({ ok: true });
    const sword = s.features.combat as { worn: { weapon: string } };
    expect(stepsOf(once.state, sword.worn.weapon)).toBe(1);
    // The trophy held most goes first, and the step's bars.
    expect(once.state.items['mire-pearl']).toBe(1);
    expect(once.state.items['dawnsteel-bar']).toBe(10_000 - 20);
    expect(once.events[0]).toMatchObject({ type: 'gearTempered', step: 1 });
    expect(temperedWords(sword.worn.weapon, 1).body).toBe('Now: +1% damage');
  });

  it('gives +1% damage a weapon step and 1% less taken an armour step, held under 10%', () => {
    const s = smith(90, { 'wyrm-scale': 100, 'chieftains-torc': 100 });
    const base = fighterOf(s, golem)!;
    const sword = times(s, 'weapon', 5);
    expect(fighterOf(sword, golem)!.perks.damage).toBe(base.perks.damage + 5);
    expect(temper(sword, 'weapon').result).toEqual({ ok: false, reason: 'full' });
    const armour = times(times(times(sword, 'helm', 5), 'body', 5), 'legs', 5);
    expect(fighterOf(armour, golem)!.perks.guard).toBe(base.perks.guard + 10);
    // Your odds count it: fewer meals an hour against the golem.
    expect(oddsFor(armour, golem)!.foodPerHour).toBeLessThan(oddsFor(s, golem)!.foodPerHour);
  });

  it("counts every armour step: a fifteenth of the set's 10% each, none past it held for nothing (session 225)", () => {
    const s = smith(90, { 'wyrm-scale': 100 });
    const base = fighterOf(s, golem)!;
    // Four steps on each piece: 12 of 15, 8% (at 1% a step the set was held at 10% from its tenth step on).
    const four = times(times(times(s, 'helm', 4), 'body', 4), 'legs', 4);
    expect(fighterOf(four, golem)!.perks.guard).toBeCloseTo(base.perks.guard + 8);
    const helm = (s.features.combat as { worn: { helm: string } }).worn.helm;
    expect(temperedWords(helm, 1).body).toBe('Now: 0.7% less damage taken');
    expect(temperLine(times(s, 'helm', 5), helm)?.steps).toBe('Tempered 5 of 5: 3.3% less damage taken');
  });

  it('says on the gear sheet what the next step takes and what is short', () => {
    const s = smith(90, { 'chieftains-torc': 1 });
    const sword = (s.features.combat as { worn: { weapon: string } }).worn.weapon;
    const once = temper(s, 'weapon').state;
    expect(temperLine(once, sword)).toMatchObject({
      steps: 'Tempered 1 of 5: +1% damage',
      next: 'Next step: Dawnsteel bar ×40 and 2 trophies',
      short: 'Short of 2 trophies',
      ready: false,
    });
    expect(temperLine(smith(80), sword)).toBeNull();
  });
});
