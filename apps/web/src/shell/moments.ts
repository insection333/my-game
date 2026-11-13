// Notable moments as the page shows them (GAME_DESIGN.md section 11): events within 5 seconds of each
// other show together, led by the best. Levels, Legendary finds and elite or master deeds take the
// centre of the screen; Rare finds, mastery steps and hard deeds a banner; Uncommon finds, goals and
// easy deeds a small toast.
import { fmt, formatEffect, formatStop, isQuietStop, masteryEffects, t } from '@idle-clash/content';
import {
  bossFoughtWords,
  workRaisedWords,
  castleEngine,
  expeditionStory as storyOf,
  kindlingData,
  rankUpWords,
  skill as skillKit,
  type Feature,
} from '@idle-clash/features';
import { isNotable, type GameEvent } from '@idle-clash/kernel';
import { hasIcon } from '@idle-clash/ui';

export type MomentSize = 'centre' | 'banner' | 'toast';

export interface MomentView {
  /** Stable while the moment shows: the time of its first event. */
  key: string;
  size: MomentSize;
  /** An item to draw beside it (a find), if any. */
  icon: string | null;
  /** Without an icon, a deed's medallion (session 68). */
  medal?: { tier: string; mark: string };
  title: string;
  body: string | null;
  /** When it should go: some seconds after its last event. */
  until: number;
}

const GROUP_MS = 5000;
const ALSO_NAMED = 4;
const SHOW_MS: Record<MomentSize, number> = { centre: 6000, banner: 5000, toast: 4000 };
const SIZE_RANK: MomentSize[] = ['toast', 'banner', 'centre'];

/** Best first: a cache the player opened (what it held is what they asked to see, whatever else it set
 *  off), Legendary, a Kindling, a master deed, a new collection entry, a level, Rare, an elite deed, a
 *  mastery step, any other deed, a goal, Uncommon. */
function rank(e: GameEvent): number {
  if (e.type === 'goalDone' && e.cache) return -1;
  if (e.type === 'find') return e.rarity === 'legendary' ? 0 : e.first ? 2 : e.rarity === 'rare' ? 4 : 9;
  if (e.type === 'deedDone') return e.tier === 'master' ? 1 : e.tier === 'elite' ? 5 : 7;
  if (e.type === 'expeditionDone') return e.outcome === 'won' ? 1 : 5;
  if (e.type === 'bossFought') return e.won && e.first ? 1 : e.won ? 5 : 8;
  if (e.type === 'kindled') return 1;
  // First on a ladder ranks with a master deed; the top three or ten with an elite one.
  if (e.type === 'rankUp') return e.band === 1 ? 1 : e.band <= 10 ? 5 : 8;
  // What the player has just done in the castle leads what it brought ("Breached …. Also: Deed done:
  // War marks: 200"), as a level leads its deeds; news from others ranks by how loud it is.
  if (byYou(e)) return 2;
  if (castleEngine.isCastleEvent(e)) {
    const size = castleEngine.castleMoment(e).size;
    return size === 'centre' ? 1 : size === 'banner' ? 5 : 8;
  }
  return e.type === 'levelUp' ? 3 : e.type === 'masteryStep' ? 6 : 8;
}

/** A press of the player's own in the castle answered: a siege, an assault, a relic tempered. */
const byYou = (e: GameEvent) =>
  e.type === 'castleSiege' ||
  e.type === 'castleSpied' ||
  e.type === 'castleIncursion' ||
  e.type === 'castleTempered' ||
  e.type === 'workRaised' ||
  e.type === 'findUsed';

function sizeOf(e: GameEvent): MomentSize {
  if (e.type === 'levelUp' || e.type === 'kindled' || (e.type === 'find' && e.rarity === 'legendary')) return 'centre';
  // A goal's supply cache is opened in a banner; a lucky one takes the centre.
  if (e.type === 'goalDone' && e.cache) return e.cache.grade === 'lucky' ? 'centre' : 'banner';
  if (e.type === 'deedDone') return e.tier === 'easy' ? 'toast' : e.tier === 'hard' ? 'banner' : 'centre';
  if (e.type === 'expeditionDone') return e.outcome === 'won' ? 'centre' : 'banner';
  if (e.type === 'bossFought') return bossFoughtWords(e).size;
  // A work raised: a press answered; fully raised, a banner (session 76).
  if (e.type === 'workRaised') return e.stage >= 5 ? 'banner' : 'toast';
  if (e.type === 'masteryStep' || (e.type === 'find' && e.rarity === 'rare')) return 'banner';
  if (e.type === 'rankUp') return e.band === 1 ? 'centre' : e.band <= 10 ? 'banner' : 'toast';
  if (castleEngine.isCastleEvent(e)) return castleEngine.castleMoment(e).size;
  return 'toast';
}

/** An action's icon: what it makes, or the foe fought, when drawn. */
function actionIcon(a: { feature: string; id: string }, features: readonly Feature[]): string | null {
  const out = features.find((f) => f.id === a.feature)?.content.actions?.find((x) => x.id === a.id)?.gives?.[0]?.item;
  return [out, a.id].find((n): n is string => !!n && hasIcon(n)) ?? null;
}

function describe(
  e: GameEvent,
  features: readonly Feature[],
): { title: string; body: string | null; icon: string | null; medal?: { tier: string; mark: string } } {
  switch (e.type) {
    case 'levelUp': {
      const f = features.find((x) => x.content.skill?.id === e.skill);
      const ladder = f?.content.skill?.ladder;
      const unlocks = f && ladder ? (ladder[e.level - 1] ?? []).map((u) => skillKit.unlockText(f.id, ladder, u)) : [];
      return {
        title: t('moment.levelUp', { skill: t(`skill.${e.skill}`), level: fmt.int(e.level) }),
        body: unlocks.length ? t('moment.unlocked', { unlock: unlocks.join('; ') }) : null,
        icon: hasIcon(e.skill) ? e.skill : null,
      };
    }
    case 'find':
      return {
        title: t('moment.find', { rarity: t(`rarity.${e.rarity}`), item: t(`item.${e.item}`) }),
        body: e.first ? t('moment.find.first') : null,
        icon: e.item,
      };
    case 'findUsed':
      return {
        title: t('moment.findUsed', {
          item: t(`item.${e.item}`),
          action: t(`action.${e.action.feature}.${e.action.id}`),
        }),
        body: t('moment.findUsed.body', { count: fmt.int(e.completions) }),
        icon: e.item,
      };
    case 'masteryStep':
      return {
        title: t('moment.masteryStep', {
          action: t(`action.${e.action.feature}.${e.action.id}`),
          step: fmt.int(e.step),
        }),
        body: masteryEffects(e.step).map(formatEffect).join(', '),
        icon: actionIcon(e.action, features),
      };
    case 'goalDone':
      return {
        title: t('moment.goalDone', { goal: e.name ?? t(`goal.${e.goal}`) }),
        body: e.cache ? cacheText(e.cache) : null,
        icon: e.cache ? 'supply-cache' : 'gold',
      };
    case 'kindled':
      return {
        title: t('moment.kindled', { skill: t(`skill.${e.skill}`) }),
        body:
          e.count === 1
            ? t('moment.kindledFirst')
            : t(e.count <= kindlingData.KINDLINGS_THAT_STRENGTHEN ? 'moment.kindledStronger' : 'moment.kindledFlame', {
                count: fmt.int(e.count),
              }),
        icon: hasIcon(e.skill) ? e.skill : null,
      };
    case 'expeditionDone':
      return { ...storyOf(e), icon: hasIcon(e.boss) ? e.boss : null };
    case 'workRaised': {
      const w = workRaisedWords(e);
      return { title: w?.title ?? '', body: w?.body ?? null, icon: null };
    }
    case 'bossFought': {
      const w = bossFoughtWords(e);
      return { title: w.title, body: w.body, icon: hasIcon(e.boss) ? e.boss : null };
    }
    case 'deedDone': {
      const worth = t('moment.deedPoints', { tier: t(`deeds.tier.${e.tier}`), points: fmt.int(e.points) });
      const unlocked = e.unlocks?.length ? t('moment.deedUnlocks', { honours: e.unlocks.join(', ') }) : null;
      return {
        title: t('moment.deedDone', { deed: e.name }),
        body: [worth, unlocked].filter(Boolean).join('. '),
        icon: e.icon && hasIcon(e.icon) ? e.icon : null,
        medal: { tier: e.tier, mark: e.mark ?? '' },
      };
    }
    case 'rankUp': {
      const w = rankUpWords(e);
      return { title: w.title, body: w.body, icon: w.skill && hasIcon(w.skill) ? w.skill : null };
    }
    default: {
      // Every castle event, the day's orders among them (session 63: an order done had no words at all,
      // a blank toast, and read "Also: ." beside the siege that did it).
      if (!castleEngine.isCastleEvent(e)) return { title: '', body: null, icon: null };
      const m = castleEngine.castleMoment(e);
      const icon = castleEngine.castleIcon(e);
      return { title: m.title, body: m.body, icon: hasIcon(icon) ? icon : null };
    }
  }
}

/** What a cache held, as the moment says it: "A rich cache: 1,650 gold". */
export function cacheText(cache: { grade: string; items: { item: string; count: number }[] }): string {
  const items = cache.items.map((i) =>
    i.item === 'gold'
      ? t('goals.reward.gold', { amount: fmt.int(i.count) })
      : t('action.gives', { item: t(`item.${i.item}`), count: fmt.int(i.count) }),
  );
  return t('cache.holds', { cache: t(`cache.${cache.grade}`), items: items.join(', ') });
}

/** The moments to show for events after `since`, newest last. */
export function momentsFrom(events: readonly GameEvent[], since: number, features: readonly Feature[]): MomentView[] {
  const notable = events.filter((e) => e.at > since && isNotable(e)).sort((a, b) => a.at - b.at);
  const groups: GameEvent[][] = [];
  for (const e of notable) {
    const last = groups.at(-1);
    // A press answered starts a moment of its own: it is never folded into what came before it, where it
    // was counted as "1 more" under a deed seconds older (session 63).
    if (last && e.at - last[0].at <= GROUP_MS && !byYou(e)) last.push(e);
    else groups.push([e]);
  }
  const moments = groups.map((group): MomentView => {
    const ordered = [...group].sort((a, b) => rank(a) - rank(b));
    const best = describe(ordered[0], features);
    const size = group.map(sizeOf).reduce((a, b) => (SIZE_RANK.indexOf(b) > SIZE_RANK.indexOf(a) ? b : a));
    // A long run of moments at once (a returning player's deeds) names the first few and counts the rest.
    // Steps one action climbed at once are said as the step reached (session 93: "Pine tree: mastery 1;
    // Pine tree: mastery 2; …" after a Rare find's 500 completions).
    const top = (e: GameEvent) =>
      e.type !== 'masteryStep' ||
      !ordered.some(
        (o) =>
          o.type === 'masteryStep' &&
          o.action.feature === e.action.feature &&
          o.action.id === e.action.id &&
          o.step > e.step,
      );
    const rest = ordered.slice(1).filter(top);
    // Deeds alone are named once, as a list ("Also done: Castle 10, War marks: 100 and Tempered +3"), not
    // each under its own heading; anything mixed keeps each its heading.
    const deedsOnly = rest.every((e) => e.type === 'deedDone');
    // A deed named as the moment it follows ("Smokehouse fully raised") is said as its deed, with its worth,
    // not by its name again (session 86).
    const named = (e: GameEvent): string =>
      e.type === 'deedDone' && e.name.toLowerCase() === best.title.toLowerCase()
        ? t('moment.itsDeed', {
            worth: t('moment.deedPoints', { tier: t(`deeds.tier.${e.tier}`), points: fmt.int(e.points) }),
          })
        : deedsOnly && e.type === 'deedDone'
          ? e.name
          : describe(e, features).title;
    const also = [
      ...rest.slice(0, ALSO_NAMED).map(named),
      ...(rest.length > ALSO_NAMED ? [t('moment.andMore', { count: fmt.int(rest.length - ALSO_NAMED) })] : []),
    ];
    // Sentences, each ended: "Easy, 5 points. Also: …".
    const end = (x: string) => (/[.!?]$/.test(x) ? x : `${x}.`);
    const body = [
      best.body && also.length ? end(best.body) : best.body,
      also.length
        ? deedsOnly
          ? t('moment.alsoDone', { what: fmt.list(also) })
          : t('moment.also', { what: also.join('; ') })
        : null,
    ].filter(Boolean);
    const icon = best.icon ?? ordered.map((e) => describe(e, features).icon).find(Boolean) ?? null;
    const medal = icon ? undefined : (best.medal ?? ordered.map((e) => describe(e, features).medal).find(Boolean));
    return {
      key: String(group[0].at),
      size,
      icon,
      ...(medal ? { medal } : {}),
      title: best.title,
      body: body.length ? body.join(' ') : null,
      until: group.at(-1)!.at + SHOW_MS[size],
    };
  });
  return [...moments, ...notices(events, since)].sort((a, b) => a.until - b.until);
}

/** What did not happen, and why: a refused command, or a lane that stopped by itself. A small toast each. */
function notices(events: readonly GameEvent[], since: number): MomentView[] {
  const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
  return events.flatMap((e): MomentView[] => {
    if (e.at <= since) return [];
    if (e.type === 'refused')
      return [
        {
          key: `refused-${e.at}`,
          size: 'toast',
          icon: null,
          title: formatStop(e.reason),
          body: e.action ? t(`action.${e.action.feature}.${e.action.id}`) : null,
          until: e.at + SHOW_MS.toast,
        },
      ];
    if (e.type === 'laneStopped' && !isQuietStop(e.reason.code))
      return [
        {
          key: `stopped-${e.lane}-${e.at}`,
          size: 'toast',
          icon: null,
          title: t('moment.laneStopped', { lane: t(`lane.${e.lane}`), reason: lower(formatStop(e.reason)) }),
          body: e.action ? t(`action.${e.action.feature}.${e.action.id}`) : null,
          until: e.at + SHOW_MS.toast,
        },
      ];
    return [];
  });
}
