// A battle played out (session 168, the owner: make the player feel they command armies): your host and
// theirs drawn as figures, each troop at its evolution and in its formation's shares, your banner and
// theirs at either end. As it lands, the hosts march in, meet in a burst at the middle, and the beaten one
// falls back, faded; it then stands at that end until the next battle. Under reduced motion, only the end.
// The words beside it say what came of it, so the field is a picture alone.
import { ItemIcon } from '@idle-clash/ui';
import type { Rank } from './hosts.ts';
import b from './battle.module.css';

interface Host {
  ranks: Rank[];
  crest: string;
}

/** `won`: whether your host carried the day; null draws the two hosts before a battle. */
export function Battlefield({ you, foe, won }: { you: Host; foe: Host; won: boolean | null }) {
  return (
    <div
      className={b.field}
      data-slot="castle.battlefield"
      data-won={won === null ? undefined : String(won)}
      aria-hidden="true"
    >
      <ItemIcon name="crest" crest={you.crest} size={24} />
      <HostFigures ranks={[...you.ranks].reverse()} side="you" />
      <span className={b.burst} />
      <HostFigures ranks={foe.ranks} side="foe" />
      <ItemIcon name="crest" crest={foe.crest} size={24} />
    </div>
  );
}

/** A host's ranks, front rank nearest the middle: yours siege, outriders, vanguard from the left; theirs
 *  vanguard, outriders, siege towards the right, facing you. */
function HostFigures({ ranks, side, size = 24 }: { ranks: Rank[]; side: 'you' | 'foe'; size?: 24 | 32 }) {
  return (
    <div className={b.host} data-side={side} data-size={size}>
      {ranks.map((r) =>
        r.count > 0 ? (
          <span key={r.unit} className={b.rank} data-unit={r.unit}>
            {Array.from({ length: r.count }, (_, i) => (
              <span key={i} className={b.figure}>
                <ItemIcon name={r.icon} size={size} />
              </span>
            ))}
          </span>
        ) : null,
      )}
    </div>
  );
}

/** One host as it is drawn up (session 168: the Army's formations), the front rank to the right, facing the
 *  foe: what a formation's shares put in the field. */
export function BattleLine({ ranks }: { ranks: Rank[] }) {
  return (
    <div className={b.line} data-slot="castle.battleLine" aria-hidden="true">
      <HostFigures ranks={[...ranks].reverse()} side="you" size={32} />
    </div>
  );
}
