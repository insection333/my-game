// The deeds of skills, crafts and combat (content.ts has their numbers): a level ladder for every
// skill, the ranks, work done and mastery in every skill with actions, every foe, region and tier of
// gear.
import { fmt, t } from '@idle-clash/content';
import { itemOf, skillActions } from '../shared/catalog.ts';
import { FOES, REGIONS, regionOf } from '../shared/combat/data.ts';
import { allSkills, RANKS } from '../shared/standing.ts';
import {
  deed,
  DEFEATS,
  FOE_COUNTS,
  GEAR_TIERS,
  LEVELS,
  lower,
  MASTERED,
  MASTERY,
  RANK_TIERS,
  REGION_TIERS,
  skillName,
  WORK,
  type Deed,
} from './content.ts';

export function skills(): Deed[] {
  const levels = allSkills().flatMap((skill) =>
    LEVELS.map(([level, tier]) =>
      deed({
        id: `level-${skill}-${level}`,
        family: 'level',
        row: skill,
        tier,
        target: level,
        words: { skill: skillName(skill), level: fmt.int(level) },
        mark: fmt.int(level),
        measure: (r) => r.level(skill),
      }),
    ),
  );
  const ranks = RANKS.slice(1).map((rank, i) =>
    deed({
      id: `rank-${rank.id}`,
      family: 'rank',
      tier: RANK_TIERS[i],
      target: rank.total,
      words: { rank: t(`rank.${rank.id}`), level: fmt.int(rank.total) },
      mark: fmt.int(rank.total),
      measure: (r) => r.total(),
    }),
  );
  return [...levels, ...ranks];
}

export function craft(): Deed[] {
  const work = skillActions().flatMap(({ skill }) =>
    WORK.map(([count, tier], i) =>
      deed({
        id: `work-${skill}-${count}`,
        family: 'work',
        key: `deed.work.${skill}`,
        row: skill,
        tier,
        target: count,
        words: { count: fmt.int(count), roman: fmt.roman(i + 1) },
        mark: fmt.compact(count),
        measure: (r) => r.work(skill),
      }),
    ),
  );
  const rows = [...skillActions().map((s) => s.skill), 'combat'];
  const mastery = rows.flatMap((row) =>
    MASTERY.map(([step, tier], i) =>
      deed({
        id: `mastery-${row}-${step}`,
        family: 'mastery',
        row,
        tier,
        target: step,
        words: {
          row: row === 'combat' ? t('deeds.row.combat') : skillName(row),
          of: row === 'combat' ? t('deed.mastery.ofFoe') : t('deed.mastery.of', { skill: skillName(row) }),
          step: fmt.int(step),
          roman: fmt.roman(i + 1),
        },
        mark: fmt.int(step),
        measure: (r) => r.mastery(row),
      }),
    ),
  );
  const mastered = MASTERED.map(([count, tier], i) =>
    deed({
      id: `masters-${count}`,
      family: 'masters',
      tier,
      target: count,
      words: { count: fmt.int(count), step: fmt.int(10), roman: fmt.roman(i + 1) },
      mark: fmt.int(count),
      measure: (r) => r.mastered(10),
    }),
  );
  return [...work, ...mastery, ...mastered];
}

export function combat(): Deed[] {
  const foes = FOES.flatMap((foe) =>
    FOE_COUNTS.map(([count, tier], i) =>
      deed({
        id: `foe-${foe.id}-${count}`,
        family: 'foe',
        row: foe.id,
        tier,
        target: count,
        words: {
          foe: t(`action.combat.${foe.id}`),
          foeLower: lower(t(`action.combat.${foe.id}`)),
          count: fmt.int(count),
          roman: fmt.roman(i + 1),
        },
        mark: fmt.compact(count),
        measure: (r) => r.defeats(foe.id),
      }),
    ),
  );
  const regions = REGIONS.map((region, i) => {
    const ids = FOES.filter((f) => regionOf(f.tier) === region).map((f) => f.id);
    const name = t(`combat.region.${region}`);
    return deed({
      id: `region-${region}`,
      family: 'region',
      tier: REGION_TIERS[i],
      target: ids.length,
      words: { region: name, regionLower: lower(name), count: fmt.int(ids.length) },
      mark: t(`combat.region.${region}.short`),
      measure: (r) => r.beaten(ids),
    });
  });
  const defeats = DEFEATS.map(([count, tier], i) =>
    deed({
      id: `defeats-${count}`,
      family: 'defeats',
      tier,
      target: count,
      words: { count: fmt.int(count), roman: fmt.roman(i + 1) },
      mark: fmt.compact(count),
      measure: (r) => r.allDefeats(),
    }),
  );
  const gear = GEAR_TIERS.map((tier, i) =>
    deed({
      id: `gear-${i + 1}`,
      family: 'gear',
      tier,
      target: i + 1,
      words: { metal: t(`tier.metal.${i + 1}`) },
      mark: fmt.int(i + 1),
      icon: helmOf(i + 1),
      shows: 'none',
      measure: (r) => r.gearTier(),
    }),
  );
  return [...foes, ...regions, ...defeats, ...gear];
}

/** A tier's helm, to stand for its whole set. */
const helmOf = (tier: number): string | null => allGear().find((g) => g.tier === tier && g.slot === 'helm')?.id ?? null;
const allGear = () =>
  skillActions()
    .flatMap((s) => s.actions.flatMap((a) => a.gives ?? []))
    .flatMap(({ item }) => {
      const gear = itemOf(item)?.gear;
      return gear ? [{ id: item, tier: gear.tier, slot: gear.slot }] : [];
    });
