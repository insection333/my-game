// The fortress's sheet (session 167, `?panel=target&target=fortress:<tier>`): its garrison and trap, the
// spies to send against it (its wells, its gatehouse, its orders), the attack as it will go counting their
// work, and Assault, which closes the sheet so the battle's result lands on the fortress's row.
import { SINKS, fmt, t } from '@idle-clash/content';
import { castleEngine as E } from '@idle-clash/features';
import { Button, ItemIcon, Pill, Sheet } from '@idle-clash/ui';
import { FoeMissions } from './FoeSpies.tsx';
import { fieldFor } from './hosts.ts';
import { fortressNow, fortressOdds } from './Fortress.tsx';
import { garrisonWords } from './labels.ts';
import { AttackPlan } from './Plan.tsx';
import { fight } from './store.ts';
import { hasAp, useSyncedCastle } from './synced.ts';
import type { Target } from './targets.ts';
import s from './castle.module.css';

export function FortressSheet({ target, onClose }: { target: Target; onClose: () => void }) {
  const { castle, now, busy, refused } = useSyncedCastle();
  if (!castle || !target.fortress) return null;
  const tier = target.fortress;
  const fortress = E.fortressAt(tier);
  const { best, beyond } = fortressOdds(castle, now);
  return (
    <Sheet title={target.name} closeLabel={t('shell.close')} onClose={onClose} slot="castle.target">
      <div className={s.sheet}>
        <div className={s.arms}>
          <ItemIcon name="crest" crest={fortress.id} size={48} />
          <div className={s.pills}>
            <Pill tone="woad">{t('castle.incursion.tier', { tier: fmt.int(tier) })}</Pill>
          </div>
        </div>
        {refused && (
          <p className={s.refused} role="status">
            {refused}
          </p>
        )}
        <FoeMissions foe={target.id} level={tier} />
        <div className={s.sheetSection}>
          <h3>{t('castle.incursion.title')}</h3>
          <p>{garrisonWords(fortress.garrison, fortress.trap)}</p>
          <AttackPlan def={fortressNow(castle, now)} foe={{ level: tier, crest: fortress.id }} />
          <div className={s.save}>
            <Button
              variant="primary"
              disabled={busy || beyond || !hasAp(castle, SINKS.INCURSION_AP)}
              onClick={() => {
                onClose();
                void fight(
                  'incursion',
                  { type: 'incursion', shares: [...best.shares] },
                  fieldFor(castle, best.shares, fortressNow(castle, now), tier, fortress.id),
                );
              }}
            >
              {t('castle.incursion.assault', { ap: fmt.int(SINKS.INCURSION_AP) })}
            </Button>
          </div>
        </div>
      </div>
    </Sheet>
  );
}
