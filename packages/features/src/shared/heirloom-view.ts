// Heirlooms said (session 251): what each one's trait does, and on the gear sheet each one a slot takes, from
// Smithing 90 until it is held, with what forging it takes and what is short.
import { fmt, t, type GearSlot } from '@idle-clash/content';
import { countOf, type State } from '@idle-clash/kernel';
import { HEIRLOOM, heirloomCost, heirloomOf, HEIRLOOMS, type HeirloomTrait } from './heirlooms.ts';
import { skillLevel } from './skill.ts';

const TRAIT: Record<HeirloomTrait, string> = {
  standfast: 'heirloom.trait.standfast',
  fury: 'heirloom.trait.fury',
  mire: 'heirloom.trait.mire',
  tide: 'heirloom.trait.tide',
  gale: 'heirloom.trait.gale',
  ember: 'heirloom.trait.ember',
};

/** Each trait's figure, in percent, for the words that say one (the tide's says none). */
const PCT: Record<HeirloomTrait, number | null> = {
  standfast: (1 - HEIRLOOM.STANDFAST_TAKEN) * 100,
  fury: (HEIRLOOM.FURY_DEALT - 1) * 100,
  mire: HEIRLOOM.MIRE_HEALS * 100,
  tide: null,
  gale: HEIRLOOM.GALE_CHANCE * 100,
  ember: (HEIRLOOM.EMBER_CRIT - 1) * 100,
};

/** An heirloom's trait in words ("Below three quarters of your health, hits on you land 20% lighter"). */
export function heirloomWords(item: string): string | null {
  const h = heirloomOf(item);
  if (!h) return null;
  const pct = PCT[h.trait];
  return pct === null ? t(TRAIT[h.trait]) : t(TRAIT[h.trait], { pct: fmt.pct(Math.round(pct)) });
}

export interface HeirloomRow {
  item: string;
  name: string;
  /** Its trait in words. */
  does: string;
  /** "Barrow ring ×10, Wight-king's sceptre ×1" with what is held. */
  cost: string;
  short: string | null;
  ready: boolean;
}

/** The heirlooms a slot takes, from Smithing 90, while not held: what each does and takes. */
export function heirloomRows(state: State, slot: GearSlot): HeirloomRow[] {
  if (skillLevel(state, 'smithing') < HEIRLOOM.OPENS) return [];
  return HEIRLOOMS.filter((h) => h.slot === slot && countOf(state, h.item) === 0).map((h) => {
    const cost = heirloomCost(h);
    const lacking = cost.filter((c) => countOf(state, c.item) < c.count);
    return {
      item: h.item,
      name: t(`item.${h.item}`),
      does: heirloomWords(h.item)!,
      cost: t('heirloom.takes', {
        items: cost
          .map((c) =>
            t('heirloom.part', {
              item: t(`item.${c.item}`),
              count: fmt.int(c.count),
              held: fmt.int(countOf(state, c.item)),
            }),
          )
          .join(', '),
      }),
      short: lacking.length ? t('heirloom.short', { items: lacking.map((c) => t(`item.${c.item}`)).join(', ') }) : null,
      ready: lacking.length === 0,
    };
  });
}

/** An heirloom forged, in words (session 251): its name, and what it does. */
export function heirloomForgedWords(item: string): { title: string; body: string } {
  return { title: t('heirloom.forged', { item: t(`item.${item}`) }), body: heirloomWords(item) ?? '' };
}
