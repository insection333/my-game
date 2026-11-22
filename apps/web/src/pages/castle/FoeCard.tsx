// A foe on the War as a card (session 170, the owner: the War's two columns of rows left the day's
// strongholds in the bottom left of a desktop with its right empty, and read as a list of settings, not a
// war): the foe's arms, its name and standing, its host drawn as figures (its garrison at the level it
// fights at, where it is known), the chance to win as words over a meter coloured by the odds, what holds
// it and what it pays, and the presses: a quiet one (Send spies, Plan) beside the attack. A battle fought
// from it lands at its foot. Laid out by the list's own width: stacked on a phone, the host and the odds at
// the right where there is room, so every foe of the day stands in one full-width ladder.
import { ItemIcon } from '@idle-clash/ui';
import type { CSSProperties, ReactNode } from 'react';
import { Garrison } from './Battlefield.tsx';
import type { Rank } from './hosts.ts';
import w from './war.module.css';

/** The odds' tone: good from three in four, even from two in five, poor below. */
export const oddsTone = (chance: number): 'good' | 'even' | 'poor' =>
  chance >= 0.75 ? 'good' : chance >= 0.4 ? 'even' : 'poor';

export interface FoeCardProps {
  crest: string;
  name: string;
  status?: ReactNode;
  /** Their host, where their garrison is known. */
  host: Rank[] | null;
  /** The chance to win, for the meter; null where it is not known or no roll takes it. */
  chance: number | null;
  /** The chance (or why there is none) in words. */
  odds: string;
  facts: readonly string[];
  /** The lesser press, at the left of the attack. */
  quiet?: ReactNode;
  attack?: ReactNode;
  fought: ReactNode;
  fallen?: boolean;
}

export function FoeCard(p: FoeCardProps) {
  const tone = p.chance === null ? undefined : oddsTone(p.chance);
  return (
    <article className={w.foe} data-foe data-fallen={p.fallen || undefined}>
      <span className={w.arms}>
        <ItemIcon name="crest" crest={p.crest} size={32} />
      </span>
      <div className={w.who}>
        <h3 className={w.name}>{p.name}</h3>
        {p.status}
      </div>
      <div className={w.line}>
        {p.host && <Garrison ranks={p.host} />}
        <div className={w.odds} data-tone={tone}>
          <span className={w.oddsWords}>{p.odds}</span>
          {p.chance !== null && (
            <span
              className={w.meter}
              style={{ '--odds': `${Math.round(p.chance * 100)}%` } as CSSProperties}
              aria-hidden="true"
            />
          )}
        </div>
      </div>
      {p.facts.length > 0 && (
        <ul className={w.facts}>
          {p.facts.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      )}
      {(p.quiet || p.attack) && (
        <div className={w.acts}>
          {p.quiet}
          {p.attack}
        </div>
      )}
      <div className={w.fought}>{p.fought}</div>
    </article>
  );
}

/** The day's foes as one ladder: each a card, laid out by the ladder's width. */
export function FoeList({ slot, label, children }: { slot: string; label: string; children: ReactNode }) {
  return (
    <div data-slot={slot} className={w.list} data-scrollbox tabIndex={0} role="group" aria-label={label}>
      {children}
    </div>
  );
}
