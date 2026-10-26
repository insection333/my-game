// The fire: the game's one bright thing. It burns for five minutes after your last input and dims
// in its last minute; pressing it stokes it (a real input, like starting an action).
import { fireHeat, fireXpPct, fmt, t } from '@idle-clash/content';
import { DEFAULT_CONFIG } from '@idle-clash/kernel';
import { game } from '../game/store.ts';
import { Flame } from './glyphs.tsx';
import s from './shell.module.css';

/** The fire also shows its heat: the longer it burns without going out, the hotter it glows and the
 *  more XP it gives (FIRE_HEAT). */
export function FireBadge({ fireUntil, fireSince, now }: { fireUntil: number; fireSince?: number; now: number }) {
  const left = fireUntil - now;
  const lit = Math.max(0, Math.min(1, left / DEFAULT_CONFIG.fireBurns));
  const burning = left > 0;
  const dimming = burning && left < 60_000;
  const minutes = burning ? Math.max(0, now - (fireSince ?? now)) / 60_000 : 0;
  const pct = fmt.int(fireXpPct(minutes));
  return (
    <button
      type="button"
      data-ui="FireBadge"
      data-slot="shell.fire"
      data-state={burning ? (dimming ? 'dimming' : 'burning') : 'out'}
      data-heat={burning ? fireHeat(minutes) : undefined}
      className={s.fire}
      aria-label={burning ? t('shell.fire.burningLabel', { time: fmt.clock(left), pct }) : t('shell.fire.outLabel')}
      onClick={() => game.command({ type: 'stoke' })}
    >
      <span className={s.fireGlow} aria-hidden="true" />
      <Flame lit={lit} />
      <span className={s.fireText}>{burning ? fmt.clock(left) : t('shell.fire.out')}</span>
      {burning && (
        <span className={s.fireHeat} aria-hidden="true">
          {t('shell.fire.heat', { pct })}
        </span>
      )}
    </button>
  );
}
