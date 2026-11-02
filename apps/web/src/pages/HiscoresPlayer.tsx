// A player's sheet on Hiscores (`?panel=player&name=…`, session 39): their name with their title, where
// they stand on the ladders shown, and, for someone else, Report this player.
import type { Ladder } from '@idle-clash/contracts';
import { fmt, hasString, t } from '@idle-clash/content';
import { Sheet } from '@idle-clash/ui';
import { navigate, withPanel } from '../router.ts';
import { ReportPlayer } from './ReportPlayer.tsx';
import s from './hiscores.module.css';

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
  return (
    <Sheet title={who} closeLabel={t('shell.close')} onClose={close} slot="hiscores.player">
      <div className={s.sheet}>
        {title && hasString(`honour.title.${title}`) && <p className={s.sheetTitle}>{t(`honour.title.${title}`)}</p>}
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
