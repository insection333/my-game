// The Garrison (IA.md, Castle Clash): the three troops, each raised with gold and drilled with AP (once,
// or five times at a press), their wounds and healing; beside them the formations, the trap and the
// castellan (Formation.tsx). The War College is in the Halls, beside the Reliquary.
import { EVOLUTION_LEVELS, ECONOMY, SINKS, UNITS, fmt, t } from '@idle-clash/content';
import { castleEngine as E } from '@idle-clash/features';
import { ActionRow, ItemIcon, Panel, Pill } from '@idle-clash/ui';
import { Defences, Formations } from './Formation.tsx';
import { LevelUp, Mend, Steps } from './Steps.tsx';
import { evolutionName, unitName } from './labels.ts';
import { castleAct } from './store.ts';
import { hasAp, shortText, useSyncedCastle } from './synced.ts';
import s from './castle.module.css';

/** Trainings at one press, for AP saved up. */
const TRAIN_MANY = 5;

export function Army() {
  return (
    <div className={s.grid}>
      {/* The troops and the castellan who leads them on one side, how they stand on the other: the
          formations and the trap (session 133), so the columns run alike. */}
      <div className={s.column}>
        <Troops />
        <Defences part="castellan" />
      </div>
      <div className={s.column}>
        <Formations />
        <Defences part="trap" />
      </div>
    </div>
  );
}

function Troops() {
  const { castle, now, purse, busy } = useSyncedCastle();
  if (!castle) return null;
  return (
    <section data-section>
      <Panel title={t('castle.units.title')} flush>
        <div
          data-slot="castle.units"
          className={s.relics}
          data-scrollbox
          tabIndex={0}
          role="group"
          aria-label={t('castle.units.title')}
        >
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
                  ...(level < ECONOMY.MAX_LEVEL ? [shortText(castle, purse, cost)].filter((x) => x !== null) : []),
                ]}
                foot={
                  <>
                    <LevelUp id={u.id} />
                    <Steps
                      label={t('castle.train.label')}
                      steps={[1, TRAIN_MANY].map((more) => ({
                        text: t('castle.step.ap', { more: fmt.int(more), ap: fmt.int(SINKS.DRILL_AP * more) }),
                        name: t('castle.train', { more: fmt.int(more), ap: fmt.int(SINKS.DRILL_AP * more) }),
                        disabled: busy || !hasAp(castle, SINKS.DRILL_AP * more),
                        onPress: () => void castleAct({ type: 'drill', unit: u.id, times: more }),
                      }))}
                    />
                  </>
                }
              />
            );
          })}
        </div>
        {castle.infirmaryPct > 0.01 && (
          <div className={s.note}>
            <span>
              {t('castle.wounds', {
                pct: fmt.pct(Math.ceil(castle.infirmaryPct)),
                rate: fmt.pct(E.recoveryPerHour(castle, now)),
              })}
            </span>
            <Mend what="wounds" points={castle.infirmaryPct} />
          </div>
        )}
      </Panel>
    </section>
  );
}
