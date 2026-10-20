// The Storehouse's items: everything you hold, by kind, each opening its panel; and the panel itself,
// which answers Comes from and Used in by asking every feature (the Storehouse's space and selling
// arrive in session 9).
import { fmt, t } from '@idle-clash/content';
import { items } from '@idle-clash/features';
import { countOf } from '@idle-clash/kernel';
import { ItemIcon, Panel, Pill } from '@idle-clash/ui';
import { useGame } from '../game/hooks.ts';
import { navigate } from '../router.ts';
import { Slot } from '../slots.tsx';
import s from './items.module.css';

const KINDS = ['resource', 'gear', 'food', 'find'] as const;
const KIND_TITLE: Record<(typeof KINDS)[number], string> = {
  resource: 'store.kind.resource',
  gear: 'store.kind.gear',
  food: 'store.kind.food',
  find: 'store.kind.find',
};

export const itemHref = (item: string) => `${location.pathname}?panel=item&item=${encodeURIComponent(item)}`;

export function ItemGrid() {
  const { state, features } = useGame();
  const held = items.catalog(features).filter((i) => countOf(state, i.id) > 0);
  return (
    <Slot id="store.items" className={s.kinds}>
      {held.length === 0 && <p className={s.empty}>{t('store.empty')}</p>}
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
                    <ItemIcon name={i.id} size={48} />
                    <span className={s.count}>{fmt.int(countOf(state, i.id))}</span>
                    <span className={s.name}>{t(`item.${i.id}`)}</span>
                  </a>
                </li>
              ))}
            </ul>
          </Panel>
        );
      })}
    </Slot>
  );
}

const sourceText = (src: items.ItemSource) => {
  const skill = src.skill ? t(`skill.${src.skill}`) : '';
  if (src.rarity) return t('item.panel.find', { skill, rarity: t(`rarity.${src.rarity}`) });
  return t('item.panel.action', { skill, action: t(`action.${src.feature}.${src.action}`), count: fmt.int(src.count) });
};

function Sources({ title, list }: { title: string; list: items.ItemSource[] }) {
  return (
    <section className={s.sources}>
      <h3>{title}</h3>
      {list.length === 0 ? (
        <p className={s.none}>{t('item.panel.nothing')}</p>
      ) : (
        <ul>
          {list.map((src, i) => (
            <li key={i}>
              {src.skill ? (
                <a
                  href={`/skills/${src.skill}`}
                  data-ui="RowLink"
                  onClick={(e) => (e.preventDefault(), navigate(`/skills/${src.skill}`))}
                >
                  {sourceText(src)}
                </a>
              ) : (
                <span>{sourceText(src)}</span>
              )}
            </li>
          ))}
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
      <Sources title={t('item.panel.comesFrom')} list={items.comesFrom(features, item)} />
      <Sources title={t('item.panel.usedIn')} list={items.usedIn(features, item)} />
    </div>
  );
}
