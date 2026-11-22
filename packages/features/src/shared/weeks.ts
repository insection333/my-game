// The weeks kept (session 172): the week's contracts a player has finished, kept by the goals feature in its
// part of the save and read here for the deeds, so no feature reads another's code.
import type { State } from '@idle-clash/kernel';

export function weeksKept(state: State): number {
  const g = state.features.goals as { weeks?: unknown } | undefined;
  return typeof g?.weeks === 'number' && Number.isFinite(g.weeks) && g.weeks > 0 ? Math.floor(g.weeks) : 0;
}
