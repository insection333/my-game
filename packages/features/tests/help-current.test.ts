// The help, kept to the game as it is (session 196): the help sheets were written as each system came and
// some fell behind it. Hitpoints' said every fight trains it "whatever your style", where since session 177 a
// fight teaches it a third while the style stands below it; the goals' named only first steps, where the
// Hearth holds short goals, the day's, the week's contract and milestones; Combat's said nothing of
// bounties or the realm's boss, the gathering skills nothing of their lucky actions, Smithing nothing of
// whetstones and keys, the Storehouse nothing of selling finds at one press.
import { t } from '@idle-clash/content';
import { describe, expect, it } from 'vitest';
import { HITPOINTS_XP_BEHIND } from '../src/shared/combat/data.ts';
import { LUCKY } from '../src/shared/gathering.ts';

describe('the help', () => {
  it("says Hitpoints' share as the engine pays it", () => {
    expect(HITPOINTS_XP_BEHIND).toBeCloseTo(1 / 3);
    expect(t('help.hitpoints.body')).toMatch(/a third/);
    expect(t('help.hitpoints.body')).not.toMatch(/whatever your style/);
  });

  it('names every goal, the bounties and the realm’s boss, the lucky actions and selling finds', () => {
    for (const w of ['short goal', 'daily goal', "week's contract", 'milestone'])
      expect(t('help.goals.body')).toContain(w);
    for (const w of ['bount', "realm's boss"]) expect(t('help.combat.body')).toContain(w);
    expect(LUCKY.SLOWER).toBe(1.25);
    for (const skill of ['woodcutting', 'mining', 'fishing', 'runecraft'])
      expect(t(`help.${skill}.body`)).toMatch(/twice as likely/);
    expect(t('help.fletching.body')).toMatch(/by hand/);
    expect(t('help.smithing.body')).toMatch(/whetstones/);
    expect(t('help.storehouse.body')).toMatch(/Sell finds/);
  });

  it("says the season's mark on the realm's boss and its omen in the Deep (session 221)", () => {
    expect(t('help.combat.body')).toContain("season's mark");
    expect(t('help.expeditions.body')).toContain("the season's own");
  });
});
