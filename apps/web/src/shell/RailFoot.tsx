// The foot of the wide rail (session 131): who is playing, as the game's own frame shows it: their picture
// in its frame, their name, their rank and total level. Drawn from 1,024 px, where the rail has room; a
// landmark of its own, as everything on the page sits in one.
import { t } from '@idle-clash/content';
import type { PlaqueView, StandingView } from '@idle-clash/features';
import { Picture } from '@idle-clash/ui';
import { useGame } from '../game/hooks.ts';
import { useSession } from '../game/session.ts';
import { fills } from '../slots.tsx';
import s from './shell.module.css';

export function RailFoot() {
  const { state, now, features } = useGame();
  const { player } = useSession();
  const [standing] = fills<StandingView>(features, 'hearth.standing', state, now);
  const [plaque] = fills<PlaqueView>(features, 'hearth.plaque', state, now);
  if (!player || !standing) return null;
  return (
    <aside className={s.railFoot} aria-label={t('shell.account')} data-chrome data-rail-foot>
      {plaque && <Picture picture={plaque.data.picture} frame={plaque.data.frame} size={48} />}
      <div className={s.railWho}>
        <span className={s.railName}>{player.name}</span>
        <span className={s.railRank}>{plaque?.data.title ?? standing.data.rank}</span>
        <span className={s.railTotal}>{standing.data.total}</span>
      </div>
    </aside>
  );
}
