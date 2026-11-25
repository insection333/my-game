// The Storehouse's grid (split from Items.tsx in session 186): its space, everything held by kind, each
// opening its panel; and, once the shelves run long, a search by name.
import { fmt, t } from '@idle-clash/content';
import { items, type CapacityView } from '@idle-clash/features';
import { countOf } from '@idle-clash/kernel';
import { useRef, useState } from 'react';
import { Button, Field, ItemIcon, Panel, ProgressBar } from '@idle-clash/ui';
import { useGame } from '../game/hooks.ts';
import { game } from '../game/store.ts';
import { navigate } from '../router.ts';
import { fills, Slot } from '../slots.tsx';
import { itemHref, KIND_TITLE, KINDS, wornBy } from './Items.tsx';
import { itemMatches, SEARCH_FROM } from './item-search.ts';
import s from './items.module.css';

/** Slots used of the total, the next enlargement with its price, and the finds kept to sell (session 187) and
 *  the old gear (session 241) each sold at one press after asking. */
function Capacity() {
  const { state, now, features } = useGame();
  const [asking, setAsking] = useState<'finds' | 'gear' | null>(null);
  const [sold, setSold] = useState('');
  const box = useRef<HTMLDivElement>(null);
  const [cap] = fills<CapacityView>(features, 'store.capacity', state, now);
  if (!cap) return null;
  const { data } = cap;
  const focusIn = (selector: string) =>
    requestAnimationFrame(() => box.current?.querySelector<HTMLElement>(selector)?.focus());
  const sell = (kind: 'finds' | 'gear') => {
    setAsking(null);
    const route = kind === 'finds' ? 'sellFinds' : 'sellGear';
    const r = game.act('storehouse', route, {}) as { ok: boolean; gold?: number; kinds?: number } | null;
    const gold = fmt.int(r?.gold ?? 0);
    const count = fmt.int(r?.kinds ?? 0);
    const one = r?.kinds === 1;
    if (r?.ok)
      setSold(
        kind === 'finds'
          ? one
            ? t('store.soldFindsOne', { gold })
            : t('store.soldFinds', { count, gold })
          : one
            ? t('store.soldGearOne', { gold })
            : t('store.soldGear', { count, gold }),
      );
    focusIn('[data-status]');
  };
  const offer = asking === 'finds' ? data.sellFinds : asking === 'gear' ? data.sellGear : null;
  const open = (kind: 'finds' | 'gear') => (setAsking(kind), setSold(''), focusIn('[data-answer]'));
  return (
    <Slot id="store.capacity" className={s.capacity}>
      <div className={s.capacityText}>
        <span>{data.text}</span>
        <ProgressBar value={data.used / data.total} label={data.text} tone="woad" />
      </div>
      {!asking && (data.enlarge || data.sellFinds || data.sellGear) && (
        <div className={s.actions}>
          {data.sellFinds && (
            <Button variant="secondary" data-sell-finds onClick={() => open('finds')}>
              {data.sellFinds.label}
            </Button>
          )}
          {data.sellGear && (
            <Button variant="secondary" data-sell-gear onClick={() => open('gear')}>
              {data.sellGear.label}
            </Button>
          )}
          {data.enlarge && (
            <Button
              variant="secondary"
              disabled={!data.enlarge.affordable}
              onClick={() => game.act('storehouse', 'enlarge', {})}
            >
              {data.enlarge.label}
            </Button>
          )}
        </div>
      )}
      <div ref={box} className={s.capacityAnswer}>
        {asking && offer && (
          <div className={s.ask}>
            <p>{offer.ask}</p>
            <div className={s.actions}>
              <Button variant="primary" data-answer onClick={() => sell(asking)}>
                {t('store.sellYes')}
              </Button>
              <Button variant="secondary" onClick={() => (setAsking(null), focusIn(`[data-sell-${asking}]`))}>
                {t('store.sellNo')}
              </Button>
            </div>
          </div>
        )}
        <p role="status" data-status tabIndex={-1} className={s.sold}>
          {sold}
        </p>
      </div>
    </Slot>
  );
}

export function ItemGrid() {
  const { state, features } = useGame();
  const [query, setQuery] = useState('');
  const all = items.catalog(features).filter((i) => countOf(state, i.id) > 0);
  const searching = all.length >= SEARCH_FROM;
  const held = searching ? all.filter((i) => itemMatches(t(`item.${i.id}`), query)) : all;
  const worn = wornBy(state);
  return (
    <>
      <Capacity />
      {searching && (
        <Field
          type="search"
          label={t('store.search')}
          labelHidden
          placeholder={t('store.search')}
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={s.search}
        />
      )}
      <Slot id="store.items" className={s.kinds}>
        {searching && held.length === 0 && <p className={s.empty}>{t('store.search.none')}</p>}
        {all.length === 0 && (
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
                      data-worn={worn.includes(i.id) || undefined}
                      className={s.tile}
                      onClick={(e) => (e.preventDefault(), navigate(itemHref(i.id)))}
                    >
                      <span className={s.art}>
                        <ItemIcon name={i.id} size={48} />
                        {/* On its own chip at the icon's corner, never over the art; large counts shortened
                            from 100,000 (the item's panel gives the exact number). */}
                        <span className={s.count}>{fmt.short(countOf(state, i.id))}</span>
                        {/* Gear the fighter has on (session 123: only its panel said so). */}
                        {worn.includes(i.id) && <span className={s.worn}>{t('store.worn')}</span>}
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
