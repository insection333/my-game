// The fire: the game's one bright thing. It burns for five minutes after your last input and dims
// in its last minute; pressing it stokes it (a real input, like starting an action).
import { fmt, t } from '@idle-clash/content';
import { DEFAULT_CONFIG } from '@idle-clash/kernel';
import { game } from '../game/store.ts';
import { Flame } from './glyphs.tsx';
import s from './shell.module.css';

export function FireBadge({ fireUntil, now }: { fireUntil: number; now: number }) {
  const left = fireUntil - now;
  const lit = Math.max(0, Math.min(1, left / DEFAULT_CONFIG.fireBurns));
  const burning = left > 0;
  const dimming = burning && left < 60_000;
  return (
    <button
      type="button"
      data-ui="FireBadge"
      data-slot="shell.fire"
      data-state={burning ? (dimming ? 'dimming' : 'burning') : 'out'}
      className={s.fire}
      aria-label={burning ? t('shell.fire.burningLabel', { time: fmt.clock(left) }) : t('shell.fire.outLabel')}
      onClick={() => game.command({ type: 'stoke' })}
    >
      <span className={s.fireGlow} aria-hidden="true" />
      <Flame lit={lit} />
      <span className={s.fireText}>{burning ? fmt.clock(left) : t('shell.fire.out')}</span>
    </button>
  );
}
