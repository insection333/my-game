// Slots: the named places on a page that features fill. The shell asks every feature for a slot's
// data and draws it; the data-slot mark is what the tour and verify's checks point at.
import type { Feature, Json } from '@idle-clash/features';
import type { State } from '@idle-clash/kernel';
import type { ReactNode } from 'react';

export interface Fill<T> {
  feature: string;
  data: T;
}

/** Every feature's data for a slot, skipping features that give nothing. */
export function fills<T>(features: readonly Feature[], slot: string, state: State, now: number): Fill<T>[] {
  return features.flatMap((f) => {
    const fill = f.slots[slot];
    if (!fill) return [];
    const data = fill({ state, now });
    return data === null ? [] : [{ feature: f.id, data: data as T & Json }];
  });
}

/** The one feature's data for a slot on that feature's own page (a skill page). */
export function fillFor<T>(feature: Feature, slot: string, state: State, now: number): T | null {
  const fill = feature.slots[slot];
  return fill ? (fill({ state, now }) as T) : null;
}

export function Slot({ id, children, className }: { id: string; children: ReactNode; className?: string }) {
  return (
    <div data-slot={id} className={className}>
      {children}
    </div>
  );
}
