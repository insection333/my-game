// One target on the War (session 38; its own file since session 167): a stronghold or a lord, with its
// chance (in the formation set against it, where it is known, counting the spies' work on it), what it
// pays, how it stands today, and its button; a lord not yet scouted offers Scout. A stronghold's and a
// lord's foot opens their sheet: the spies, and for a lord the full plan.
import { dayTurns, SPY_MISSIONS, fmt, t } from '@idle-clash/content';
import { castleEngine as E } from '@idle-clash/features';
import { ActionRow, Button, ItemIcon, Pill } from '@idle-clash/ui';
import { navigate } from '../../router.ts';
import { Fought } from './Fought.tsx';
import { opsLines } from './FoeSpies.tsx';
import { woundedWords } from './Fortress.tsx';
import { garrisonWords } from './labels.ts';
import { when } from './Reports.tsx';
import { castleRun, fight } from './store.ts';
import { affords, hasAp, useSyncedCastle } from './synced.ts';
import {
  defenceOf,
  heldByWounds,
  outOfReach,
  paysLine,
  pct,
  sheetOf,
  spiesWouldTip,
  standingOf,
  type Target,
} from './targets.ts';

/** One target: a stronghold or a lord, with its chance (in the formation set against it, where it is
 *  known), what it pays, how it stands today, and its button; a lord not yet scouted offers Scout. */
export function TargetRow({ target }: { target: Target }) {
  const { castle, view, now, purse, busy } = useSyncedCastle();
  if (!castle) return null;
  const logs = view?.logs ?? [];
  const standing = standingOf(castle, target, now);
  const done = standing && standing.kind !== 'once';
  const def = defenceOf(castle, target, logs, now);
  const best = def ? E.bestOffense(castle, def, now) : null;
  const chance = best ? E.winChance(best.r) : null;
  const beyond = outOfReach(target, chance);
  const costs = target.merc
    ? E.mercenaryCosts(castle, target.merc, now)
    : E.siegeCosts(castle, E.brRatio(castle, { rating: target.rating }), now);
  const scout = SPY_MISSIONS.find((m) => m.id === 'scout')!;
  const scoutCost = E.spyCosts(castle, { ...castle, userId: target.id, rating: target.rating }, scout, now);
  const shares = best ? ([...best.shares] as [number, number, number]) : undefined;
  const attack = () => void fight(target.id, { type: 'siege', target: target.id, ...(shares ? { shares } : {}) });
  const taken = Math.max(0, ...E.pairOf(castle, target.id, now).sieges);
  return (
    <ActionRow
      iconYields
      wide
      icon={<ItemIcon name="crest" crest={target.id} size={32} />}
      name={target.name}
      status={
        <>
          <Pill tone={target.merc ? undefined : 'woad'}>
            {t('castle.target.rating', { rating: fmt.int(target.rating) })}
          </Pill>
          {target.struck !== null && (
            <Pill tone="ember">{t('castle.target.struckAt', { when: when(target.struck, now) })}</Pill>
          )}
          {done && <Pill tone={standing.kind === 'fallen' ? 'moss' : undefined}>{standing.text}</Pill>}
        </>
      }
      facts={
        standing?.kind === 'fallen'
          ? [t('castle.target.fellAt', { when: when(taken, now), back: dayTurns(now) })]
          : [
              chance === null
                ? t('castle.target.unscouted')
                : beyond
                  ? def && heldByWounds(castle, def, now)
                    ? woundedWords(castle)
                    : t('castle.target.beyond')
                  : target.merc
                    ? t('castle.target.chance', { pct: pct(chance) })
                    : t('castle.target.chanceAbout', { pct: pct(chance) }),
              ...(target.merc ? [garrisonWords(target.merc.garrison, target.merc.trap)] : []),
              // The spies' work on a stronghold, each until when (session 167).
              ...(target.merc ? opsLines(castle, target.id, now) : []),
              ...(spiesWouldTip(target, chance) ? [t('castle.target.spies')] : []),
              paysLine(castle, target, view?.warChest ?? 0, logs, now),
              ...(standing?.kind === 'once' ? [standing.text] : []),
            ]
      }
      progress={<Fought battle={target.id} />}
      foot={
        done ? undefined : (
          <Button variant="quiet" onClick={() => navigate(sheetOf(target.id))}>
            {/* A stronghold's sheet holds its spies (session 167); a lord's, the full plan and spies. */}
            {t(target.merc ? 'castle.target.spies.open' : 'castle.target.open')}
          </Button>
        )
      }
      actions={
        done ? undefined : (
          <>
            {!target.merc && chance === null ? (
              <Button
                disabled={busy || !hasAp(castle, scoutCost.ap) || !affords(castle, purse, scoutCost.gold)}
                onClick={() => void castleRun({ type: 'spy', target: target.id, mission: 'scout' })}
              >
                {t('castle.scoutFor', { gold: fmt.short(scoutCost.gold), ap: fmt.int(scoutCost.ap) })}
              </Button>
            ) : (
              <Button
                disabled={busy || beyond || !hasAp(castle, costs.ap) || !affords(castle, purse, costs.gold)}
                onClick={attack}
              >
                {t(target.struck !== null ? 'castle.strikeBackFor' : 'castle.siege', {
                  gold: fmt.short(costs.gold),
                  ap: fmt.int(costs.ap),
                })}
              </Button>
            )}
          </>
        )
      }
    />
  );
}
