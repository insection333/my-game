// Marks that keep their worth (session 191): every relic was fully raised about day 80 of the year's steady
// player, and marks then piled up with nothing to buy (27,866 by day 365), so the marks a bounty, the realm's
// boss, a boss's daily fight and every run pay were worth nothing for most of the year. Once every relic is
// raised, the quartermaster takes them for gold: 25 marks for an hour of the player's own earning (the gold
// the goals pay by), so they buy the castle's next level and keep their worth at every stage.
import { newState, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { expeditions } from '../src/expeditions/index.ts';
import { earning, nice, paces } from '../src/shared/pace.ts';
import { relics } from '../src/shared/expeditions/relics.ts';
import { expeditionsOf, setExpeditions } from '../src/shared/expeditions/state.ts';
import { fighterAt, T0 } from './helpers/expedition.ts';

const raised = (s: State, marks: number, all = true): State => {
  const out = structuredClone(s);
  const ranks = Object.fromEntries(relics().map((r, i) => [r.id, all || i > 0 ? r.ranks : r.ranks - 1]));
  setExpeditions(out, { ...expeditionsOf(out), marks, relics: ranks });
  return out;
};
const trade = (s: State, lots: number) =>
  expeditions.routes.trade.run(s, { lots }, T0) as {
    state: State;
    result: { ok: true; gold: number; marks: number } | { ok: false; reason: string };
  };
type View = { trade: { text: string; one: string; all: string | null } | null };
const view = (s: State) => expeditions.slots['combat.relics']({ state: s, now: T0 }) as unknown as View;

describe('the quartermaster', () => {
  it('takes 25 marks for an hour of the player’s earning, once every relic is raised', () => {
    const s = raised({ ...fighterAt('fen', 3), items: { ...fighterAt('fen', 3).items, gold: 0 } }, 60);
    const hour = nice(earning(paces(s)) * 3600);
    expect(hour).toBeGreaterThan(1000);
    const r = trade(s, 2);
    expect(r.result).toEqual({ ok: true, gold: 2 * hour, marks: 50 });
    expect(expeditionsOf(r.state).marks).toBe(10);
    expect(r.state.items.gold).toBe(2 * hour);
  });

  it('is shut while a relic can still be raised, and refuses more marks than are held', () => {
    expect(trade(raised(fighterAt('fen', 3), 300, false), 1).result).toEqual({ ok: false, reason: 'relics' });
    expect(view(raised(fighterAt('fen', 3), 300, false)).trade).toBeNull();
    expect(trade(raised(fighterAt('fen', 3), 30), 2).result).toEqual({ ok: false, reason: 'marks' });
  });

  it('says what a trade brings, and offers all the marks held at once', () => {
    const s = raised(fighterAt('fen', 3), 110);
    const hour = nice(earning(paces(s)) * 3600);
    const v = view(s).trade!;
    expect(v.one).toBe(`Trade 25 marks for ${hour.toLocaleString('en-GB')} gold`);
    expect(v.all).toBe(`Trade 100 marks for ${(4 * hour).toLocaleString('en-GB')} gold`);
    expect(view(raised(fighterAt('fen', 3), 30)).trade!.all).toBeNull();
    expect(view(raised(newState(1, T0), 30)).trade).not.toBeNull();
  });
});
