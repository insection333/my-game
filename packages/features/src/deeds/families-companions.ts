// The companions' deeds (session 179): each companion joined, and companions gathered. A companion's deed
// opens it as an honour to show beside your picture. Its words say where it joins and the span it joins
// within, never the point itself, which is the save's own luck.
import { fmt, t } from '@idle-clash/content';
import { COMPANION_LEVELS, COMPANION_WINS, COMPANIONS } from '../shared/companions.ts';
import { COMPANIONS_GATHERED, deed, lower, type Deed } from './content.ts';

export function companionDeeds(): Deed[] {
  const each = COMPANIONS.map((c) =>
    deed({
      id: `companion-${c.id}`,
      family: 'companion',
      row: c.id,
      key: c.boss ? 'deed.companionBoss' : 'deed.companion',
      tier: 'hard',
      target: 1,
      shows: 'none',
      words: {
        companion: t(`honour.companion.${c.id}`),
        ...(c.boss
          ? { boss: lower(t(`boss.${c.boss}`)), to: fmt.int(COMPANION_WINS[1]) }
          : {
              skill: t(`skill.${c.skill}`),
              from: fmt.int(COMPANION_LEVELS[0]),
              to: fmt.int(COMPANION_LEVELS[1]),
            }),
      },
      mark: '',
      icon: `companion-${c.id}`,
      measure: (r) => r.companion(c.id),
    }),
  );
  const gathered = COMPANIONS_GATHERED.map(([count, tier]) =>
    deed({
      id: `companions-${count}`,
      family: 'companions',
      brief: true,
      tier,
      target: count,
      words: { count: fmt.int(count) },
      mark: fmt.int(count),
      measure: (r) => r.companions(),
    }),
  );
  return [...each, ...gathered];
}
