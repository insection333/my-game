// The Storehouse's item panel (its grid in ItemGrid.tsx since session 186), which sells to the vendor,
// wears gear, and answers Comes from and Used in by asking every feature.
import { fmt, t } from '@idle-clash/content';
import {
  findOf,
  gearDoes,
  healsFor,
  items,
  laneUsing,
  pedlarWants,
  RARE_FIND_COMPLETIONS,
  findUses,
  spentFind,
  storehouseData,
  type FindUse,
} from '@idle-clash/features';
import { countOf, type State } from '@idle-clash/kernel';
import { useRef, useState } from 'react';
import { ActionRow, Button, ItemIcon, Pill } from '@idle-clash/ui';
import { useGame } from '../game/hooks.ts';
import { game } from '../game/store.ts';
import { navigate } from '../router.ts';
import s from './items.module.css';

export const KINDS = ['resource', 'supply', 'gear', 'food', 'find'] as const;
export const KIND_TITLE: Record<(typeof KINDS)[number], string> = {
  resource: 'store.kind.resource',
  supply: 'store.kind.supply',
  gear: 'store.kind.gear',
  food: 'store.kind.food',
  find: 'store.kind.find',
};

/** The gear the fighter has on. */
export const wornBy = (state: State): string[] =>
  Object.values((state.features.combat as { worn?: Record<string, string> } | undefined)?.worn ?? {});

export const itemHref = (item: string) => `${location.pathname}?panel=item&item=${encodeURIComponent(item)}`;

// An item used nowhere is a find kept to sell (session 111: "Nothing yet." promised a use to come).
function Sources({ title, list, none }: { title: string; list: items.ItemSource[]; none?: string }) {
  return (
    <section className={s.sources}>
      <h3>{title}</h3>
      {list.length === 0 ? (
        <p className={s.none}>{none ?? t('item.panel.nothing')}</p>
      ) : (
        <ul>
          {list.map((src, i) => {
            // Where the line leads: its own place (the vendor, the log), a skill's page, or the page of a
            // feature without one (Combat).
            const href = src.href ?? (src.skill ? `/skills/${src.skill}` : `/${src.feature}`);
            return (
              <li key={i}>
                <a href={href} data-ui="RowLink" onClick={(e) => (e.preventDefault(), navigate(href))}>
                  {items.sourceLabel(src)}
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** One item: what it is, how many you hold, what it sells for, where it comes from and what uses it. */
export function ItemPanel({ item }: { item: string }) {
  const { state, features } = useGame();
  const def = items.itemDef(features, item);
  if (!def) return <p className={s.none}>{t('item.panel.unknown')}</p>;
  return (
    <div className={s.panel}>
      <div className={s.head}>
        <ItemIcon name={item} size={96} />
        <div>
          <Pill>{t(KIND_TITLE[def.kind])}</Pill>
          <p>{t('item.panel.have', { count: fmt.int(countOf(state, item)) })}</p>
          {def.heals !== undefined && <p>{t('food.heals', { health: fmt.int(healsFor(state, def.heals)) })}</p>}
          {def.gear && <p>{gearDoes(item)}</p>}
          {def.value > 0 && <p className={s.muted}>{t('item.panel.sells', { gold: fmt.int(def.value) })}</p>}
        </div>
      </div>
      <ItemActions key={item} item={item} value={def.value} gear={def.kind === 'gear'} />
      <UseFind item={item} />
      <Sources title={t('item.panel.comesFrom')} list={items.comesFrom(features, item)} />
      <Sources title={t('item.panel.usedIn')} list={items.usedIn(features, item)} none={t('item.panel.unused')} />
    </div>
  );
}

/** Selling to the vendor (one, ten, all but one) and, for gear, wearing it. Selling all but one asks
 *  first, saying what it comes to and what a running lane uses it for (session 71); every sale then says
 *  what it brought in. */
function ItemActions({ item, value, gear }: { item: string; value: number; gear: boolean }) {
  const { state, now } = useGame();
  const [asking, setAsking] = useState(false);
  const [sold, setSold] = useState('');
  const box = useRef<HTMLDivElement>(null);
  const have = countOf(state, item);
  const worn = wornBy(state);
  // Where the focus goes when the button pressed gives way: the question's answer, or back.
  const focusIn = (selector: string) =>
    requestAnimationFrame(() => box.current?.querySelector<HTMLElement>(selector)?.focus());
  const sell = (count: number) => {
    setAsking(false);
    const r = game.act('storehouse', 'sell', { item, count }) as { ok: boolean; gold?: number } | null;
    if (r?.ok) setSold(t('store.sold', { count: fmt.int(count), gold: fmt.int(r.gold ?? 0) }));
  };
  // Selling never takes the last of something worn; "all but one" leaves one either way.
  const max = worn.includes(item) ? have - 1 : have;
  const using = laneUsing(state, item);
  const wanted = pedlarWants(state, now, item);
  // A new question clears the last sale's line, which would stand under it as if it answered it.
  const ask = () => (setAsking(true), setSold(''), focusIn('[data-answer]'));
  const shown = have > 0 && (value > 0 || gear);
  // Locked against selling (session 241): no sale here, nor Sell finds or Sell old gear.
  const locked = storehouseData.isLocked(state, item);
  const lock = (on: boolean) => game.act('storehouse', 'lock', { item, on });
  return (
    <div ref={box}>
      {shown && asking && (
        <div className={s.ask}>
          <p>{t('store.sellAsk', { count: fmt.int(have - 1), gold: fmt.int(value * (have - 1)) })}</p>
          {using && <p className={s.inUse}>{using}</p>}
          {wanted && <p className={s.inUse}>{wanted}</p>}
          <div className={s.actions}>
            <Button variant="primary" data-answer onClick={() => (sell(have - 1), focusIn('[data-status]'))}>
              {t('store.sellYes')}
            </Button>
            <Button variant="secondary" onClick={() => (setAsking(false), focusIn('[data-sell-all]'))}>
              {t('store.sellNo')}
            </Button>
          </div>
        </div>
      )}
      {gear && worn.includes(item) && <p className={s.muted}>{t('item.panel.wearing')}</p>}
      {shown && !asking && (
        <div className={s.actions}>
          {gear && !worn.includes(item) && (
            <Button variant="primary" onClick={() => game.act('combat', 'wear', { item })}>
              {t('gear.wear')}
            </Button>
          )}
          {value > 0 && locked && (
            <>
              <span className={s.muted}>{t('store.locked')}</span>
              <Button variant="quiet" onClick={() => lock(false)}>
                {t('store.unlock')}
              </Button>
            </>
          )}
          {value > 0 && !locked && (
            <>
              <Button variant="secondary" disabled={max < 1} onClick={() => sell(1)}>
                {t('store.sellOne')}
              </Button>
              {have >= 10 && (
                <Button variant="secondary" disabled={max < 10} onClick={() => sell(10)}>
                  {t('store.sellTen')}
                </Button>
              )}
              {have > 2 && (
                <Button variant="secondary" data-sell-all onClick={ask}>
                  {t('store.sellAllButOne')}
                </Button>
              )}
              <Button variant="quiet" onClick={() => lock(true)}>
                {t('store.lock')}
              </Button>
            </>
          )}
        </div>
      )}
      <p role="status" data-status tabIndex={-1} className={s.sold}>
        {sold}
      </p>
    </div>
  );
}

/** A Rare find held: spend it on one action of its skill for 500 mastery completions, most used first, leaving
 *  out an action at full mastery and offering the finds that bring its next step at once (session 154). */
function UseFind({ item }: { item: string }) {
  const { state } = useGame();
  if (findOf(item)?.rarity !== 'rare' || countOf(state, item) < 1) return null;
  const held = countOf(state, item);
  const rows = findUses(state, item).slice(0, 6);
  const use = (a: FindUse['action'], count: number) =>
    game.act('storehouse', 'useFind', count > 1 ? { item, action: a, count } : { item, action: a });
  return (
    <section className={s.sources}>
      <h3>{t('item.panel.use', { count: fmt.int(RARE_FIND_COMPLETIONS) })}</h3>
      {/* Kept to sell only once every action is open too (session 192); else more open with levels. */}
      {rows.length === 0 && (
        <p className={s.muted}>{t(spentFind(state, item) ? 'item.panel.allMastered' : 'item.panel.openMastered')}</p>
      )}
      <div className={s.useList}>
        {rows.map(({ action: a, completions, next }) => (
          <ActionRow
            key={`${a.feature}:${a.id}`}
            name={t(`action.${a.feature}.${a.id}`)}
            facts={[
              t('item.panel.completions', { count: fmt.int(completions) }),
              next.count === 1
                ? t('item.panel.nextStepOne', { step: fmt.int(next.step) })
                : t('item.panel.nextStep', { count: fmt.int(next.count), step: fmt.int(next.step) }),
            ]}
            actions={
              <>
                <Button variant="secondary" onClick={() => use(a, 1)}>
                  {t('item.panel.useButton')}
                </Button>
                {next.count > 1 && next.count <= held && (
                  <Button variant="secondary" onClick={() => use(a, next.count)}>
                    {t('item.panel.useMany', { count: fmt.int(next.count) })}
                  </Button>
                )}
              </>
            }
          />
        ))}
      </div>
    </section>
  );
}
