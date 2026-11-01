// The attack, planned where it is made (a target's sheet, an incursion): the formation the castle attacks
// in, its chance to win, and Set against them, which changes the attack formation to the one that does
// best against the garrison known (the engine's own reckoning, castleEngine.bestOffense).
import { fmt, t } from '@idle-clash/content';
import { castleEngine as E } from '@idle-clash/features';
import { Button } from '@idle-clash/ui';
import { castleAct } from './store.ts';
import { useSyncedCastle } from './synced.ts';
import s from './castle.module.css';

const pct = (p: number) => fmt.pct(Math.round(p * 100));

/** `estimate`: the defence is reckoned from a rating and a scouting, so the chance is said as about. */
export function AttackPlan({ def, estimate }: { def: E.Side; estimate?: boolean }) {
  const { castle, now, busy } = useSyncedCastle();
  if (!castle) return null;
  const r = E.oddsWith(castle, castle.offense, def, now);
  const best = E.bestOffense(castle, def, now);
  const chance = E.winChance(r);
  const o = castle.offense;
  return (
    <div className={s.plan} data-slot="castle.plan">
      <p className={s.muted}>{t('castle.attackWith', { v: fmt.int(o[0]), o: fmt.int(o[1]), s: fmt.int(o[2]) })}</p>
      <p className={s.chance}>
        {estimate ? t('castle.chance.estimate', { pct: pct(chance) }) : t('castle.chance', { pct: pct(chance) })}
      </p>
      {/* Offered only when it changes the chance; at a sure win, nothing needs setting. */}
      {chance >= 0.995 ? null : E.winChance(best.r) >= chance + 0.01 ? (
        <Button
          variant="quiet"
          disabled={busy}
          onClick={() => void castleAct({ type: 'offense', shares: [...best.shares] as [number, number, number] })}
        >
          {t('castle.counter', { pct: pct(E.winChance(best.r)) })}
        </Button>
      ) : (
        <p className={s.muted}>{t('castle.counter.best')}</p>
      )}
    </div>
  );
}
