// The deeds of finds and of home (content.ts has their numbers): each Legendary find, each skill's
// page of the log and the log's totals; the fire kept burning, gold held, the Storehouse enlarged;
// and a few hidden deeds, whose words stay unread until they are done.
import { fmt, t } from '@idle-clash/content';
import { allFinds } from '../shared/catalog.ts';
import { SLOTS_PER_ENLARGEMENT, START_SLOTS } from '../shared/storehouse.ts';
import { COLLECTOR, deed, FIRE, GOLD, HIDDEN, lower, skillName, STORE, type Deed } from './content.ts';

export function finds(): Deed[] {
  const all = allFinds();
  const legendary = all
    .filter((f) => f.rarity === 'legendary')
    .map((f) =>
      deed({
        id: `legendary-${f.item}`,
        family: 'legendary',
        tier: 'elite',
        target: 1,
        words: { item: t(`item.${f.item}`), itemLower: lower(t(`item.${f.item}`)), skill: skillName(f.skill) },
        mark: '',
        icon: f.item,
        shows: 'none',
        measure: (r) => r.found(f.item),
      }),
    );
  const skills = [...new Set(all.map((f) => f.skill))];
  const pages = skills.map((skill) => {
    const count = all.filter((f) => f.skill === skill).length;
    return deed({
      id: `log-${skill}`,
      family: 'log',
      tier: 'hard',
      target: count,
      words: { skill: skillName(skill), count: fmt.int(count) },
      mark: '',
      icon: skill,
      measure: (r) => r.loggedIn(skill),
    });
  });
  // The log's totals climb to every find there is, whatever the content holds.
  const totals = [...COLLECTOR.filter(([n]) => n < all.length), [all.length, 'master'] as const].map(
    ([count, tier], i) =>
      deed({
        id: i === COLLECTOR.length ? 'collector-all' : `collector-${count}`,
        family: 'collector',
        tier,
        target: count,
        words: { count: fmt.int(count), roman: fmt.roman(i + 1) },
        mark: fmt.int(count),
        measure: (r) => r.logged(),
      }),
  );
  return [...legendary, ...pages, ...totals];
}

export function home(): Deed[] {
  const fire = FIRE.map(([minutes, tier], i) =>
    deed({
      id: `fire-${minutes}`,
      family: 'fire',
      tier,
      target: minutes,
      words: { time: fmt.duration(minutes * 60_000), roman: fmt.roman(i + 1) },
      mark: fmt.duration(minutes * 60_000),
      shows: 'minutes',
      measure: (r) => r.fireMinutes(),
    }),
  );
  const gold = GOLD.map(([amount, tier], i) =>
    deed({
      id: `gold-${amount}`,
      family: 'gold',
      tier,
      target: amount,
      words: { amount: fmt.int(amount), roman: fmt.roman(i + 1) },
      mark: fmt.compact(amount),
      measure: (r) => r.gold(),
    }),
  );
  // The Storehouse's spaces after each count of enlargements.
  const store = STORE.map(([n, tier], i) => {
    const slots = START_SLOTS + n * SLOTS_PER_ENLARGEMENT;
    return deed({
      id: `store-${n}`,
      family: 'store',
      tier,
      target: slots,
      words: { slots: fmt.int(slots), roman: fmt.roman(i + 1) },
      mark: fmt.int(slots),
      measure: (r) => r.capacity(),
    });
  });
  return [...fire, ...gold, ...store, ...hidden()];
}

function hidden(): Deed[] {
  const secret = (id: string, d: Omit<Parameters<typeof deed>[0], 'id' | 'family' | 'key' | 'hidden' | 'mark'>) =>
    deed({ id: `hidden-${id}`, family: 'hidden', key: `deed.hidden.${id}`, hidden: true, mark: '', ...d });
  return [
    secret('all-hands', { tier: 'easy', target: 4, words: {}, shows: 'none', measure: (r) => r.lanesBusy() }),
    secret('full-house', { tier: 'easy', target: 1, words: {}, shows: 'none', measure: (r) => r.storeFull() }),
    secret('hoarder', {
      tier: 'hard',
      target: HIDDEN.hoard,
      words: { count: fmt.int(HIDDEN.hoard) },
      measure: (r) => r.hoard(),
    }),
    secret('jack', {
      tier: 'hard',
      target: HIDDEN.jack,
      words: { level: fmt.int(HIDDEN.jack) },
      measure: (r) => r.lowest(),
    }),
    secret('even', {
      tier: 'elite',
      target: HIDDEN.even,
      words: { level: fmt.int(HIDDEN.even) },
      shows: 'none',
      measure: (r) => r.even(),
    }),
  ].map((d, i) => ({ ...d, mark: fmt.roman(i + 1) }));
}
