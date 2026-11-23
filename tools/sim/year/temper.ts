// Tempering as a player does it (session 216): on leaving, each worn piece tempered as far as the bars and
// trophies held allow, the weapon first.
import { FEATURES } from '@idle-clash/features';
import type { State } from '@idle-clash/kernel';

const SLOTS = ['weapon', 'body', 'legs', 'helm'] as const;

export function temperGear(state: State, now: number): { state: State; steps: number } {
  const route = FEATURES.find((f) => f.id === 'smithing')!.routes.temper;
  let s = state;
  let steps = 0;
  for (const slot of SLOTS)
    for (;;) {
      const r = route.run(s, { slot }, now);
      if (!(r.result as { ok: boolean }).ok) break;
      s = r.state;
      steps++;
    }
  return { state: s, steps };
}
