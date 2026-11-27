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
 *  a siege or a caught spy against their castle (kind `defence`), the realm's boss fallen with their strike,
 *  and a climb on the ladders, which the server says as the read that opens the page records it (so a
 *  little after the time away ends). */
// A friend's cheer or gift while away (session 256: only the bell said, and a gift waited unseen).
const FROM_NOTICES: readonly GameEvent['type'][] = ['rankUp', 'realmFell', 'realmWorkStage', 'cheered', 'giftCame'];

function fromNotices(a: AwaySummary, notices: readonly GameEvent[]): RecapLine[] {
  const lines: RecapLine[] = [];
  for (const e of [...notices].sort((x, y) => x.at - y.at)) {
    if (e.at <= a.from || e.at > a.to + 60_000) continue;
    const line = noticeLine(e);
    if (!line) continue;
    if (e.type === 'castleBesieged' || e.type === 'castleSpyCaught') lines.push({ ...line, kind: 'defence' });
    // The realm's boss fell with this player's strike while they were away (session 190: only the bell said).
    else if (FROM_NOTICES.includes(e.type)) lines.push(line);
  }
  return lines.map(({ kind, text, icon, href }) => ({ kind, text, icon, href }));
}

/** Every line of the recap, best first, with what the server's notices say happened meanwhile. Lines
 *  other than the castle's defences and lane stops are the good things. */
export function recapLines(a: AwaySummary, notices: readonly GameEvent[] = []): RecapLine[] {
  const lines: RecapLine[] = fromNotices(a, notices);
  const finds = a.events.filter((e) => e.type === 'find');
  for (const e of finds)
    if (e.rarity === 'legendary')
      lines.push({
        kind: 'legendary',
        text: t('moment.find', { rarity: t('rarity.legendary'), item: t(`item.${e.item}`) }),
        icon: e.item,
        href: '/storehouse/log',
      });
  // New to the log: said so, since a first Uncommon find comes before a Rare one seen before; one line a
  // rarity, the Rare first (session 148: five lines of first finds hid a newcomer's levels). One found again
  // in the same absence carries its count here and nowhere else (session 157: "First Rare finds: Warlord's
  // seal" stood two lines above "Rare find: Warlord's seal").
  const firstSeen = new Set(finds.filter((e) => e.first).map((e) => e.item));
  const times = (item: string) => {
    const n = finds.filter((e) => e.item === item).length + (a.uncommonItems?.[item] ?? 0);
    const said = t(`item.${item}`);
    return n > 1 ? t('action.gives', { item: said, count: fmt.int(n) }) : said;
  };
  for (const rarity of ['rare', 'uncommon'] as const) {
    const firsts = [...new Set(finds.filter((e) => e.first && e.rarity === rarity).map((e) => e.item))];
    if (!firsts.length) continue;
    lines.push({
      kind: 'newFind',
      text:
        firsts.length === 1
          ? t('recap.newFind', { item: times(firsts[0]), rarity: t(`rarity.${rarity}`) })
          : t('recap.newFinds', { rarity: t(`rarity.${rarity}`), items: firsts.map(times).join(', ') }),
      icon: firsts[0],
      href: '/storehouse/log',
    });
  }
  // Rare finds the log already held, one line an item: "Rare find: Torn banner ×4".
  const rares = new Map<string, number>();
  for (const e of finds)
    if (e.rarity === 'rare' && !e.first && !firstSeen.has(e.item)) rares.set(e.item, (rares.get(e.item) ?? 0) + 1);
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
  // The highest first (session 148: Mining 5 stood above Melee 14, and Woodcutting 15 out of sight).
  for (const [skill, level] of [...levels].sort(([, x], [, y]) => y - x))
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
  // The run that came home, its story; several (runs set out again since session 239), one line for them all.
  const runs = a.events.filter((e) => e.type === 'expeditionDone');
  if (runs.length === 1) {
    const story = storyOf(runs[0]);
    lines.push({
      kind: 'expedition',
      text: `${story.title}. ${story.body}`,
      icon: runs[0].region,
      href: '/combat/expeditions',
    });
  } else if (runs.length > 1) {
    const marks = runs.reduce((n, e) => n + e.marks, 0);
    lines.push({
      kind: 'expedition',
      text: t('recap.runs', {
        count: fmt.int(runs.length),
        won: fmt.int(runs.filter((e) => e.outcome === 'won').length),
        gained: marks === 1 ? t('expedition.marksOne') : t('expedition.marks', { marks: fmt.int(marks) }),
      }),
      icon: runs.at(-1)!.region,
      href: '/combat/expeditions',
    });
  }
  // Each boss fought alone in the lane (session 72), the realm's (session 190), and each descent into the
  // Deep (session 212).
  for (const e of a.events)
    if (e.type === 'bossFought' || e.type === 'realmFought' || e.type === 'deepDone') {
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
  // Uncommon finds the log already held, counted, then named by the three found most (session 107: the line
  // stood on a bare dot and named none); one first found this absence is counted on its first-find line.
  const held = Object.entries(a.uncommonItems ?? {}).filter(([id]) => !firstSeen.has(id));
  const uncommon =
    (a.uncommon ?? 0) -
    Object.entries(a.uncommonItems ?? {}).reduce((n, [id, k]) => n + (firstSeen.has(id) ? k : 0), 0);
  if (uncommon > 0) {
    const most = held.sort((x, y) => y[1] - x[1]).slice(0, 3);
    const count = uncommon === 1 ? t('recap.uncommonOne') : t('recap.uncommon', { count: fmt.int(uncommon) });
    lines.push({
      kind: 'uncommon',
      text: most.length
        ? t('recap.uncommonNamed', {
            count,
            items: most
              .map(([id, n]) =>
                n > 1 ? t('action.gives', { item: t(`item.${id}`), count: fmt.int(n) }) : t(`item.${id}`),
              )
              .join(', '),
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
        text: t('moment.laneStopped', { lane: t(`lane.${e.lane}`), reason: formatStop(e.reason, 'mid') }),
        icon: stopIcon(e),
        href: stopHref(e),
      });
  return lines.sort((x, y) => RECAP_ORDER.indexOf(x.kind) - RECAP_ORDER.indexOf(y.kind));
}

/** The good things in a recap: every line but the castle's defences and the lane stops, which need the
 *  player and are always shown. */
export const goodThings = (lines: readonly RecapLine[]) =>
  lines.filter((l) => l.kind !== 'stopped' && l.kind !== 'defence');

/** Lanes rest once they have worked a day while the player is away: said when the player was away longer,
 *  where "Away for 30 h" stood over a day's work with no word of why (session 151). */
export function restedFor(a: AwaySummary, cap: number): string | null {
  const rested = a.to - a.from - cap;
  if (rested < 60_000) return null;
  return t('recap.rested', { cap: fmt.duration(cap), rested: fmt.duration(rested) });
}
