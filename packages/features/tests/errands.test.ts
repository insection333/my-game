// The day's fights on the Hearth (session 188): the realm's boss needs every player's strike, yet it stood
// only on the Expeditions tab, under the Combat page's first, so a player who never opened it never struck,
// and the realm's week might never fall; a bounty done, a share owed and a boss ready waited unseen in the
// same way. Each is now a row of the Hearth's Next up while it waits, and goes once done or under way.
import { t } from '@idle-clash/content';
import { HOUR, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { combat } from '../src/combat/index.ts';
import { expeditions } from '../src/expeditions/index.ts';
import { realmBossIn, weekOf, type RealmMirror } from '../src/shared/realm.ts';
import { bountyOf, setBounty } from '../src/shared/bounty.ts';
import { expeditionsOf, setExpeditions } from '../src/shared/expeditions/state.ts';
import { fighterAt, T0 } from './helpers/expedition.ts';

type Row = { icon: string; text: string; href: string; order: number };
const mirror = (over: Partial<RealmMirror> = {}): RealmMirror => ({
  week: weekOf(T0),
  needed: 24,
  strikes: 5,
  mine: 0,
  fell: false,
  owed: null,
  ...over,
});
const told = (s: State, over: Partial<RealmMirror> = {}): State => ({
  ...s,
  features: { ...s.features, realm: mirror(over) },
});
const errands = (s: State, at = T0): Row[] => [
  ...((expeditions.slots['hearth.errands']({ state: s, now: at }) ?? []) as Row[]),
  ...((combat.slots['hearth.errands']({ state: s, now: at }) ?? []) as Row[]),
];
// The boss's name bare ("Ember Wyrm"), so the words are checked whole: "the realm's The realm's" was written.
const bare = t(`boss.${realmBossIn(weekOf(T0)).id}`).replace(/^The\s+/, '');

describe("the day's fights on the Hearth", () => {
  it("asks for the realm's strike until it is struck, or under way", () => {
    const s = told(fighterAt('fen', 3));
    const realm = errands(s).find((r) => r.text === `Strike the realm's ${bare} today`);
    expect(realm).toMatchObject({ href: '/combat/expeditions', icon: realmBossIn(weekOf(T0)).id });
    const struck = structuredClone(s);
    setExpeditions(struck, {
      ...expeditionsOf(s),
      realm: { day: new Date(T0).toISOString().slice(0, 10), claimed: null, fallen: 0 },
    });
    expect(errands(struck).some((r) => r.text.startsWith('Strike'))).toBe(false);
    const fighting: State = {
      ...s,
      lanes: {
        ...s.lanes,
        combat: {
          ...s.lanes.combat,
          current: { action: { feature: 'expeditions', id: 'realm' }, startedAt: T0, endsAt: T0 + HOUR },
        },
      },
    };
    expect(errands(fighting).some((r) => r.text.startsWith('Strike'))).toBe(false);
    expect(errands(told(fighterAt('fen', 3), { fell: true })).some((r) => r.text.startsWith('Strike'))).toBe(false);
  });

  it('puts a share owed first', () => {
    const boss = realmBossIn(weekOf(T0)).id;
    const rows = errands(told(fighterAt('fen', 3), { fell: true, owed: { week: weekOf(T0), boss } }));
    const first = [...rows].sort((a, b) => a.order - b.order)[0];
    expect(first.text).toBe(`The realm's ${bare} fell with your strike: take your share`);
  });

  it('counts the bosses that can be fought today, and the bounties on offer', () => {
    const s = told(fighterAt('peaks', 3));
    const rows = errands(s);
    expect(
      rows.find((r) => /bosses? can be fought today$/.test(r.text) || / can be fought today$/.test(r.text))?.href,
    ).toBe('/combat/expeditions');
    expect(rows.find((r) => r.text === '3 bounties on offer')?.href).toBe('/combat');
  });

  it('says a bounty done, and nothing of one under way', () => {
    const s = told(fighterAt('fen', 3));
    const offer = (combat.slots['combat.bounty']({ state: s, now: T0 }) as { offers: { foe: string }[] }).offers[0];
    const took = combat.routes.bounty.run(s, { foe: offer.foe }, T0) as { state: State };
    expect(errands(took.state).some((r) => r.text.includes('bount'))).toBe(false);
    const b = bountyOf(took.state);
    const done = structuredClone(took.state);
    setBounty(done, { ...b, taken: { ...b.taken!, won: b.taken!.count } });
    expect(errands(done).find((r) => r.text.endsWith('is done: claim it'))).toMatchObject({
      href: '/combat',
      order: 1,
    });
  });
});
