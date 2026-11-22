// The spies at the day's foes (session 167): what they have done to a stronghold or the fortress (its wells
// poisoned, its gatehouse sabotaged, its orders forged, each until when), and on its sheet the three
// missions, each with its chance against the foe's watchtower and its price, from the first day.
import { POISON_PCT, fmt, t } from '@idle-clash/content';
import { castleEngine as E } from '@idle-clash/features';
import { ActionRow, Button, ItemIcon } from '@idle-clash/ui';
import { foeMissionDoes, missionName, refusal } from './labels.ts';
import { castleRun } from './store.ts';
import { affords, hasAp, useSyncedCastle } from './synced.ts';
import { pct } from './targets.ts';
import s from './castle.module.css';

/** The spies' work standing on a foe, a line a kind, with when it lapses. */
export function opsLines(castle: E.Castle, foe: string, now: number): string[] {
  const ops = E.foeOps(castle, foe, now);
  const until = E.foeOpsUntil(castle, foe, now);
  const at = (k: E.DebuffKind) => fmt.time(until[k] ?? now);
  const out: string[] = [];
  if (ops.poison > 0)
    out.push(t('castle.ops.poison', { pct: fmt.pct(Math.min(2, ops.poison) * POISON_PCT), until: at('poison') }));
  if (ops.sabotage > 0) out.push(t('castle.ops.sabotage', { until: at('sabotage') }));
  if (ops.forge > 0) out.push(t('castle.ops.forge', { until: at('forge') }));
  return out;
}

/** Whether the spies' full work (two poisonings, a sabotage, forged orders) would bring a foe no roll takes
 *  now within reach: then its row says so, rather than that the troops need levels. */
export const spiesWouldTake = (castle: E.Castle, side: (ops: E.FoeOps) => E.Side, now: number): boolean =>
  E.winChance(E.bestOffense(castle, side({ poison: 2, sabotage: 1, forge: 1 }), now).r) > 0;

/** The three missions against a foe of `level`, on its sheet. */
export function FoeMissions({ foe, level }: { foe: string; level: number }) {
  const { castle, now, purse, busy } = useSyncedCastle();
  if (!castle) return null;
  const chance = E.foeSpyChance(castle, foe, level, now);
  const lines = opsLines(castle, foe, now);
  return (
    <div className={s.sheetSection}>
      <h3>{t('castle.spy.title')}</h3>
      <p className={s.muted}>{t('castle.spy.foeLead', { pct: pct(chance) })}</p>
      {lines.map((l) => (
        <p key={l} className={s.ops} data-ops>
          {l}
        </p>
      ))}
      <div className={s.missions} data-slot="castle.foeMissions">
        {E.FOE_MISSIONS.map((m) => {
          const cost = E.foeSpyCosts(castle, m, now);
          const blocked = E.foeSpyRefusal(castle, foe, m.id, now);
          return (
            <ActionRow
              key={m.id}
              iconYields
              icon={<ItemIcon name={`spy-${m.id}`} size={32} />}
              name={missionName(m.id)}
              facts={[foeMissionDoes(m.id), ...(blocked && blocked !== 'ap' ? [refusal(blocked)] : [])]}
              actions={
                <Button
                  disabled={busy || blocked !== null || !hasAp(castle, cost.ap) || !affords(castle, purse, cost.gold)}
                  onClick={() => void castleRun({ type: 'spy', target: foe, mission: m.id })}
                >
                  {t('castle.mission.send', { gold: fmt.short(cost.gold), ap: fmt.int(cost.ap) })}
                </Button>
              }
            />
          );
        })}
      </div>
    </div>
  );
}
