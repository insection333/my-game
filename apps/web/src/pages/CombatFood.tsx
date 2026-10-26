// The vendor's food on the Combat page: one short row each (what it heals and costs, how many you carry)
// with Buy 10.
import { t } from '@idle-clash/content';
import type { FoodView } from '@idle-clash/features';
import { Button, ItemIcon, Panel } from '@idle-clash/ui';
import { useGame } from '../game/hooks.ts';
import { game } from '../game/store.ts';
import { fills, Slot } from '../slots.tsx';
import f from './food.module.css';

export function CombatFood() {
  const { state, now, features } = useGame();
  const [food] = fills<FoodView>(features, 'combat.food', state, now);
  if (!food) return null;
  // The two best foods on sale to you, and the next one to open: older foods only crowd the list
  // (one you still carry stays, so it can be seen).
  const open = food.data.shop.filter((x) => !x.locked);
  const best = new Set(open.slice(-2).map((x) => x.item));
  const next = food.data.shop.find((x) => x.locked);
  const shown = food.data.shop.filter((x) => best.has(x.item) || x === next || (!x.locked && x.carried > 0));
  return (
    <Panel title={t('combat.food')} flush>
      <Slot id="combat.food">
        <ul className={f.rows}>
          {shown.map((x) => (
            <li key={x.item} className={f.row} data-locked={x.locked || undefined}>
              <ItemIcon name={x.item} size={32} />
              <div className={f.text}>
                <div className={f.name}>
                  <span>{x.name}</span>
                  {x.have && <span className={f.have}>{x.have}</span>}
                </div>
                <div className={f.facts}>
                  {[...x.facts, ...(x.opensAt ? [x.opensAt] : [])].map((fact) => (
                    <span key={fact}>{fact}</span>
                  ))}
                </div>
              </div>
              {!x.locked && (
                <Button
                  variant="secondary"
                  disabled={!x.affordable}
                  onClick={() => game.act('storehouse', 'buy', { item: x.item, count: 10 })}
                >
                  {t('store.buyTen')}
                </Button>
              )}
            </li>
          ))}
        </ul>
      </Slot>
    </Panel>
  );
}
