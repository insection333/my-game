// How honours read: the Deeds tab's summary (points, deeds done by tier, the next title by points)
// with the choice of title, banner and frame, and the Hearth's plaque wearing what was chosen.
import { fmt, t } from '@idle-clash/content';
import type { State } from '@idle-clash/kernel';
import { DEED_TIERS, type DeedTier } from './content.ts';
import {
  HONOUR_KINDS,
  HONOURS,
  honourName,
  shownHonours,
  unlocked,
  unlockText,
  type Honour,
  type HonourKind,
  type Shown,
} from './honours.ts';
import { deedById, deedList, pointsOf } from './list.ts';
import { Reader } from './reader.ts';
import { countText } from './view.ts';
import { deedsOf } from './state.ts';

export interface HonourOption {
  /** Null: none (no title, no frame). */
  id: string | null;
  name: string;
  open: boolean;
  /** How it is unlocked, while it is not. */
  unlock: string | null;
  /** While locked by a counted deed, how far that deed is ("47 of 100": session 77). */
  progress: string | null;
  current: boolean;
}
export interface HonourChoice {
  kind: HonourKind;
  name: string;
  options: HonourOption[];
}
export interface HonoursView {
  points: string;
  done: string;
  tiers: { tier: DeedTier; name: string; count: string }[];
  /** The next title points unlock, and how far it is. */
  next: { text: string; progress: number } | null;
  shown: Omit<Shown, 'title'> & { title: string | null; bannerName: string; frameName: string | null };
  choices: HonourChoice[];
}

/** What the plaque on the Hearth wears: the title in words, the rest by id. */
export type PlaqueView = Omit<Shown, 'title'> & { title: string | null };

export function plaqueView(state: State): PlaqueView {
  const s = shownHonours(state);
  return { ...s, title: s.title ? honourName({ kind: 'title', id: s.title }) : null };
}

/** How far the counted deed that opens a locked honour is, or null for one opened otherwise. */
function progressOf(h: Honour, reader: Reader): string | null {
  const id = h.unlock && 'deed' in h.unlock ? h.unlock.deed : null;
  const d = id ? deedById(id) : undefined;
  return d ? countText(d, d.measure(reader)) : null;
}

/** The kinds a player may also show none of; a banner, a picture and a scene always show one. */
const NONE: ReadonlySet<HonourKind> = new Set(['title', 'frame', 'glow', 'badge']);

export function honoursView(state: State, now: number): HonoursView {
  const reader = new Reader(state, now);
  const d = deedsOf(state);
  const points = pointsOf(state);
  const list = deedList();
  const isDone = (id: string) => Object.hasOwn(d.done, id);
  const shown = shownHonours(state);
  const nextTitle = HONOURS.find(
    (h) => h.kind === 'title' && h.unlock && 'points' in h.unlock && h.unlock.points > points,
  );
  const prev = HONOURS.filter(
    (h) => h.kind === 'title' && h.unlock && 'points' in h.unlock && h.unlock.points <= points,
  )
    .map((h) => (h.unlock as { points: number }).points)
    .reduce((a, b) => Math.max(a, b), 0);
  const choice = (kind: HonourKind, none: boolean): HonourChoice => {
    const options = HONOURS.filter((h) => h.kind === kind).map((h): HonourOption => {
      const open = unlocked(h, d.done, points);
      return {
        id: h.id,
        name: honourName(h),
        open,
        unlock: open ? null : unlockText(h),
        progress: open ? null : progressOf(h, reader),
        current: shown[kind] === h.id,
      };
    });
    // Open ones first, each group in its own order.
    const sorted = [...options.filter((o) => o.open), ...options.filter((o) => !o.open)];
    return {
      kind,
      name: t(`honour.kind.${kind}`),
      options: none
        ? [
            {
              id: null,
              name: t(`honour.none.${kind}`),
              open: true,
              unlock: null,
              progress: null,
              current: shown[kind] === null,
            },
            ...sorted,
          ]
        : sorted,
    };
  };
  return {
    points: t('deeds.points', { points: fmt.int(points) }),
    done: t('deeds.done', {
      done: fmt.int(list.filter((x) => isDone(x.id)).length),
      total: fmt.int(list.length),
    }),
    tiers: DEED_TIERS.map((tier) => {
      const inTier = list.filter((x) => x.tier === tier);
      return {
        tier,
        name: t(`deeds.tier.${tier}`),
        count: t('deeds.of', {
          done: fmt.int(inTier.filter((x) => isDone(x.id)).length),
          total: fmt.int(inTier.length),
        }),
      };
    }),
    next:
      nextTitle && nextTitle.unlock && 'points' in nextTitle.unlock
        ? {
            text: t('deeds.nextTitle', { title: honourName(nextTitle), points: fmt.int(nextTitle.unlock.points) }),
            progress: (points - prev) / (nextTitle.unlock.points - prev),
          }
        : null,
    shown: {
      ...shown,
      title: shown.title ? honourName({ kind: 'title', id: shown.title }) : null,
      bannerName: honourName({ kind: 'banner', id: shown.banner }),
      frameName: shown.frame ? honourName({ kind: 'frame', id: shown.frame }) : null,
    },
    choices: HONOUR_KINDS.map((k) => choice(k, NONE.has(k))),
  };
}
