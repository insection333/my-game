// One verb, its amounts and their prices, alike across Castle Clash (session 134, the owner: "Drill for
// 10 AP" and "Drill ×5" confused; say "Level up +1" or "+5"): a troop's or building's Level up, a troop's
// Train, each as a word and a short button an amount, the button named in full for a screen reader
// ("Level up +5 for 160M"). And the slider that heals the wounded or repairs the walls by as much as the
// lord chooses, with the price of that much on its button.
import { ECONOMY, fmt, t, type BuildingId, type UnitId } from '@idle-clash/content';
import { castleEngine as E, dayOfUse, isLocked, materialFor, materialsFor, MATERIAL_OF } from '@idle-clash/features';
import { countOf, type State } from '@idle-clash/kernel';
import { Button, Pill } from '@idle-clash/ui';
import { useId, useState } from 'react';
import { useGame } from '../../game/hooks.ts';
import { setUseMaterials, useMaterials } from './materials.ts';
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

/** Level up +1 and +5 (fewer near the top) for a troop or a building, or At its highest. With the lord's own
 *  materials (session 247), each price is the gold left after them, and a line says what they take. */
export function LevelUp({ id }: { id: BuildingId | UnitId }) {
  const { castle, now, purse, busy } = useSyncedCastle();
  const { state } = useGame();
  const withMaterials = useMaterials();
  if (!castle) return null;
  const left = ECONOMY.MAX_LEVEL - castle.levels[id];
  if (left <= 0) return <Pill tone="moss">{t('castle.highest')}</Pill>;
  const counts = [...new Set([1, Math.min(E.LEVEL_UP_MOST, left)])];
  // A building may be paid in part with materials (session 247); a troop in gold alone.
  const building = Object.hasOwn(MATERIAL_OF, id) ? (id as BuildingId) : null;
  const paidFor = (more: number) => {
    const full = E.levelUpCost(castle, id, more, now);
    const paid = withMaterials && building ? materialsFor(state, building, full) : null;
    return { gold: full - (paid?.credit ?? 0), paid };
  };
  const first = paidFor(1).paid;
  return (
    <div className={s.levelUp}>
      <Steps
        label={t('castle.levelUp.label')}
        steps={counts.map((more) => {
          const { gold, paid } = paidFor(more);
          const words = { more: fmt.int(more), gold: fmt.short(gold) };
          return {
            text: t('castle.step.gold', words),
            name: paid
              ? t('castle.levelUp.with', { ...words, count: fmt.int(paid.count), item: t(`item.${paid.item}`) })
              : t('castle.levelUp', words),
            disabled: busy || !affords(castle, purse, gold),
            onPress: () =>
              void castleAct({
                type: 'upgrade',
                id,
                ...(more > 1 ? { times: more } : {}),
                ...(paid ? { materials: true } : {}),
              }),
          };
        })}
      />
      {withMaterials && building && (
        <p className={s.levelUpWith}>
          {first
            ? t('castle.materials.paid', { count: fmt.int(first.count), item: t(`item.${first.item}`) })
            : materialWords(state, building)}
          {first && ` ${t('castle.materials.held', { count: fmt.int(countOf(state, first.item)) })}`}
          {first &&
            dayOfUse(state, first.item) > 0 &&
            ` ${t('castle.materials.kept', { count: fmt.int(dayOfUse(state, first.item)) })}`}
        </p>
      )}
    </div>
  );
}

/** Why no material pays: none held, locked, or all held kept for a day of the running lanes (session 266). */
function materialWords(state: State, building: BuildingId): string {
  const item = materialFor(state, building);
  const name = t(`item.${item}`);
  if (isLocked(state, item)) return t('castle.materials.locked', { item: name });
  const kept = dayOfUse(state, item);
  return kept > 0 && countOf(state, item) > 0
    ? t('castle.materials.inUse', { item: name, count: fmt.int(kept) })
    : t('castle.materials.none', { item: name });
}

/** The gold a level's price leaves once the lord's materials have paid their part (session 247), for the
 *  rows' "more gold needed". */
export function useLevelGold(): (id: BuildingId, full: number) => number {
  const { state } = useGame();
  const on = useMaterials();
  return (id, full) => full - (on ? (materialsFor(state, id, full)?.credit ?? 0) : 0);
}

/** The switch for paying in materials (session 247), at the head of the Citadel. */
export function MaterialsSwitch() {
  const on = useMaterials();
  const id = useId();
  return (
    <label className={s.materials} htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        data-ui="Checkbox"
        checked={on}
        onChange={(e) => setUseMaterials(e.target.checked)}
      />
      <span>{t('castle.materials.switch')}</span>
    </label>
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
