// The castle's banner (session 41): the lord's castle in its scene as they have raised it (CastleScene,
// ART.md), drawn from the castle as it stands (look.ts).
import { CastleScene } from '@idle-clash/ui';
import { lookOf } from './look.ts';
import { useSyncedCastle } from './synced.ts';
import s from './castle.module.css';

export function Banner() {
  const { castle, view, now, totalLevel } = useSyncedCastle();
  if (!castle) return null;
  return (
    <div data-slot="castle.banner">
      <CastleScene className={s.banner} look={lookOf(castle, totalLevel, view?.logs ?? [], now)} />
    </div>
  );
}
