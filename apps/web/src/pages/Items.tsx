// The Storehouse's items: its space, everything you hold by kind, each opening its panel; and the
// panel itself, which sells to the vendor, wears gear, and answers Comes from and Used in by asking
// every feature.
import { fmt, t } from '@idle-clash/content';
import { actionsFor, findOf, items, RARE_FIND_COMPLETIONS, type CapacityView } from '@idle-clash/features';
import { countOf } from '@idle-clash/kernel';
import { useRef, useState } from 'react';
import { ActionRow, Button, ItemIcon, Panel, Pill, ProgressBar } from '@idle-clash/ui';
import { useGame } from '../game/hooks.ts';
import { game } from '../game/store.ts';
import { navigate } from '../router.ts';
import { fills, Slot } from '../slots.tsx';
import s from './items.module.css';

const KINDS = ['resource', 'supply', 'gear', 'food', 'find'] as const;
const KIND_TITLE: Record<(typeof KINDS)[number], string> = {
  resource: 'store.kind.resource',
  supply: 'store.kind.supply',
  gear: 'store.kind.gear',
  food: 'store.kind.food',
  find: 'store.kind.find',
};

export const itemHref = (item: string) => `${location.pathname}?panel=item&item=${encodeURIComponent(item)}`;

/** Slots used of the total, and the next enlargement with its price. */
function Capacity() {
  const { state, now, features } = useGame();
  const [cap] = fills<CapacityView>(features, 'store.capacity', state, now);
  if (!cap) return null;
  const { data } = cap;
  return (
    <Slot id="store.capacity" className={s.capacity}>
      <div className={s.capacityText}>
        <span>{data.text}</span>
        <ProgressBar value={data.used / data.total} label={data.text} tone="woad" />
      </div>
      {data.enlarge && (
        <Button
          variant="secondary"
          disabled={!data.enlarge.affordable}
          onClick={() => game.act('storehouse', 'enlarge', {})}
        >
          {data.enlarge.label}
        </Button>
      )}
    </Slot>
  );
}

export function ItemGrid() {
  const { state, features } = useGame();
  const held = items.catalog(features).filter((i) => countOf(state, i.id) > 0);
  return (
    <>
      <Capacity />
      <Slot id="store.items" className={s.kinds}>
        {held.length === 0 && (
          // Empty: the shelves it will fill, what fills them, and where to start.
          <div className={s.emptyState}>
            <ul className={s.grid} aria-hidden="true">
              {Array.from({ length: 6 }, (_, i) => (
                <li key={i} className={s.ghost} />
              ))}
            </ul>
            <p className={s.empty}>{t('store.empty')}</p>
            <Button variant="secondary" onClick={() => navigate('/skills/woodcutting')}>
              {t('store.empty.go')}
            </Button>
          </div>
        )}
        {KINDS.map((kind) => {
          const these = held.filter((i) => i.kind === kind);
          if (!these.length) return null;
          return (
            <Panel key={kind} title={t(KIND_TITLE[kind])} aside={fmt.int(these.length)}>
              <ul className={s.grid}>
                {these.map((i) => (
                  <li key={i.id}>
                    <a
                      href={itemHref(i.id)}
                      data-ui="ItemTile"
                      className={s.tile}
                      onClick={(e) => (e.preventDefault(), navigate(itemHref(i.id)))}
                    >
                      <span className={s.art}>
                        <ItemIcon name={i.id} size={48} />
                        {/* On its own chip at the icon's corner, never over the art; large counts shortened
                            from 100,000 (the item's panel gives the exact number). */}
                        <span className={s.count}>{fmt.short(countOf(state, i.id))}</span>
                      </span>
                      <span className={s.name}>{t(`item.${i.id}`)}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </Panel>
          );
        })}
      </Slot>
    </>
  );
}

function Sources({ title, list }: { title: string; list: items.ItemSource[] }) {
  return (
    <section className={s.sources}>
      <h3>{title}</h3>
      {list.length === 0 ? (
        <p className={s.none}>{t('item.panel.nothing')}</p>
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
          {def.value > 0 && <p className={s.muted}>{t('item.panel.sells', { gold: fmt.int(def.value) })}</p>}
        </div>
      </div>
      <ItemActions key={item} item={item} value={def.value} gear={def.kind === 'gear'} />
      <UseFind item={item} />
      <Sources title={t('item.panel.comesFrom')} list={items.comesFrom(features, item)} />
      <Sources title={t('item.panel.usedIn')} list={items.usedIn(features, item)} />
    </div>
  );
}

/** Selling to the vendor (one, ten, all but one) and, for gear, wearing it. Selling all but one asks
 *  first, saying what it comes to; every sale then says what it brought in. */
function ItemActions({ item, value, gear }: { item: string; value: number; gear: boolean }) {
  const { state } = useGame();
  const [asking, setAsking] = useState(false);
  const [sold, setSold] = useState('');
  const box = useRef<HTMLDivElement>(null);
  const have = countOf(state, item);
  const worn = Object.values((state.features.combat as { worn?: Record<string, string> } | undefined)?.worn ?? {});
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
  const shown = have > 0 && (value > 0 || gear);
  return (
    <div ref={box}>
      {shown && asking && (
        <div className={s.ask}>
          <p>{t('store.sellAsk', { count: fmt.int(have - 1), gold: fmt.int(value * (have - 1)) })}</p>
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
          {value > 0 && (
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
                <Button variant="secondary" data-sell-all onClick={() => (setAsking(true), focusIn('[data-answer]'))}>
                  {t('store.sellAllButOne')}
                </Button>
              )}
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

/** A Rare find held: spend it on one action of its skill for 500 mastery completions, most used first. */
function UseFind({ item }: { item: string }) {
  const { state } = useGame();
  if (findOf(item)?.rarity !== 'rare' || countOf(state, item) < 1) return null;
  const done = (a: { feature: string; id: string }) => state.mastery[`${a.feature}:${a.id}`] ?? 0;
  const list = actionsFor(state, item)
    .sort((a, b) => done(b) - done(a))
    .slice(0, 6);
  return (
    <section className={s.sources}>
      <h3>{t('item.panel.use', { count: fmt.int(RARE_FIND_COMPLETIONS) })}</h3>
      <div className={s.useList}>
        {list.map((a) => (
          <ActionRow
            key={`${a.feature}:${a.id}`}
            name={t(`action.${a.feature}.${a.id}`)}
            facts={[t('item.panel.completions', { count: fmt.int(done(a)) })]}
            actions={
              <Button variant="secondary" onClick={() => game.act('storehouse', 'useFind', { item, action: a })}>
                {t('item.panel.useButton')}
              </Button>
            }
          />
        ))}
      </div>
    </section>
  );
}
