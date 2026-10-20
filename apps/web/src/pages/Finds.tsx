// Finds as the skill page and the collection log draw them: the icon (or its silhouette), the name,
// its rarity in words, and when it was first found or where it comes from.
import type { FindEntry } from '@idle-clash/features';
import { ItemIcon, Pill } from '@idle-clash/ui';
import s from './finds.module.css';

const TONE = { uncommon: 'moss', rare: 'woad', legendary: 'gold' } as const;

export function FindGrid({ finds }: { finds: FindEntry[] }) {
  return (
    <ul className={s.grid}>
      {finds.map((f) => (
        <li key={f.item} className={s.find} data-found={f.found || undefined}>
          <ItemIcon name={f.item} size={48} silhouette={!f.found} />
          <div className={s.text}>
            <span className={s.name}>{f.name}</span>
            <Pill tone={TONE[f.rarityId as keyof typeof TONE] ?? 'neutral'}>{f.rarity}</Pill>
            <span className={s.note}>{f.note}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
