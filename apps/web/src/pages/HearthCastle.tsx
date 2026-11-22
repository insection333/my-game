// Castle Clash on the Hearth's Next up (sessions 34 and 167): the day's Call to arms while it waits, a
// castle ready to raise once the total level allows, and before that how far off it opens, so a newcomer
// learns of it in their first minutes (it opens at total level 30, about twenty minutes in).
import { fmt, t, UNLOCKS } from '@idle-clash/content';
import { castleEngine, totalLevel } from '@idle-clash/features';
import type { State } from '@idle-clash/kernel';
import { ItemIcon } from '@idle-clash/ui';
import { navigate } from '../router.ts';
import s from './pages.module.css';

/** What the Hearth says of Castle Clash: `first` leads Next up (something to do now), else it closes it. */
export function castleNote(state: State, now: number): { text: string; first: boolean } | null {
  if (castleEngine.callAwaits(state, now)) return { text: t('castle.nudge'), first: true };
  if (castleEngine.castleStanding(state)) return null;
  const level = totalLevel(state);
  if (castleEngine.castleOpen(level)) return { text: t('castle.raiseNudge'), first: true };
  const away = UNLOCKS.TOTAL_LEVEL - level;
  return {
    text:
      away === 1
        ? t('castle.opensNudgeOne', { level: fmt.int(UNLOCKS.TOTAL_LEVEL) })
        : t('castle.opensNudge', { level: fmt.int(UNLOCKS.TOTAL_LEVEL), away: fmt.int(away) }),
    first: false,
  };
}

export function CastleRow({ text }: { text: string }) {
  return (
    <a
      href="/castle"
      data-ui="RowLink"
      data-castle-note
      className={s.row}
      onClick={(e) => (e.preventDefault(), navigate('/castle'))}
    >
      <span className={s.rowHead}>
        <span className={s.rowName}>
          <ItemIcon name="castle-walls" size={24} />
          {t('menu.castle')}
        </span>
      </span>
      <span className={s.rowText}>{text}</span>
    </a>
  );
}
