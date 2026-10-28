// Deeds and titles (step 15): every deed can be done, and done from the real game's content; each
// deed's text comes from its numbers; recording a deed gives its moment once, with the honours it
// unlocked; only unlocked honours can be shown.
import { fmt, XP_TABLE } from '@idle-clash/content';
import { LANE_IDS, newState, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { FEATURES } from '../src/index.ts';
import { POINTS, wordsOf } from '../src/deeds/content.ts';
import { HONOURS, shownHonours } from '../src/deeds/honours.ts';
import { allPoints, deedList, pending, pointsOf } from '../src/deeds/list.ts';
import { choose, refresh } from '../src/deeds/rules.ts';
import { deedsOf } from '../src/deeds/state.ts';
import { allFinds, skillActions } from '../src/shared/catalog.ts';
import { FOES } from '../src/shared/combat/data.ts';
import { capacity, ENLARGE_COSTS } from '../src/shared/storehouse.ts';
import { BOSSES, TWISTS } from '../src/shared/expeditions/data.ts';
import { relics } from '../src/shared/expeditions/relics.ts';
import { KINDLE_XP } from '../src/shared/kindling.ts';
import { allSkills } from '../src/shared/standing.ts';

const T0 = Date.UTC(2026, 9, 27, 10);
const HOUR = 3_600_000;
const items = FEATURES.flatMap((f) => f.content.items ?? []);

/** A player who has done everything there is: every skill at 99, every action mastered, every foe
 *  beaten thousands of times, every find, the best gear worn, the Storehouse full and the fire hot. */
function everything(): State {
  const s = newState(15, T0);
  // Every skill at 99 and five Kindlings past it.
  s.skills = Object.fromEntries(allSkills().map((k) => [k, { xp: XP_TABLE[99] + 5 * KINDLE_XP }]));
  for (const { feature, actions } of skillActions())
    for (const [i, a] of actions.entries()) s.mastery[`${feature}:${a.id}`] = i === 0 ? 300_000 : 28_800;
  for (const [i, f] of FOES.entries()) s.mastery[`combat:${f.id}`] = i === 0 ? 1_000_000 : 5_000;
  s.found = Object.fromEntries(allFinds().map((f) => [f.item, T0]));
  const best = (slot: string) => items.find((i) => i.gear?.tier === 8 && i.gear.slot === slot)!.id;
  const worn = { helm: best('helm'), body: best('body'), legs: best('legs'), weapon: best('weapon') };
  // Every boss beaten a hundred times, runs of every length home (250 in all), every twist met,
  // and every relic at its last rank.
  s.features = {
    combat: { worn, health: null, healthAt: 0, retreated: null },
    storehouse: { enlargements: ENLARGE_COSTS.length },
    expeditions: {
      marks: 0,
      relics: Object.fromEntries(relics().map((r) => [r.id, r.ranks])),
      drawn: 0,
      run: null,
      bossDay: {},
      wins: Object.fromEntries(BOSSES.map((b) => [b.id, 100])),
      runs: { '1': 100, '2': 80, '4': 50, '8': 20 },
      twists: TWISTS.map((x) => x.id),
    },
  };
  const held = items.filter((i) => i.id !== 'gold').slice(0, capacity(s));
  s.items = {
    ...Object.fromEntries(held.map((i) => [i.id, 1])),
    ...Object.fromEntries(Object.values(worn).map((id) => [id, 1])),
  };
  s.items[held[0].id] = 10_000;
  s.items.gold = 10_000_000;
  s.fireSince = T0 - 7 * HOUR;
  s.fireUntil = T0 + 5 * 60_000;
  for (const lane of LANE_IDS)
    s.lanes[lane].current = { action: { feature: 'woodcutting', id: 'pine' }, startedAt: T0, endsAt: T0 + 5000 };
  return s;
}

describe('deeds', () => {
  it('number about 280, from every skill, foe and find, each with its own id', () => {
    const list = deedList();
    expect(list.length).toBeGreaterThanOrEqual(250);
    expect(new Set(list.map((d) => d.id)).size).toBe(list.length);
    for (const skill of allSkills()) expect(list.some((d) => d.id === `level-${skill}-99`)).toBe(true);
    for (const foe of FOES) expect(list.some((d) => d.row === foe.id)).toBe(true);
    for (const f of allFinds().filter((x) => x.rarity === 'legendary'))
      expect(list.some((d) => d.icon === f.item)).toBe(true);
  });

  it('can every one be done: a player who has done everything has done every deed', () => {
    const s = everything();
    expect(pending(s, T0).map((d) => d.id)).toEqual(deedList().map((d) => d.id));
    const after = refresh(s, T0);
    expect(Object.keys(deedsOf(after.state).done)).toHaveLength(deedList().length);
    expect(pointsOf(after.state)).toBe(allPoints());
    // And so every honour is open to them.
    for (const h of HONOURS) expect(choose(after.state, h.kind, h.id).result).toEqual({ ok: true });
  });

  it('read their text from their numbers', () => {
    for (const d of deedList()) {
      const text = wordsOf(d, 'text');
      expect(text, d.id).not.toMatch(/[{}]/);
      // A count is never one, so no deed needs a singular ("Win 1 fights").
      if (d.shows === 'count') expect(d.target, d.id).toBeGreaterThan(1);
      if (d.shows === 'count') expect(text, d.id).toContain(fmt.int(d.target));
      if (d.shows === 'minutes') expect(text, d.id).toContain(fmt.duration(d.target * 60_000));
    }
  });

  it('give points by tier: easy 5, hard 15, elite 40, master 100', () => {
    expect(POINTS).toEqual({ easy: 5, hard: 15, elite: 40, master: 100 });
    // The last title by points is within reach of what the deeds give.
    const top = Math.max(...HONOURS.flatMap((h) => (h.unlock && 'points' in h.unlock ? [h.unlock.points] : [])));
    expect(top).toBeLessThan(allPoints());
  });

  it('are none done by a newcomer', () => {
    expect(pending(newState(1, T0), T0)).toEqual([]);
  });

  it('are recorded once, each with its moment and the honours it unlocked', () => {
    const s = newState(2, T0);
    s.skills.woodcutting = { xp: XP_TABLE[99] };
    const first = refresh(s, T0);
    const ids = first.events.map((e) => (e.type === 'deedDone' ? e.deed : ''));
    expect(ids).toEqual(expect.arrayContaining(['level-woodcutting-10', 'level-woodcutting-99']));
    const top = first.events.find((e) => e.type === 'deedDone' && e.deed === 'level-woodcutting-99');
    expect(top).toMatchObject({ name: 'Woodcutting 99', tier: 'master', points: 100 });
    expect(top && 'unlocks' in top ? top.unlocks : []).toEqual(expect.arrayContaining(['Forester', 'Dawn']));
    const again = refresh(first.state, T0 + 1000);
    expect(again.events).toEqual([]);
    expect(again.state).toBe(first.state);
  });

  it('show only the honours unlocked', () => {
    const s = newState(3, T0);
    expect(choose(s, 'title', 'forester').result).toEqual({ ok: false, reason: 'locked' });
    expect(choose(s, 'title', 'no-such-title').result).toEqual({ ok: false, reason: 'unknown' });
    expect(choose(s, 'banner', 'woad').result).toEqual({ ok: true });
    // A save that names a locked honour shows none (and the woad banner).
    s.features.deeds = { done: {}, title: 'forester', banner: 'dawn', frame: 'gold' };
    expect(shownHonours(s)).toEqual({ title: null, banner: 'woad', frame: null });
  });

  it('are all checked quickly, as the page asks on every draw', () => {
    const s = everything();
    const start = performance.now();
    for (let i = 0; i < 20; i++) pending(s, T0);
    expect((performance.now() - start) / 20).toBeLessThan(5);
  });
});
