// Castle Clash's names and moments in words, shared by the page and the server: a mercenary stronghold's
// name, an outcome, a fortress, and the line each castle event makes in the notices tray and its moment.
// Every key is written out, so the content check sees each one used.
import { fmt, MERCENARY_NAMES, t } from '@idle-clash/content';
import type { EventOf, GameEvent } from '@idle-clash/kernel';

const read = (map: Record<string, string>) => (id: string | null | undefined) =>
  id && Object.hasOwn(map, id) ? t(map[id]) : '';

const mercFirst = read({
  grey: 'castle.merc.first.grey',
  red: 'castle.merc.first.red',
  hollow: 'castle.merc.first.hollow',
  broken: 'castle.merc.first.broken',
  iron: 'castle.merc.first.iron',
  black: 'castle.merc.first.black',
  thorn: 'castle.merc.first.thorn',
  salt: 'castle.merc.first.salt',
});
const mercSecond = read({
  banner: 'castle.merc.second.banner',
  hand: 'castle.merc.second.hand',
  company: 'castle.merc.second.company',
  oath: 'castle.merc.second.oath',
  fang: 'castle.merc.second.fang',
  wolves: 'castle.merc.second.wolves',
  lances: 'castle.merc.second.lances',
  crows: 'castle.merc.second.crows',
});

/** A stronghold's name from its two parts ("The Grey Fang"). */
export const mercName = (first: number, second: number): string =>
  t('castle.merc.name', {
    first: mercFirst(MERCENARY_NAMES.first[first]),
    second: mercSecond(MERCENARY_NAMES.second[second]),
  });

export const outcomeName = read({
  repelled: 'castle.outcome.repelled',
  graze: 'castle.outcome.graze',
  decisive: 'castle.outcome.decisive',
});

export const fortressName = read({
  'ashen-redoubt': 'castle.fortress.ashen-redoubt',
  'citadel-of-the-blind-wyrm': 'castle.fortress.citadel-of-the-blind-wyrm',
  'sunken-reliquary': 'castle.fortress.sunken-reliquary',
  'thornwall-keep': 'castle.fortress.thornwall-keep',
  'gloaming-spire': 'castle.fortress.gloaming-spire',
  'hollow-crown-hold': 'castle.fortress.hollow-crown-hold',
});

type CastleEvent = EventOf<'castleSiege' | 'castleBesieged' | 'castleSpyCaught' | 'castleIncursion' | 'castleTempered'>;
export const isCastleEvent = (e: GameEvent): e is CastleEvent =>
  e.type === 'castleSiege' ||
  e.type === 'castleBesieged' ||
  e.type === 'castleSpyCaught' ||
  e.type === 'castleIncursion' ||
  e.type === 'castleTempered';

export const relicName = read({
  'banner-of-the-first-king': 'castle.relic.banner-of-the-first-king',
  'aegis-shard': 'castle.relic.aegis-shard',
  'wyrmglass-lens': 'castle.relic.wyrmglass-lens',
  'sentinels-eye': 'castle.relic.sentinels-eye',
  'oathbound-horn': 'castle.relic.oathbound-horn',
  'gilded-ledger': 'castle.relic.gilded-ledger',
  'ember-of-sieges': 'castle.relic.ember-of-sieges',
  'menders-mortar': 'castle.relic.menders-mortar',
  'tidings-stone': 'castle.relic.tidings-stone',
});

/** A line that may begin with a name: its first letter made a capital ("a lord no longer…" opening it). */
export const sentence = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

const marksText = (marks: number) => (marks > 0 ? [t('castle.report.marks', { marks: fmt.int(marks) })] : []);
const goldText = (gold: number) => (gold > 0 ? [t('castle.report.gold', { gold: fmt.short(gold) })] : []);

/** A castle event in words: its title, what it moved, where to read more, and how loud its moment is. */
export function castleMoment(e: CastleEvent): {
  title: string;
  body: string | null;
  href: string;
  size: 'centre' | 'banner' | 'toast';
} {
  const foe = 'foe' in e ? e.foe || t('castle.departed') : '';
  const join = (parts: string[]) => (parts.length ? parts.join(', ') : null);
  switch (e.type) {
    case 'castleSiege':
      return {
        title: sentence(t('castle.report.siegeOut', { outcome: outcomeName(e.outcome), foe })),
        body: join([...goldText(e.gold), ...marksText(e.marks)]),
        href: '/castle/war-room',
        size: e.outcome === 'decisive' ? 'banner' : 'toast',
      };
    case 'castleBesieged':
      return {
        title: sentence(t('castle.report.siegeIn', { foe, outcome: outcomeName(e.outcome) })),
        body: join([
          ...(e.lost > 0 ? [t('castle.report.lost', { gold: fmt.short(e.lost) })] : []),
          ...marksText(e.marks),
        ]),
        href: '/castle/war-room',
        size: e.lost > 0 ? 'banner' : 'toast',
      };
    case 'castleSpyCaught':
      return {
        title: sentence(t('castle.report.spyIn', { foe })),
        body: join(marksText(e.marks)),
        href: '/castle/war-room',
        size: 'toast',
      };
    case 'castleIncursion':
      return {
        title: t('castle.report.incursion', { fortress: fortressName(e.fortress), tier: fmt.int(e.tier) }),
        body: join([
          e.won ? t('castle.report.won') : t('castle.report.lostIncursion'),
          ...(e.spoils === 'hoard'
            ? [t('castle.spoils.hoard')]
            : e.spoils === 'armoury'
              ? [t('castle.spoils.armoury')]
              : []),
          ...marksText(e.marks),
        ]),
        href: '/castle/incursions',
        // A hoard takes the centre of the screen, as a Legendary find does; the armoury a banner.
        size: e.spoils === 'hoard' ? 'centre' : e.won ? 'banner' : 'toast',
      };
    case 'castleTempered':
      return {
        title: t(e.masterstroke ? 'castle.temper.masterstroke' : 'castle.temper.done', {
          relic: relicName(e.relic),
          tempers: fmt.int(e.tempers),
        }),
        body: null,
        href: '/castle/halls',
        size: e.masterstroke ? 'centre' : 'banner',
      };
  }
}
