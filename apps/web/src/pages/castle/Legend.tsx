// The season's legendary siege on the War (session 220): its next chamber of eight as a card (one opening each week, session 222), with its garrison
// and trap (the season's own, the same for everyone), the chance in the formation set against it, what it pays,
// Assault and Send spies; and its sheet, with the spies' three missions and the attack as it will go. Taken, a
// line says so until the season turns.
import { fmt, t } from '@idle-clash/content';
import { castleEngine as E, seasonAt } from '@idle-clash/features';
import { Button, ItemIcon, Panel, Pill, Sheet } from '@idle-clash/ui';
import { navigate } from '../../router.ts';
import { FoeCard } from './FoeCard.tsx';
import { FoeMissions, opsLines, spiesWouldTake } from './FoeSpies.tsx';
import { Fought } from './Fought.tsx';
import { allAt, fieldFor, hostOf } from './hosts.ts';
import { garrisonWords } from './labels.ts';
import { AttackPlan } from './Plan.tsx';
import { fight } from './store.ts';
import { hasAp, useSyncedCastle } from './synced.ts';
import { pct, sheetOf } from './targets.ts';
import s from './castle.module.css';
import w from './war.module.css';

/** The season's next chamber as it stands, and the attack set against it. */
export function legendNow(castle: E.Castle, now: number) {
  const season = seasonAt(now)?.number ?? 0;
  const next = season ? E.nextChamber(castle, season, now) : null;
  if (!next) return null;
  const best = E.bestOffense(castle, next.side, now);
  const chance = E.winChance(best.r);
  return {
    season,
    ...next,
    best,
    chance,
    key: E.chamberKey(season, next.chamber.n),
    name: E.legendName(E.legendOf(season)),
  };
}

const assault = (castle: E.Castle, l: NonNullable<ReturnType<typeof legendNow>>) =>
  void fight(
    'legend',
    { type: 'legend', shares: [...l.best.shares] },
    fieldFor(castle, l.best.shares, l.side, l.chamber.level, E.legendOf(l.season)),
  );

export function Legend() {
  const { castle, now, busy } = useSyncedCastle();
  const season = seasonAt(now)?.number ?? 0;
  if (!castle || !season || castle.incursionTier < E.LEGEND.OPENS_AT_TIER) return null;
  const name = E.legendName(E.legendOf(season));
  const l = legendNow(castle, now);
  const marks = l ? Math.round(E.LEGEND.MARKS * (l.chamber.n + 1) * E.lift(E.modifiers(castle, now).marks)) : 0;
  const beyond = l !== null && l.chance === 0;
  // A chamber opens each week (session 222): until its week, said and closed.
  const waiting = l !== null && l.opens > now;
  return (
    <section data-section>
      <Panel
        title={t('castle.legend.title')}
        aside={
          <Pill tone={l ? 'woad' : 'moss'}>
            {l
              ? t('castle.legend.of', { n: fmt.int(l.chamber.n + 1), of: fmt.int(E.LEGEND.CHAMBERS) })
              : t('castle.legend.done')}
          </Pill>
        }
        flush
      >
        <div data-slot="castle.legend" className={w.list}>
          {!l ? (
            <p className={s.muted}>{t('castle.legend.takenLine', { legend: name })}</p>
          ) : (
            <FoeCard
              crest={E.legendOf(season)}
              name={t('castle.legend.chamberName', { legend: name, n: fmt.int(l.chamber.n + 1) })}
              host={hostOf(l.side.shares, allAt(l.chamber.level))}
              chance={beyond ? null : l.chance}
              odds={
                beyond
                  ? spiesWouldTake(castle, (ops) => E.chamberSide(l.chamber, ops), now)
                    ? t('castle.incursion.spies')
                    : t('castle.incursion.beyond')
                  : t('castle.target.chance', { pct: pct(l.chance) })
              }
              facts={[
                garrisonWords(l.chamber.garrison, l.chamber.trap),
                t('castle.legend.pays', { marks: fmt.int(marks) }),
                ...(waiting ? [t('castle.legend.opens', { when: fmt.when(l.opens, now) })] : []),
                ...opsLines(castle, l.key, now),
              ]}
              fought={<Fought battle="legend" />}
              quiet={
                waiting ? undefined : (
                  <Button variant="quiet" onClick={() => navigate(sheetOf(l.key))}>
                    {t('castle.target.spies.open')}
                  </Button>
                )
              }
              attack={
                <Button
                  variant="primary"
                  disabled={busy || beyond || waiting || !hasAp(castle, E.LEGEND.AP)}
                  onClick={() => assault(castle, l)}
                >
                  {t('castle.incursion.assault', { ap: fmt.int(E.LEGEND.AP) })}
                </Button>
              }
            />
          )}
        </div>
      </Panel>
    </section>
  );
}

/** The chamber's sheet (`?panel=target&target=legend:<season>:<n>`): the spies' missions and the attack. */
export function LegendSheet({ onClose }: { onClose: () => void }) {
  const { castle, now, busy, refused } = useSyncedCastle();
  const l = castle ? legendNow(castle, now) : null;
  if (!castle || !l) return null;
  return (
    <Sheet
      title={t('castle.legend.chamberName', { legend: l.name, n: fmt.int(l.chamber.n + 1) })}
      closeLabel={t('shell.close')}
      onClose={onClose}
      slot="castle.target"
    >
      <div className={s.sheet}>
        <div className={s.arms}>
          <ItemIcon name="crest" crest={E.legendOf(l.season)} size={48} />
          <div className={s.pills}>
            <Pill tone="woad">
              {t('castle.legend.of', { n: fmt.int(l.chamber.n + 1), of: fmt.int(E.LEGEND.CHAMBERS) })}
            </Pill>
          </div>
        </div>
        {refused && (
          <p className={s.refused} data-said>
            {refused}
          </p>
        )}
        <p className={s.muted}>{t('castle.legend.note')}</p>
        {l.opens > now ? (
          <p>{t('castle.legend.opens', { when: fmt.when(l.opens, now) })}</p>
        ) : (
          <FoeMissions foe={l.key} level={l.chamber.level} />
        )}
        <div className={s.sheetSection}>
          <h3>{t('castle.legend.title')}</h3>
          <p>{garrisonWords(l.chamber.garrison, l.chamber.trap)}</p>
          <AttackPlan def={l.side} foe={{ level: l.chamber.level, crest: E.legendOf(l.season) }} />
          <div className={s.save}>
            <Button
              variant="primary"
              disabled={busy || l.chance === 0 || l.opens > now || !hasAp(castle, E.LEGEND.AP)}
              onClick={() => {
                onClose();
                assault(castle, l);
              }}
            >
              {t('castle.incursion.assault', { ap: fmt.int(E.LEGEND.AP) })}
            </Button>
          </div>
        </div>
      </div>
    </Sheet>
  );
}
