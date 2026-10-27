// What deeds measure, read from the save once per look: levels, work done, mastery, foes defeated,
// finds, gear worn, the fire, gold and the Storehouse. Each reading is worked out at most once per
// Reader, so checking every deed costs about as much as checking one family.
import { masteryStep } from '@idle-clash/content';
import { countOf, LANE_IDS, type State } from '@idle-clash/kernel';
import { allFinds, itemOf, skillActions } from '../shared/catalog.ts';
import { FOES } from '../shared/combat/data.ts';
import { wornIn } from '../shared/combat/state.ts';
import { skillLevel } from '../shared/skill.ts';
import { allSkills } from '../shared/standing.ts';
import { capacity, slotsUsed } from '../shared/storehouse.ts';

const GEAR = ['helm', 'body', 'legs', 'weapon'] as const;

export class Reader {
  private memo = new Map<string, number>();
  readonly state: State;
  readonly now: number;
  constructor(state: State, now: number) {
    this.state = state;
    this.now = now;
  }

  private once(key: string, read: () => number): number {
    let n = this.memo.get(key);
    if (n === undefined) {
      n = read();
      this.memo.set(key, n);
    }
    return n;
  }

  private done = (key: string) => (Object.hasOwn(this.state.mastery, key) ? this.state.mastery[key] : 0);

  level = (skill: string) => this.once(`level:${skill}`, () => skillLevel(this.state, skill));
  total = () => this.once('total', () => allSkills().reduce((n, s) => n + this.level(s), 0));
  /** The lowest level among every skill; with `even`, that level only when every skill shares it. */
  lowest = () => this.once('lowest', () => Math.min(...allSkills().map((s) => this.level(s))));
  even = () => this.once('even', () => (allSkills().every((s) => this.level(s) === this.lowest()) ? this.lowest() : 0));

  /** Repetitions of a skill's actions, all told. */
  work = (skill: string) =>
    this.once(`work:${skill}`, () => {
      const s = skillActions().find((x) => x.skill === skill);
      return s ? s.actions.reduce((n, a) => n + this.done(`${s.feature}:${a.id}`), 0) : 0;
    });

  /** The best mastery step on any of a skill's actions ('combat': on any foe). */
  mastery = (row: string) =>
    this.once(`mastery:${row}`, () => {
      const s = skillActions().find((x) => x.skill === row);
      const keys =
        row === 'combat' ? FOES.map((f) => `combat:${f.id}`) : (s?.actions.map((a) => `${s.feature}:${a.id}`) ?? []);
      return Math.max(0, ...keys.map((k) => masteryStep(this.done(k))));
    });

  /** How many actions have reached a mastery step. */
  mastered = (step: number) =>
    this.once(`mastered:${step}`, () => Object.values(this.state.mastery).filter((n) => masteryStep(n) >= step).length);

  defeats = (foe: string) => this.done(`combat:${foe}`);
  allDefeats = () => this.once('defeats', () => FOES.reduce((n, f) => n + this.defeats(f.id), 0));
  /** How many of a region's foes have been beaten at least once. */
  beaten = (foes: readonly string[]) => foes.filter((f) => this.defeats(f) > 0).length;

  found = (item: string) => (Object.hasOwn(this.state.found, item) ? 1 : 0);
  logged = () => this.once('logged', () => allFinds().filter((f) => this.found(f.item)).length);
  loggedIn = (skill: string) =>
    this.once(`logged:${skill}`, () => allFinds().filter((f) => f.skill === skill && this.found(f.item)).length);

  /** The lowest tier worn across helm, body, legs and weapon (0 while a slot is empty). */
  gearTier = () =>
    this.once('gear', () =>
      Math.min(
        ...GEAR.map((slot) => {
          const id = wornIn(this.state, slot);
          return id ? (itemOf(id)?.gear?.tier ?? 0) : 0;
        }),
      ),
    );

  /** Minutes the fire has burned without going out, as of now (0 when it is out). */
  fireMinutes = () =>
    this.now < this.state.fireUntil ? Math.max(0, this.now - (this.state.fireSince ?? this.now)) / 60_000 : 0;

  gold = () => countOf(this.state, 'gold');
  capacity = () => capacity(this.state);
  /** The most of any one item held (gold aside). */
  hoard = () =>
    this.once('hoard', () =>
      Math.max(0, ...Object.entries(this.state.items).flatMap(([id, n]) => (id === 'gold' ? [] : [n]))),
    );
  storeFull = () => (slotsUsed(this.state) >= capacity(this.state) ? 1 : 0);
  lanesBusy = () => LANE_IDS.filter((l) => this.state.lanes[l].current !== null).length;
}
