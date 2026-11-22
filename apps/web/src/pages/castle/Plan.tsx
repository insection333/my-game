// The attack as it will go (a target's sheet): since session 40 every attack on a known foe goes in the
// formation that does best against them (the engine's own reckoning, castleEngine.bestOffense), so the
// plan is that formation and its chance to win; nothing to set first. Since session 168 the two hosts are
// drawn as they will meet.
import { fmt, t } from '@idle-clash/content';
import { castleEngine as E } from '@idle-clash/features';
import { Battlefield } from './Battlefield.tsx';
import { fieldFor } from './hosts.ts';
import { useSyncedCastle } from './synced.ts';
import s from './castle.module.css';

const pct = (p: number) => fmt.chance(p);

/** `estimate`: the defence is reckoned from a rating and a scouting, so the chance is said as about. */
export function AttackPlan({
  def,
  estimate,
  foe,
}: {
  def: E.Side;
  estimate?: boolean;
  /** The foe's level and arms, to draw the two hosts as they will meet (session 168). */
  foe?: { level: number; crest: string };
}) {
  const { castle, now } = useSyncedCastle();
  if (!castle) return null;
  const best = E.bestOffense(castle, def, now);
  const chance = E.winChance(best.r);
  const o = best.shares;
  return (
    <div className={s.plan} data-slot="castle.plan">
      {foe && <Battlefield {...fieldFor(castle, o, def, foe.level, foe.crest)} won={null} />}
      <p className={s.muted}>{t('castle.attackWith', { v: fmt.int(o[0]), o: fmt.int(o[1]), s: fmt.int(o[2]) })}</p>
      <p className={s.chance}>
        {estimate ? t('castle.chance.estimate', { pct: pct(chance) }) : t('castle.chance', { pct: pct(chance) })}
      </p>
    </div>
  );
}
