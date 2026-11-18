// One verb, its amounts and their prices, alike across Castle Clash (session 134, the owner: "Drill for
// 10 AP" and "Drill ×5" confused; say "Level up +1" or "+5"): a troop's or building's Level up, a troop's
// Train, each as a word and a short button an amount, the button named in full for a screen reader
// ("Level up +5 for 160M"). And the slider that heals the wounded or repairs the walls by as much as the
// lord chooses, with the price of that much on its button.
import { ECONOMY, fmt, t, type BuildingId, type UnitId } from '@idle-clash/content';
import { castleEngine as E } from '@idle-clash/features';
import { Button, Pill } from '@idle-clash/ui';
import { useId, useState } from 'react';
import { castleAct } from './store.ts';
import { affords, hasAp, useSyncedCastle } from './synced.ts';
import s from './castle.module.css';

export interface Step {
  /** On the button: "+1 · 29.6M". */
  text: string;
  /** Its whole name: "Level up +1 for 29.6M". */
  name: string;
  disabled: boolean;
  onPress: () => void;
}

/** A verb and its steps, on one line: "Level up [+1 · 29.6M] [+5 · 160M]". */
export function Steps({ label, steps }: { label: string; steps: readonly Step[] }) {
  return (
    <div className={s.steps} role="group" aria-label={label}>
      <span className={s.stepsLabel} aria-hidden="true">
        {label}
      </span>
      {steps.map((x) => (
        <Button key={x.name} aria-label={x.name} title={x.name} disabled={x.disabled} onClick={x.onPress}>
          {x.text}
        </Button>
      ))}
    </div>
  );
}

/** Level up +1 and +5 (fewer near the top) for a troop or a building, or At its highest. */
export function LevelUp({ id }: { id: BuildingId | UnitId }) {
  const { castle, now, purse, busy } = useSyncedCastle();
  if (!castle) return null;
  const left = ECONOMY.MAX_LEVEL - castle.levels[id];
  if (left <= 0) return <Pill tone="moss">{t('castle.highest')}</Pill>;
  const counts = [...new Set([1, Math.min(E.LEVEL_UP_MOST, left)])];
  return (
    <Steps
      label={t('castle.levelUp.label')}
      steps={counts.map((more) => {
        const gold = E.levelUpCost(castle, id, more, now);
        return {
          text: t('castle.step.gold', { more: fmt.int(more), gold: fmt.short(gold) }),
          name: t('castle.levelUp', { more: fmt.int(more), gold: fmt.short(gold) }),
          disabled: busy || !affords(castle, purse, gold),
          onPress: () => void castleAct({ type: 'upgrade', id, ...(more > 1 ? { times: more } : {}) }),
        };
      })}
    />
  );
}

/** Heals the wounded, or repairs the walls, by the part the slider picks (a whole percent, at most what
 *  there is to mend, rounded up), with its price; the engine charges for no more than there was. */
export function Mend({ what, points }: { what: 'walls' | 'wounds'; points: number }) {
  const { castle, now, purse, busy } = useSyncedCastle();
  const id = useId();
  const [chosen, setChosen] = useState<number | null>(null);
  if (!castle || points <= 0.01) return null;
  const most = Math.max(1, Math.ceil(points - 1e-9));
  const pct = chosen === null ? most : Math.min(Math.max(1, chosen), most);
  const cost = E.instantCost(castle, Math.min(pct, points), now);
  const words = { pct: fmt.pct(pct), gold: fmt.short(cost.gold), ap: fmt.int(cost.ap) };
  return (
    <div className={s.mend}>
      {most > 1 && (
        <label className={s.mendBy} htmlFor={id}>
          <span>
            {t(what === 'walls' ? 'castle.repair.by' : 'castle.heal.by')} <output htmlFor={id}>{fmt.pct(pct)}</output>
          </span>
          <input
            id={id}
            type="range"
            data-ui="Slider"
            className={s.slider}
            min={1}
            max={most}
            step={1}
            value={pct}
            onChange={(e) => setChosen(Number(e.target.value))}
          />
        </label>
      )}
      <Button
        disabled={busy || !hasAp(castle, cost.ap) || !affords(castle, purse, cost.gold)}
        onClick={() => void castleAct({ type: 'mend', what, pct })}
      >
        {t(what === 'walls' ? 'castle.repair' : 'castle.heal', words)}
      </Button>
    </div>
  );
}
