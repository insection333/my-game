// The console's figures as instruments (sessions 228 and 232): a label above a large number, a note under
// it, the label a link where the figure leads somewhere. The Overview's and System's (session 233).
import { TextLink } from '@idle-clash/ui';
import { navigate } from '../router.ts';
import s from './pages.module.css';

export interface Tile {
  label: string;
  value: string;
  note?: string;
  href?: string;
}

export function Tiles({ tiles }: { tiles: Tile[] }) {
  return (
    <dl className={s.tiles}>
      {tiles.map((x) => (
        <div key={x.label} className={s.tile}>
          <dt>
            {x.href ? (
              <TextLink href={x.href} onNavigate={navigate}>
                {x.label}
              </TextLink>
            ) : (
              x.label
            )}
          </dt>
          <dd className={s.tileValue}>{x.value}</dd>
          {x.note && <dd className={s.tileNote}>{x.note}</dd>}
        </div>
      ))}
    </dl>
  );
}
