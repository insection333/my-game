// What lifts a skill's XP, in words (session 194): the whole lift and each source by name, from the parts
// the engine sums ("XP +45%: the fire +15%, Heartwood charm +5%, The Greenwood +20%"), so a relic raised on
// Combat or a Shrine built on the Hearth is seen on the skill's page, where only the edict and the season were.
import { fmt, t, type Find } from '@idle-clash/content';
import type { State } from '@idle-clash/kernel';
import { xpParts, type XpPart } from './complete.ts';

const pct = (n: number) => fmt.pct(Math.round(n * 10) / 10);

function nameOf(p: XpPart, skill: string): string {
  switch (p.source) {
    case 'fire':
      return t('gains.fire');
    case 'marks':
      return t('gains.marks');
    case 'relic':
      return t(`relic.relic-${skill}`);
    case 'steading':
      return t('work.shrine');
    case 'edict':
      return t(`castle.edict.${p.id}`);
    case 'path':
      return t('gains.path', { path: t(`kindling.path.${p.id}`) });
    case 'season':
      return t(`season.name.${p.id}`);
    case 'feast':
      return t(`item.${p.id}`);
  }
}

/** The lift in words, or null when nothing lifts the skill's XP. */
export function xpGainsWords(
  state: State,
  skill: string,
  finds: readonly Pick<Find, 'item' | 'rarity'>[],
  at: number,
): string | null {
  const parts = xpParts(state, skill, finds, at);
  if (!parts.length) return null;
  return t('gains.xp', {
    total: pct(parts.reduce((n, p) => n + p.pct, 0)),
    parts: parts.map((p) => t('gains.part', { name: nameOf(p, skill), pct: pct(p.pct) })).join(', '),
  });
}
