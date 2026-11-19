// A lane running an action well below one it could start now (session 152: a newcomer six days in chopped
// pine at Woodcutting 27 while oak paid 41% more XP an hour, and the goals, which follow the lane, kept
// asking for pine). Said on the lane with the better action to start in one press.
import { fmt, t } from '@idle-clash/content';
import type { Feature } from '@idle-clash/features';
import type { ActionRef, LaneId, State } from '@idle-clash/kernel';

/** How much more an action must pay before the lane mentions it: less is not worth a word. */
const WORTH = 1.2;

interface Row {
  action: ActionRef;
  name: string;
  locked: boolean;
  tier: number;
  xpRate?: number;
}

export interface Better {
  label: string;
  note: string;
  action: ActionRef;
}

const seen = new WeakMap<State, Map<string, Better | null>>();

/** The open action of a higher tier in the running one's skill that pays the most XP an hour, where it pays
 *  at least a fifth more and the engine would start it on this lane now (its ingredients held). */
export function betterFor(
  state: State,
  now: number,
  features: readonly Feature[],
  lane: LaneId,
  running: ActionRef,
  canStart: (lane: LaneId, action: ActionRef) => boolean,
): Better | undefined {
  const key = `${lane}:${running.feature}:${running.id}`;
  const cache = seen.get(state) ?? new Map<string, Better | null>();
  seen.set(state, cache);
  if (cache.has(key)) return cache.get(key) ?? undefined;
  const fill = features.find((f) => f.id === running.feature)?.slots['skill.actions'];
  const rows = (fill?.({ state, now }) ?? []) as unknown as Row[];
  const current = rows.find((r) => r.action.id === running.id);
  const here = current?.xpRate;
  let best: Row | undefined;
  // Only a higher tier: within a tier the rich action trades XP for what it gives, a choice the player made.
  if (current && here)
    for (const r of rows) {
      if (r.locked || r.tier <= current.tier || !r.xpRate || r.xpRate < here * WORTH) continue;
      if ((best?.xpRate ?? 0) >= r.xpRate) continue;
      if (canStart(lane, r.action)) best = r;
    }
  const out =
    best && here
      ? {
          label: t('lane.betterStart', { action: best.name }),
          note: t('lane.better', { action: best.name, pct: fmt.int(Math.round((best.xpRate! / here - 1) * 100)) }),
          action: best.action,
        }
      : null;
  cache.set(key, out);
  return out ?? undefined;
}
