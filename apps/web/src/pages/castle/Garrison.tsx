// The Garrison (IA.md, Castle Clash): the three troops, each raised with gold and drilled with AP, their
// wounds and healing, and the War College; beside them the formations, the trap and the castellan
// (Formation.tsx).
import { EVOLUTION_LEVELS, ECONOMY, SINKS, TECH, TECHS, UNITS, fmt, t } from '@idle-clash/content';
import { castleEngine as E } from '@idle-clash/features';
import { ActionRow, Button, Panel, Pill } from '@idle-clash/ui';
import { Defences, Formations } from './Formation.tsx';
import { evolutionName, techDoes, techName, unitName } from './labels.ts';
import { castleAct } from './store.ts';
import { affords, hasAp, useSyncedCastle } from './synced.ts';
import s from './castle.module.css';

export function Garrison() {
  return (
    <div className={s.grid}>
      <div className={s.column}>
        <Troops />
        <College />
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
        <div data-slot="castle.units">
          {UNITS.map((u) => {
            const level = castle.levels[u.id];
            const stage = E.evolutionOf(level);
            const next = stage + 1 < EVOLUTION_LEVELS.length ? stage + 1 : null;
            const cost = E.levelCost(castle, u.cost, level, now);
            const drillPct = E.drillPct(castle.drillXp[u.id]);
            return (
              <ActionRow
                key={u.id}
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
                actions={
                  <>
                    <Button
                      variant="quiet"
                      disabled={busy || !hasAp(castle, SINKS.DRILL_AP)}
                      onClick={() => void castleAct({ type: 'drill', unit: u.id, times: 1 })}
                    >
                      {t('castle.drill', { ap: fmt.int(SINKS.DRILL_AP) })}
                    </Button>
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

function College() {
  const { castle, now, purse, busy } = useSyncedCastle();
  if (!castle) return null;
  return (
    <section data-section>
      <Panel title={t('castle.college.title')} flush>
        <div data-slot="castle.college" className={s.college} data-scrollbox>
          {TECHS.map((x) => {
            const cost = E.techCost(castle, x.id, now);
            const rank = castle.techs[x.id];
            return (
              <ActionRow
                key={x.id}
                name={techName(x.id)}
                status={<Pill>{t('castle.rank', { rank: fmt.int(rank), ranks: fmt.int(TECH.RANKS) })}</Pill>}
                facts={[techDoes(x.id)]}
                actions={
                  cost ? (
                    <Button
                      disabled={busy || castle.warMarks < cost.marks || !affords(castle, purse, cost.gold)}
                      onClick={() => void castleAct({ type: 'research', tech: x.id })}
                    >
                      {t('castle.study', { gold: fmt.short(cost.gold), marks: fmt.int(cost.marks) })}
                    </Button>
                  ) : (
                    <Pill tone="moss">{t('castle.highest')}</Pill>
                  )
                }
              />
            );
          })}
        </div>
      </Panel>
    </section>
  );
}
