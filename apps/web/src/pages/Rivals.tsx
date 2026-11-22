// The rivals strip above a ladder (session 173): who stands just above and just below you, each a link to
// their card, and the gap as you would close it. Nothing where you stand alone or are not yet listed.
import type { HiscoreRow } from '@idle-clash/contracts';
import { t } from '@idle-clash/content';
import { Picture } from '@idle-clash/ui';
import { useGame } from '../game/hooks.ts';
import { navigate } from '../router.ts';
import { profileHref } from './ProfileSheet.tsx';
import { rivalLines } from './rivals-words.ts';
import s from './hiscores.module.css';

export function Rivals({
  ladder,
  you,
  near,
}: {
  ladder: string;
  you: HiscoreRow | null;
  near: { above: HiscoreRow | null; below: HiscoreRow | null } | undefined;
}) {
  const { state } = useGame();
  const lines = rivalLines(ladder, you, near, state);
  if (!lines.length) return null;
  return (
    <ul className={s.rivals} data-slot="hiscores.rivals" aria-label={t('rival.title')}>
      {lines.map((l) => (
        <li key={l.side} data-side={l.side}>
          <a
            href={profileHref(l.row.name)}
            data-ui="RowLink"
            className={s.rival}
            onClick={(e) => (e.preventDefault(), navigate(profileHref(l.row.name)))}
          >
            <span className={s.rivalMark} aria-hidden="true">
              {l.side === 'above' ? '▲' : '▼'}
            </span>
            {l.row.look && (
              <Picture picture={l.row.look.picture} frame={l.row.look.frame} glow={l.row.look.glow} size={24} />
            )}
            <span className={s.rivalText}>{l.text}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
