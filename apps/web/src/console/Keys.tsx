// The list of the console's keys (session 234), opened by ? or from Go to.
import { t } from '@idle-clash/content';
import { Sheet } from '@idle-clash/ui';
import type { SectionId } from './Console.tsx';
import { goToKey } from './GoTo.tsx';
import { SECTION_KEYS } from './keys.ts';
import m from './more.module.css';
import s from './pages.module.css';

export function Keys({ sections, onClose }: { sections: { id: SectionId; label: string }[]; onClose: () => void }) {
  const rows: [string[], string][] = [
    [[goToKey(navigator.platform), '/'], t('console.keys.goTo')],
    [['?'], t('console.keys.keys')],
    [['Esc'], t('console.keys.close')],
    ...sections.map((x): [string[], string] => [['G', SECTION_KEYS[x.id].toUpperCase()], x.label]),
  ];
  return (
    <Sheet title={t('console.keys')} closeLabel={t('console.keys.closeSheet')} onClose={onClose}>
      <div className={`${s.stack} ${s.inSheet}`}>
        <p className={s.note}>{t('console.keys.lead')}</p>
        <dl className={m.keys}>
          {rows.map(([keys, words]) => (
            <div key={words}>
              <dt>
                {keys.map((k, i) => (
                  <kbd key={i} className={m.key}>
                    {k}
                  </kbd>
                ))}
              </dt>
              <dd>{words}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Sheet>
  );
}
