// The away recap (IA.md, the Hearth's Today): what happened while the player was away, as lines the
// page lists best first: Legendary finds, new entries in the collection log, levels, Rare finds,
// mastery steps, Uncommon finds, then what the lanes brought in, then what the player's castle met
// (session 66), then any lane that stopped and why, with where to act. The simulation reads the same lines.
import { fmt, formatStop, isQuietStop, t } from '@idle-clash/content';
import type { AwaySummary, GameEvent } from '@idle-clash/kernel';
import { itemOf } from './catalog.ts';
import { storyOf } from './expeditions/story.ts';
import {
  actionIcon,
  kindledLine,
  lower,
  noticeLine,
  RECAP_ORDER,
  skillHref,
  stopHref,
  stopIcon,
  type RecapKind,
  type RecapLine,
} from './recap-words.ts';

export { noticeLine, RECAP_ORDER, type RecapKind, type RecapLine };

/** What happened to the player on the server while away, said in its notices rather than by the advance:
 *  a siege or a caught spy against their castle (kind `defence`), and a climb on the ladders, which the
 *  server says as the read that opens the page records it (so a little after the time away ends). */
function fromNotices(a: AwaySummary, notices: readonly GameEvent[]): RecapLine[] {
  const lines: RecapLine[] = [];
  for (const e of [...notices].sort((x, y) => x.at - y.at)) {
    if (e.at <= a.from || e.at > a.to + 60_000) continue;
    const line = noticeLine(e);
    if (e.type === 'castleBesieged' || e.type === 'castleSpyCaught') lines.push({ ...line!, kind: 'defence' });
    else if (e.type === 'rankUp' && line) lines.push(line);
  }
  return lines.map(({ kind, text, icon, href }) => ({ kind, text, icon, href }));
}

/** Every line of the recap, best first, with what the server's notices say happened meanwhile. Lines
 *  other than the castle's defences and lane stops are the good things. */
export function recapLines(a: AwaySummary, notices: readonly GameEvent[] = []): RecapLine[] {
  const lines: RecapLine[] = fromNotices(a, notices);
  const finds = a.events.filter((e) => e.type === 'find');
  for (const e of finds) {
    const text = t('moment.find', { rarity: t(`rarity.${e.rarity}`), item: t(`item.${e.item}`) });
    if (e.rarity === 'legendary') lines.push({ kind: 'legendary', text, icon: e.item, href: '/storehouse/log' });
    // New to the log: said so, since a first Uncommon find comes before a Rare one seen before.
    else if (e.first)
      lines.push({
        kind: 'newFind',
        text: t('recap.newFind', { item: t(`item.${e.item}`), rarity: t(`rarity.${e.rarity}`) }),
        icon: e.item,
        href: '/storehouse/log',
      });
  }
  // Rare finds the log already holds, one line an item: "Rare find: Torn banner ×4".
  const rares = new Map<string, number>();
  for (const e of finds) if (e.rarity === 'rare' && !e.first) rares.set(e.item, (rares.get(e.item) ?? 0) + 1);
  for (const [item, count] of rares) {
    const text = t('moment.find', { rarity: t('rarity.rare'), item: t(`item.${item}`) });
    lines.push({
      kind: 'rare',
      text: count > 1 ? t('recap.times', { what: text, count: fmt.int(count) }) : text,
      icon: item,
      href: '/storehouse/log',
    });
  }
  // Levels, one line a skill: "Mining reached level 14".
  const levels = new Map<string, number>();
  for (const e of a.events) if (e.type === 'levelUp') levels.set(e.skill, Math.max(levels.get(e.skill) ?? 0, e.level));
  for (const [skill, level] of levels)
    lines.push({
      kind: 'level',
      text: t('recap.level', { skill: t(`skill.${skill}`), level: fmt.int(level) }),
      icon: skill,
      href: `/skills/${skill}`,
    });
  // Kindlings, one line a skill: the latest.
  const kindled = new Map<string, number>();
  for (const e of a.events)
    if (e.type === 'kindled') kindled.set(e.skill, Math.max(kindled.get(e.skill) ?? 0, e.count));
  for (const [skill, count] of kindled) lines.push(kindledLine(skill, count));
  // Each run that came home, its story.
  for (const e of a.events)
    if (e.type === 'expeditionDone') {
      const story = storyOf(e);
      lines.push({
        kind: 'expedition',
        text: `${story.title}. ${story.body}`,
        icon: e.region,
        href: '/combat/expeditions',
      });
    }
  // Each boss fought alone in the lane (session 72).
  for (const e of a.events)
    if (e.type === 'bossFought') {
      const line = noticeLine(e)!;
      lines.push({ kind: line.kind, text: line.text, icon: line.icon, href: line.href });
    }
  // Mastery, one line an action: the step it reached.
  const steps = new Map<string, Extract<GameEvent, { type: 'masteryStep' }>>();
  for (const e of a.events) if (e.type === 'masteryStep') steps.set(`${e.action.feature}:${e.action.id}`, e);
  for (const e of steps.values())
    lines.push({
      kind: 'mastery',
      text: t('moment.masteryStep', { action: t(`action.${e.action.feature}.${e.action.id}`), step: fmt.int(e.step) }),
      icon: actionIcon(e.action),
      href: skillHref(e.action.feature),
    });
  // Uncommon finds the log already holds, counted, then named by the three found most (session 107: the line
  // stood on a bare dot and named none).
  if (a.uncommon) {
    const most = Object.entries(a.uncommonItems ?? {})
      .sort((x, y) => y[1] - x[1])
      .slice(0, 3);
    const count = a.uncommon === 1 ? t('recap.uncommonOne') : t('recap.uncommon', { count: fmt.int(a.uncommon) });
    lines.push({
      kind: 'uncommon',
      text: most.length
        ? t('recap.uncommonNamed', {
            count,
            items: most.map(([id, n]) => t('action.gives', { item: t(`item.${id}`), count: fmt.int(n) })).join(', '),
          })
        : count,
      icon: most[0]?.[0] ?? null,
      href: '/storehouse/log',
    });
  }
  // What the lanes brought in: gold first, then the three items worth most.
  const gained = Object.entries(a.items).filter(([, n]) => n > 0);
  const worth = ([id, n]: [string, number]) => (id === 'gold' ? Infinity : n * (itemOf(id)?.value ?? 0));
  const top = gained.sort((x, y) => worth(y) - worth(x)).slice(0, 3);
  if (top.length)
    lines.push({
      kind: 'items',
      text: top
        .map(([id, n]) =>
          id === 'gold'
            ? t('recap.gold', { count: fmt.int(n) })
            : t('recap.item', { count: fmt.int(n), item: lower(t(`item.${id}`)) }),
        )
        .join(', '),
      icon: top.find(([id]) => id !== 'gold')?.[0] ?? null,
      href: '/storehouse',
    });
  const xp = Object.values(a.xp).reduce((n, x) => n + x, 0);
  const skills = Object.keys(a.xp).length;
  if (xp > 0) {
    const [only] = Object.keys(a.xp);
    const text =
      skills === 1
        ? t('recap.xpOne', { xp: fmt.int(xp), skill: t(`skill.${only}`) })
        : t('recap.xp', { xp: fmt.int(xp), skills: fmt.int(skills) });
    // Pictured by the seal of the skill that earned most (session 68).
    const most = Object.entries(a.xp).sort(([, x], [, y]) => y - x)[0][0];
    lines.push({ kind: 'xp', text, icon: most, href: '/skills' });
  }
  for (const e of a.events)
    if (e.type === 'laneStopped' && !isQuietStop(e.reason.code))
      lines.push({
        kind: 'stopped',
        text: t('moment.laneStopped', { lane: t(`lane.${e.lane}`), reason: lower(formatStop(e.reason)) }),
        icon: stopIcon(e),
        href: stopHref(e),
      });
  return lines.sort((x, y) => RECAP_ORDER.indexOf(x.kind) - RECAP_ORDER.indexOf(y.kind));
}

/** The good things in a recap: every line but the castle's defences and the lane stops, which need the
 *  player and are always shown. */
export const goodThings = (lines: readonly RecapLine[]) =>
  lines.filter((l) => l.kind !== 'stopped' && l.kind !== 'defence');
