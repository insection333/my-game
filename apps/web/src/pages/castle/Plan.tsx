// The attack as it will go (a target's sheet): since session 40 every attack on a known foe goes in the
// formation that does best against them (the engine's own reckoning, castleEngine.bestOffense), so the
// plan is that formation and its chance to win; nothing to set first.
import { fmt, t } from '@idle-clash/content';
import { castleEngine as E } from '@idle-clash/features';
import { useSyncedCastle } from './synced.ts';
import s from './castle.module.css';

const pct = (p: number) => fmt.chance(p);

/** `estimate`: the defence is reckoned from a rating and a scouting, so the chance is said as about. */
export function AttackPlan({ def, estimate }: { def: E.Side; estimate?: boolean }) {
  const { castle, now } = useSyncedCastle();
  if (!castle) return null;
  const best = E.bestOffense(castle, def, now);
  const chance = E.winChance(best.r);
  const o = best.shares;
  return (
    <div className={s.plan} data-slot="castle.plan">
      <p className={s.muted}>{t('castle.attackWith', { v: fmt.int(o[0]), o: fmt.int(o[1]), s: fmt.int(o[2]) })}</p>
      <p className={s.chance}>
        {estimate ? t('castle.chance.estimate', { pct: pct(chance) }) : t('castle.chance', { pct: pct(chance) })}
      </p>
    </div>
  );
}
