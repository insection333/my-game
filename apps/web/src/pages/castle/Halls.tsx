// The Halls (IA.md, Castle Clash): where war marks are spent. The War College's four studies, and the
// Reliquary's nine war relics, each forged and raised with war marks and gold, three worn at once (a
// castle's three best relics count towards its rating, worn or not; only worn ones give).
import { RELIC, RELIC_SOCKETS, RELICS, TECH, TECHS, fmt, t, type CastleEffect } from '@idle-clash/content';
import { castleEngine as E } from '@idle-clash/features';
import { ActionRow, Button, Panel, Pill } from '@idle-clash/ui';
import { relicGives, relicName, techDoes, techName } from './labels.ts';
import { castleAct } from './store.ts';
import { affords, useSyncedCastle } from './synced.ts';
import s from './castle.module.css';

/** What a relic gives at a level, in words. */
function gives(effect: CastleEffect, level: number): string {
  const pct = 'share' in effect ? effect.share * 100 * level : 'pct' in effect ? effect.pct * level : 0;
  return relicGives(effect.kind, { pct: fmt.pct(Math.round(pct * 10) / 10) });
}

export function Halls() {
  return (
    <div className={s.grid}>
      <College />
      <Reliquary />
    </div>
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

function Reliquary() {
  const { castle } = useSyncedCastle();
  if (!castle) return null;
  return (
    <section data-section>
      <Panel
        title={t('castle.reliquary.title')}
        aside={
          <Pill tone="gold">
            {t('castle.reliquary.sockets', {
              worn: fmt.int(castle.equippedRelics.length),
              sockets: fmt.int(RELIC_SOCKETS),
            })}
          </Pill>
        }
        flush
      >
        <div data-slot="castle.relics" className={s.relics} data-scrollbox>
          {RELICS.map((r) => (
            <Relic key={r.id} id={r.id} />
          ))}
        </div>
      </Panel>
    </section>
  );
}

function Relic({ id }: { id: string }) {
  const { castle, purse, busy } = useSyncedCastle();
  if (!castle) return null;
  const worn = castle.equippedRelics;
  const wear = (relics: string[]) => void castleAct({ type: 'equipRelics', relics });
  const relic = RELICS.find((r) => r.id === id)!;
  const level = Object.hasOwn(castle.relics, id) ? castle.relics[id] : 0;
  const cost = E.relicCost(castle, id);
  const isWorn = worn.includes(id);
  const levelText = t('castle.relic.level', { level: fmt.int(level), levels: fmt.int(RELIC.LEVELS) });
  return (
    <ActionRow
      name={relicName(id)}
      status={
        level ? (
          <Pill tone={isWorn ? 'moss' : undefined}>{isWorn ? t('castle.relic.worn') : levelText}</Pill>
        ) : (
          <Pill>{t('castle.relic.unforged')}</Pill>
        )
      }
      facts={[gives(relic.perLevel, Math.max(1, level)), ...(isWorn ? [levelText] : [])]}
      actions={
        <>
          {level > 0 &&
            (isWorn ? (
              <Button variant="quiet" disabled={busy} onClick={() => wear(worn.filter((x) => x !== id))}>
                {t('castle.relic.remove')}
              </Button>
            ) : (
              <Button
                variant="quiet"
                disabled={busy || worn.length >= RELIC_SOCKETS}
                onClick={() => wear([...worn, id])}
              >
                {t('castle.relic.wear')}
              </Button>
            ))}
          {cost ? (
            <Button
              disabled={busy || castle.warMarks < cost.marks || !affords(castle, purse, cost.gold)}
              onClick={() => void castleAct({ type: 'forgeRelic', relic: id })}
            >
              {t('castle.relic.forge', { gold: fmt.short(cost.gold), marks: fmt.int(cost.marks) })}
            </Button>
          ) : (
            <Pill tone="moss">{t('castle.highest')}</Pill>
          )}
        </>
      }
    />
  );
}
