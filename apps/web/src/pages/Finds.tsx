// Finds as the skill page and the collection log draw them: the icon (or its silhouette), the name,
// its rarity in words, and when it was first found or where it comes from.
import type { FindEntry } from '@idle-clash/features';
import { ItemIcon, Pill } from '@idle-clash/ui';
import s from './finds.module.css';

const TONE = { uncommon: 'moss', rare: 'woad', legendary: 'gold' } as const;

/** More finds than this scroll inside their own box (session 210: the bosses' twelve ran their panel of the
 *  collection log past a phone's page area). */
const IN_VIEW = 6;

export function FindGrid({ finds, label }: { finds: FindEntry[]; label?: string }) {
  const scrolls = finds.length > IN_VIEW;
  return (
    <ul
      className={scrolls ? `${s.grid} ${s.scrolls}` : s.grid}
      data-scrollbox={scrolls || undefined}
      tabIndex={scrolls ? 0 : undefined}
      aria-label={scrolls ? label : undefined}
    >
      {finds.map((f) => (
        <li key={f.item} className={s.find} data-found={f.found || undefined}>
          <ItemIcon name={f.item} size={48} silhouette={!f.found} />
          <div className={s.text}>
            <span className={s.name}>{f.name}</span>
            <Pill tone={TONE[f.rarityId as keyof typeof TONE] ?? 'neutral'}>{f.rarity}</Pill>
            {f.note && <span className={s.note}>{f.note}</span>}
          </div>
        </li>
      ))}
    </ul>
  );
}
