// The Halls (IA.md, Castle Clash): where war marks are spent. The War College's four studies, the charters
// that carry war marks back into the rest of the game (session 249), and the Reliquary's nine war relics, each forged and raised with war marks and gold, three worn at once (a
// castle's three best relics count towards its rating, worn or not; only worn ones give).
import {
  CHARTER_IDS,
  CHARTER_MARKS,
  CHARTER_PCT,
  RELIC,
  RELIC_SOCKETS,
  RELICS,
  TECH,
  TECHS,
  fmt,
  t,
  type CastleEffect,
  type CharterId,
} from '@idle-clash/content';
import { castleEngine as E } from '@idle-clash/features';
import { ActionRow, Button, ItemIcon, Panel, Pill } from '@idle-clash/ui';
import { useState } from 'react';
import { relicGives, relicName, techDoes, techName } from './labels.ts';
import { castleAct, castleRun } from './store.ts';
import { affords, lacks, useSyncedCastle } from './synced.ts';
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
      <Charters />
    </div>
  );
}

function College() {
  const { castle, now, purse, busy } = useSyncedCastle();
  if (!castle) return null;
  return (
    <section data-section>
      <Panel title={t('castle.college.title')} flush>
        <div
          data-slot="castle.college"
          className={s.college}
          data-scrollbox
          tabIndex={0}
          role="group"
          aria-label={t('castle.college.title')}
        >
          {TECHS.map((x) => {
            const cost = E.techCost(castle, x.id, now);
            const rank = castle.techs[x.id];
            return (
              <ActionRow
                key={x.id}
                iconYields
                icon={<ItemIcon name={`tech-${x.id}`} size={32} />}
                name={techName(x.id)}
                status={<Pill>{t('castle.rank', { rank: fmt.int(rank), ranks: fmt.int(TECH.RANKS) })}</Pill>}
                facts={[techDoes(x.id), ...(cost ? lacks(castle, purse, cost) : [])]}
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

/** Each charter's picture (a skill's seal it serves) and words. */
const CHARTER: Record<CharterId, { icon: string; name: string; does: string }> = {
  land: { icon: 'woodcutting', name: 'castle.charter.land', does: 'castle.charter.land.does' },
  craft: { icon: 'smithing', name: 'castle.charter.craft', does: 'castle.charter.craft.does' },
  arms: { icon: 'melee', name: 'castle.charter.arms', does: 'castle.charter.arms.does' },
};

/** The charters (session 249): war marks for lasting gains in the rest of the game, a rank at a time. */
function Charters() {
  const { castle, purse, busy } = useSyncedCastle();
  if (!castle) return null;
  return (
    // Across both columns, the three side by side where there is room (session 249: under the War College it
    // stood beside 418 px of empty page on a wide screen).
    <section data-section className={s.wide}>
      <Panel title={t('castle.charters.title')} flush>
        <div data-slot="castle.charters" className={s.charters} role="group" aria-label={t('castle.charters.title')}>
          {CHARTER_IDS.map((id) => {
            const rank = castle.charters[id];
            const marks = rank < CHARTER_MARKS.length ? CHARTER_MARKS[rank] : null;
            const now = t(CHARTER[id].does, { pct: fmt.pct(Math.max(1, rank) * CHARTER_PCT) });
            return (
              <ActionRow
                key={id}
                iconYields
                icon={<ItemIcon name={CHARTER[id].icon} size={32} />}
                name={t(CHARTER[id].name)}
                status={<Pill>{t('castle.rank', { rank: fmt.int(rank), ranks: fmt.int(CHARTER_MARKS.length) })}</Pill>}
                facts={[
                  rank > 0 ? now : t('castle.charter.aRank', { does: now }),
                  ...(marks === null ? [] : lacks(castle, purse, { gold: 0, marks })),
                ]}
                actions={
                  marks === null ? (
                    <Pill tone="moss">{t('castle.highest')}</Pill>
                  ) : (
                    <Button
                      disabled={busy || castle.warMarks < marks}
                      onClick={() => void castleAct({ type: 'charter', charter: id })}
                    >
                      {t('castle.charter.raise', { marks: fmt.int(marks) })}
                    </Button>
                  )
                }
              />
            );
          })}
        </div>
        <p className={s.note}>{t('castle.charters.note')}</p>
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
        <div
          data-slot="castle.relics"
          className={s.relics}
          data-scrollbox
          tabIndex={0}
          role="group"
          aria-label={t('castle.reliquary.title')}
        >
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
  // A temper that did not take is said on its row until the next try.
  const [held, setHeld] = useState(false);
  if (!castle) return null;
  const worn = castle.equippedRelics;
  const wear = (relics: string[]) => void castleAct({ type: 'equipRelics', relics });
  const relic = RELICS.find((r) => r.id === id)!;
  const level = Object.hasOwn(castle.relics, id) ? castle.relics[id] : 0;
  const tempers = E.temperOf(castle, id);
  const mult = E.temperMult(tempers);
  const cost = E.relicCost(castle, id);
  const temper = E.temperCost(castle, id);
  const isWorn = worn.includes(id);
  // What the next forge or temper lacks, and why a forged relic cannot be put on (session 126).
  const next = cost ?? temper;
  const full = level > 0 && !isWorn && worn.length >= RELIC_SOCKETS;
  const levelText = t('castle.relic.level', { level: fmt.int(level), levels: fmt.int(RELIC.LEVELS) });
  const tryTemper = async () => {
    setHeld(false);
    const r = await castleRun({ type: 'temperRelic', relic: id });
    setHeld(r?.ok === true && r.outcome === 'held');
  };
  return (
    <ActionRow
      iconYields
      wide
      icon={<ItemIcon name={id} size={32} silhouette={level === 0} />}
      name={relicName(id)}
      status={
        level ? (
          <Pill tone={isWorn ? 'moss' : undefined}>{isWorn ? t('castle.relic.worn') : levelText}</Pill>
        ) : (
          <Pill>{t('castle.relic.unforged')}</Pill>
        )
      }
      facts={[
        gives(relic.perLevel, Math.max(1, level) * mult),
        ...(isWorn ? [levelText] : []),
        ...(tempers > 0
          ? [t('castle.relic.tempers', { tempers: fmt.int(tempers), pct: fmt.pct(Math.round((mult - 1) * 100)) })]
          : []),
        ...(temper ? [t('castle.temper.cost', { gold: fmt.short(temper.gold), marks: fmt.int(temper.marks) })] : []),
        ...(held ? [t('castle.temper.held')] : []),
        ...(full ? [t('castle.relic.socketsFull', { sockets: fmt.int(RELIC_SOCKETS) })] : []),
        ...(next ? lacks(castle, purse, next) : []),
      ]}
      foot={
        level === 0 ? undefined : isWorn ? (
          <Button variant="quiet" disabled={busy} onClick={() => wear(worn.filter((x) => x !== id))}>
            {t('castle.relic.remove')}
          </Button>
        ) : (
          <Button variant="quiet" disabled={busy || worn.length >= RELIC_SOCKETS} onClick={() => wear([...worn, id])}>
            {t('castle.relic.wear')}
          </Button>
        )
      }
      actions={
        <>
          {cost ? (
            <Button
              disabled={busy || castle.warMarks < cost.marks || !affords(castle, purse, cost.gold)}
              onClick={() => void castleAct({ type: 'forgeRelic', relic: id })}
            >
              {t(level === 0 ? 'castle.relic.forge' : 'castle.relic.levelUp', {
                gold: fmt.short(cost.gold),
                marks: fmt.int(cost.marks),
              })}
            </Button>
          ) : temper ? (
            <Button
              disabled={busy || castle.warMarks < temper.marks || !affords(castle, purse, temper.gold)}
              onClick={() => void tryTemper()}
            >
              {t('castle.temper', { pct: fmt.chance(E.temperChance(tempers)) })}
            </Button>
          ) : (
            <Pill tone="moss">{t('castle.highest')}</Pill>
          )}
        </>
      }
    />
  );
}
