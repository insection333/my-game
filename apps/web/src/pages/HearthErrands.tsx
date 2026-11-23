// The day's fights waiting, as rows of the Hearth's Next up (session 188, `hearth.errands`): a share or a
// bounty to take, the realm's strike, the bosses and bounties of the day, each leading to where it is done,
// rewards waiting first. Each goes once done or under way in a lane.
import type { ErrandRow } from '@idle-clash/features';
import { hasIcon, ItemIcon } from '@idle-clash/ui';
import { useGame } from '../game/hooks.ts';
import { navigate } from '../router.ts';
import { fills, Slot } from '../slots.tsx';
import s from './pages.module.css';

export function useErrands(): ErrandRow[] {
  const { state, now, features } = useGame();
  return fills<ErrandRow[]>(features, 'hearth.errands', state, now)
    .flatMap((f) => f.data)
    .sort((a, b) => a.order - b.order);
}

export function Errands({ rows }: { rows: ErrandRow[] }) {
  if (!rows.length) return null;
  return (
    <Slot id="hearth.errands" className={s.errands}>
      {rows.map((r) => (
        <a
          key={r.text}
          href={r.href}
          data-ui="RowLink"
          className={`${s.row} ${s.errand}`}
          onClick={(e) => (e.preventDefault(), navigate(r.href))}
        >
          {hasIcon(r.icon) && <ItemIcon name={r.icon} size={24} />}
          <span>{r.text}</span>
        </a>
      ))}
    </Slot>
  );
}
