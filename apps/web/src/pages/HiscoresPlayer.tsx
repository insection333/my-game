// A player's sheet on Hiscores (`?panel=player&name=…`, session 39): their picture in its frame and glow
// before the scene they show (session 43), their title with its badge, where they stand on the ladders
// shown, and, for someone else, Report this player.
import type { Ladder } from '@idle-clash/contracts';
import { fmt, hasString, t } from '@idle-clash/content';
import { CastleScene, ItemIcon, MarchScene, Picture, Sheet, type CastleLook } from '@idle-clash/ui';
import { badgeName } from './honours-style.ts';
import { navigate, withPanel } from '../router.ts';
import { ReportPlayer } from './ReportPlayer.tsx';
import s from './hiscores.module.css';

/** A castle drawn from its level alone (another lord's castle: only its level is known). */
const castleLook = (level: number): CastleLook => ({
  walls: level,
  keep: level,
  towers: level,
  banner: null,
  integrity: 100,
  besieged: false,
});

/** The address of a player's sheet, over the ladder shown. */
export function playerSheet(name: string): string {
  const url = new URL(location.href);
  url.searchParams.set('panel', 'player');
  url.searchParams.set('name', name);
  return url.pathname + url.search;
}

export function PlayerSheet({ ladders, name }: { ladders: Ladder[]; name: (skill: string) => string }) {
  const who = new URLSearchParams(location.search).get('name');
  const close = () => navigate(withPanel(null).replace(/[?&]name=[^&]*/, ''));
  if (!who) return null;
  const rows = ladders.flatMap((l) => {
    const row = l.rows.find((r) => r.name === who);
    return row ? [{ ladder: name(l.skill), row }] : [];
  });
  const title = rows.find((r) => r.row.title)?.row.title ?? null;
  const look = rows.find((r) => r.row.look)?.row.look ?? null;
  // Their castle, drawn as its level stands, when the scene they show is their castle (session 43).
  const castle = ladders.find((l) => l.skill === 'castle')?.rows.find((r) => r.name === who);
  return (
    <Sheet title={who} closeLabel={t('shell.close')} onClose={close} slot="hiscores.player">
      <div className={s.sheet}>
        {look && (
          <div className={s.profile}>
            {look.scene === 'castle' && castle ? (
              <CastleScene className={s.profileScene} look={castleLook(castle.level)} />
            ) : (
              <MarchScene className={s.profileScene} keep="middle" night={look.scene === 'night'} />
            )}
            <span className={s.profilePicture}>
              <Picture picture={look.picture} frame={look.frame} glow={look.glow} size={96} />
            </span>
          </div>
        )}
        {(title || look?.badge) && (
          <p className={s.sheetTitle}>
            {look?.badge && <ItemIcon name={`badge-${look.badge}`} size={24} label={badgeName(look.badge)} />}
            {title && hasString(`honour.title.${title}`) && t(`honour.title.${title}`)}
          </p>
        )}
        <h3>{t('player.places')}</h3>
        {rows.length ? (
          <ul className={s.places}>
            {rows.map(({ ladder, row }) => (
              <li key={ladder}>{t('player.place', { ladder, rank: fmt.int(row.rank) })}</li>
            ))}
          </ul>
        ) : (
          <p className={s.note}>{t('player.nowhere')}</p>
        )}
        <ReportPlayer name={who} />
      </div>
    </Sheet>
  );
}
