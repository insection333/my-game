// What the lanes bring in, as it arrives: "+1 Oak logs", "+46 Woodcutting XP". A gain like one still
// showing adds to it and pops again, so a quick lane counts up in place instead of filling the
// screen. Each goes a couple of seconds after its last gain; at most four show. Screen readers are
// told about moments (Moments.tsx), not every log.
import { fmt, t } from '@idle-clash/content';
import { hasIcon, ItemIcon } from '@idle-clash/ui';
import { useEffect, useState } from 'react';
import { onGains, type Gain } from '../game/gains.ts';
import s from './gains.module.css';

const SHOWN_MS = 2400;
const MOST = 4;

interface Entry {
  key: string;
  icon: string;
  amount: number;
  /** Bumped by each gain, so the pop plays again. */
  pops: number;
  until: number;
  gain: Gain;
}

const keyOf = (g: Gain) => (g.kind === 'item' ? `item:${g.item}` : `xp:${g.skill}`);
const amountOf = (g: Gain) => (g.kind === 'item' ? g.count : g.xp);

function text(e: Entry): string {
  const n = fmt.int(e.amount);
  if (e.gain.kind === 'xp') return t('recap.xpOne', { xp: n, skill: t(`skill.${e.gain.skill}`) });
  if (e.gain.item === 'gold') return t('recap.gold', { count: n });
  return t('recap.item', { count: n, item: t(`item.${e.gain.item}`) });
}

export function Gains() {
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(
    () =>
      onGains((gains) => {
        const now = Date.now();
        setEntries((old) => {
          const next = old.filter((e) => e.until > now);
          for (const g of gains) {
            const key = keyOf(g);
            const had = next.find((e) => e.key === key);
            if (had)
              Object.assign(had, { amount: had.amount + amountOf(g), pops: had.pops + 1, until: now + SHOWN_MS });
            else
              next.push({
                key,
                icon: g.kind === 'item' ? g.item : g.skill,
                amount: amountOf(g),
                pops: 0,
                until: now + SHOWN_MS,
                gain: g,
              });
          }
          return next.slice(-MOST).map((e) => ({ ...e }));
        });
      }),
    [],
  );

  // Clears what has gone; this runs only while something shows.
  useEffect(() => {
    if (!entries.length) return;
    const next = Math.min(...entries.map((e) => e.until));
    const id = setTimeout(() => setEntries((old) => old.filter((e) => e.until > Date.now())), next - Date.now() + 20);
    return () => clearTimeout(id);
  }, [entries]);

  return (
    <div className={s.gains} aria-hidden="true" data-shell="gains">
      {entries.map((e) => (
        <div key={`${e.key}:${e.pops}`} className={s.gain} data-kind={e.gain.kind}>
          {hasIcon(e.icon) && <ItemIcon name={e.icon} size={24} />}
          <span>{text(e)}</span>
        </div>
      ))}
    </div>
  );
}
