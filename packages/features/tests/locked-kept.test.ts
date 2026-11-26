// Session 264: an item locked in the Storehouse says it is "kept from every sale" (session 241), yet the pedlar's
// Hand in and Hand in all took a locked lot for gold, and the realm's Give all gave the whole of a locked material.
import { XP_TABLE } from '@idle-clash/content';
import { newState, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import '../src/index.ts';
import { handIn, handInAll } from '../src/pedlar/rules.ts';
import { pedlarErrands, pedlarView } from '../src/pedlar/view.ts';
import { realmWorkIn } from '../src/shared/realm-work.ts';
import { give } from '../src/steading/realm-give.ts';
import { realmWorkView } from '../src/steading/realm-view.ts';

const T0 = Date.UTC(2026, 10, 24, 9);

function player(locked: string[]): State {
  const s = newState(7, T0);
  s.skills = { woodcutting: { xp: XP_TABLE[50] } };
  s.found = { 'birds-nest': T0 - 86_400_000 };
  s.mastery = { 'woodcutting:pine-tree': 5_000 };
  s.items = { 'birds-nest': 90, 'pine-logs': 1_000, 'oak-logs': 500 };
  s.features.storehouse = { enlargements: 0, locked };
  s.features['realm-work'] = {
    season: 1,
    work: realmWorkIn(1),
    needed: 40_000_000,
    given: 0,
    mine: 0,
    givers: 0,
    finished: 0,
    thanks: null,
  };
  return s;
}

describe('an item locked in the Storehouse', () => {
  it('is not handed to the pedlar, alone or with the rest, and its row says so', () => {
    const s = player(['birds-nest']);
    expect(handIn(s, 'find', T0).result).toEqual({ ok: false, reason: 'locked' });
    const all = handInAll(s, T0);
    expect(all.result).toEqual({ ok: true, count: 1 });
    expect(all.state.items['birds-nest']).toBe(90);
    const row = pedlarView(s, T0).lots.find((l) => l.kind === 'find')!;
    expect(row).toMatchObject({ ready: false, held: 'Locked in the Storehouse: kept' });
    expect(pedlarErrands(s, T0)[0].text).not.toContain("Bird's nest");
  });

  it("is not given to the realm's work, nor offered there", () => {
    const s = player(['oak-logs']);
    expect(give(s, { item: 'oak-logs' }, T0).result).toEqual({ ok: false, reason: 'locked' });
    const items = realmWorkView(s, T0)?.materials.map((m) => m.item);
    expect(items).not.toContain('oak-logs');
    expect(items).toContain('pine-logs');
  });
});
