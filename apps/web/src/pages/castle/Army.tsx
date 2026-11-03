// The Garrison (IA.md, Castle Clash): the three troops, each raised with gold and drilled with AP (once,
// or five times at a press), their wounds and healing; beside them the formations, the trap and the
// castellan (Formation.tsx). The War College is in the Halls, beside the Reliquary.
import { EVOLUTION_LEVELS, ECONOMY, SINKS, UNITS, fmt, t } from '@idle-clash/content';
import { castleEngine as E } from '@idle-clash/features';
import { ActionRow, Button, ItemIcon, Panel, Pill } from '@idle-clash/ui';
import { Defences, Formations } from './Formation.tsx';
import { evolutionName, unitName } from './labels.ts';
import { castleAct } from './store.ts';
import { affords, hasAp, useSyncedCastle } from './synced.ts';
import s from './castle.module.css';

/** Drills at one press, for AP saved up. */
const DRILL_MANY = 5;

export function Army() {
  return (
    <div className={s.grid}>
      <div className={s.column}>
        <Troops />
      </div>
      <div className={s.column}>
        <Formations />
        <Defences />
      </div>
    </div>
  );
}

function Troops() {
  const { castle, now, purse, busy } = useSyncedCastle();
  if (!castle) return null;
  const heal = E.instantCost(castle, castle.infirmaryPct, now);
  return (
    <section data-section>
      <Panel title={t('castle.units.title')} flush>
        <div data-slot="castle.units" className={s.relics} data-scrollbox>
          {UNITS.map((u) => {
            const level = castle.levels[u.id];
            const stage = E.evolutionOf(level);
            const next = stage + 1 < EVOLUTION_LEVELS.length ? stage + 1 : null;
            const cost = E.levelCost(castle, u.cost, level, now);
            const drillPct = E.drillPct(castle.drillXp[u.id]);
            return (
              <ActionRow
                key={u.id}
                iconYields
                icon={<ItemIcon name={u.evolutions[stage]} size={32} />}
                name={evolutionName(u.evolutions[stage])}
                status={<Pill>{t('castle.level', { level: fmt.int(level) })}</Pill>}
                facts={[
                  unitName(u.id),
                  t('castle.drilled', { pct: fmt.pct(Math.round(drillPct * 10) / 10) }),
                  ...(next === null
                    ? []
                    : [
                        t('castle.unit.next', {
                          name: evolutionName(u.evolutions[next]),
                          level: fmt.int(EVOLUTION_LEVELS[next]),
                        }),
                      ]),
                ]}
                progress={
                  <div className={s.drills}>
                    <Button
                      variant="quiet"
                      disabled={busy || !hasAp(castle, SINKS.DRILL_AP)}
                      onClick={() => void castleAct({ type: 'drill', unit: u.id, times: 1 })}
                    >
                      {t('castle.drill', { ap: fmt.int(SINKS.DRILL_AP) })}
                    </Button>
                    <Button
                      variant="quiet"
                      disabled={busy || !hasAp(castle, SINKS.DRILL_AP * DRILL_MANY)}
                      onClick={() => void castleAct({ type: 'drill', unit: u.id, times: DRILL_MANY })}
                    >
                      {t('castle.drillMany', { times: fmt.int(DRILL_MANY) })}
                    </Button>
                  </div>
                }
                actions={
                  <>
                    {level >= ECONOMY.MAX_LEVEL ? (
                      <Pill tone="moss">{t('castle.highest')}</Pill>
                    ) : (
                      <Button
                        disabled={busy || !affords(castle, purse, cost)}
                        onClick={() => void castleAct({ type: 'upgrade', id: u.id })}
                      >
                        {t('castle.raiseFor', { gold: fmt.short(cost) })}
                      </Button>
                    )}
                  </>
                }
              />
            );
          })}
        </div>
        {castle.infirmaryPct > 0.01 && (
          <div className={s.note}>
            <div className={s.save}>
              <span>{t('castle.wounds', { pct: fmt.pct(Math.ceil(castle.infirmaryPct)) })}</span>
              <Button
                variant="quiet"
                disabled={busy || !hasAp(castle, heal.ap) || !affords(castle, purse, heal.gold)}
                onClick={() => void castleAct({ type: 'mend', what: 'wounds' })}
              >
                {t('castle.heal', { gold: fmt.short(heal.gold), ap: fmt.int(heal.ap) })}
              </Button>
            </div>
          </div>
        )}
      </Panel>
    </section>
  );
}
