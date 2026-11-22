// The fortress at your tier on the War (session 40; its own file since session 167): its garrison and trap,
// the chance in the formation set against it (counting the spies' work on it), what taking it gives,
// Assault, and Send spies.
import { SINKS, fmt, t } from '@idle-clash/content';
import { castleEngine as E } from '@idle-clash/features';
import { Button, Panel, Pill } from '@idle-clash/ui';
import { navigate } from '../../router.ts';
import { Fought } from './Fought.tsx';
import { opsLines, spiesWouldTake } from './FoeSpies.tsx';
import { FoeCard } from './FoeCard.tsx';
import { allAt, fieldFor, hostOf } from './hosts.ts';
import { fortressName } from './labels.ts';
import { fight } from './store.ts';
import { hasAp, useSyncedCastle } from './synced.ts';
import { heldByWounds, pct, sheetOf } from './targets.ts';
import w from './war.module.css';

/** A foe beyond reach while the lord's troops are wounded, and healing would bring it back (session 145). */
export const woundedWords = (castle: E.Castle) =>
  t('castle.target.beyondWounded', { pct: fmt.int(castle.infirmaryPct) });

/** The fortress at a castle's tier as it stands, with the spies' work on it (session 167). */
export const fortressNow = (castle: E.Castle, now: number): E.Side =>
  E.fortressSide(castle.incursionTier, E.foeOps(castle, E.fortressKey(castle.incursionTier), now));

/** The fortress at a castle's tier: the formation set against it, its chance, and whether any roll takes
 *  it (session 139: one beyond every roll offered Assault beside "0% to win"). */
export function fortressOdds(castle: E.Castle, now: number) {
  const best = E.bestOffense(castle, fortressNow(castle, now), now);
  const chance = E.winChance(best.r);
  return { best, chance, beyond: chance === 0 };
}

/** The fortress at your tier: its garrison and trap, the chance in the formation set against it (or that it
 *  is beyond you for now), what taking it gives, and Assault. */
export function Fortress() {
  const { castle, now, busy } = useSyncedCastle();
  if (!castle) return null;
  const tier = castle.incursionTier;
  const fortress = E.fortressAt(tier);
  const { best, chance, beyond } = fortressOdds(castle, now);
  const marks = Math.round(
    (SINKS.INCURSION_MARKS_BASE + Math.floor(tier / 2)) * E.lift(E.modifiers(castle, now).marks),
  );
  return (
    <section data-section>
      <Panel
        title={t('castle.incursion.title')}
        aside={<Pill tone="woad">{t('castle.incursion.tier', { tier: fmt.int(tier) })}</Pill>}
        flush
      >
        <div data-slot="castle.incursion" className={w.list}>
          <FoeCard
            crest={fortress.id}
            name={fortressName(fortress.id)}
            host={hostOf(fortressNow(castle, now).shares, allAt(tier))}
            chance={beyond ? null : chance}
            odds={
              beyond
                ? heldByWounds(castle, fortressNow(castle, now), now)
                  ? woundedWords(castle)
                  : spiesWouldTake(castle, (ops) => E.fortressSide(tier, ops), now)
                    ? t('castle.incursion.spies')
                    : t('castle.incursion.beyond')
                : t('castle.target.chance', { pct: pct(chance) })
            }
            facts={[
              t('castle.incursion.rewards', { marks: fmt.int(marks) }),
              ...opsLines(castle, E.fortressKey(tier), now),
            ]}
            fought={<Fought battle="incursion" />}
            quiet={
              <Button variant="quiet" onClick={() => navigate(sheetOf(E.fortressKey(tier)))}>
                {t('castle.target.spies.open')}
              </Button>
            }
            attack={
              <Button
                variant="primary"
                disabled={busy || beyond || !hasAp(castle, SINKS.INCURSION_AP)}
                onClick={() =>
                  void fight(
                    'incursion',
                    { type: 'incursion', shares: [...best.shares] },
                    fieldFor(castle, best.shares, fortressNow(castle, now), tier, fortress.id),
                  )
                }
              >
                {t('castle.incursion.assault', { ap: fmt.int(SINKS.INCURSION_AP) })}
              </Button>
            }
          />
        </div>
      </Panel>
    </section>
  );
}
