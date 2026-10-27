// Kindling on a skill's page (IA.md, slot 5): at 99 and past it, the Kindlings so far (the header's bar
// runs on towards the next), and the three Paths, each with what it gives now, to take or leave freely. Below 99 the ladder
// says in a line what waits at the top.
import { t } from '@idle-clash/content';
import type { KindlingView } from '@idle-clash/features';
import { ActionRow, Button, ItemIcon, Panel, Pill } from '@idle-clash/ui';
import { game } from '../game/store.ts';
import { Slot } from '../slots.tsx';
import k from './kindling.module.css';

export function KindlingPanel({ view }: { view: KindlingView }) {
  const walk = (path: KindlingView['paths'][number]['id'] | null) =>
    game.act('kindling', 'path', { skill: view.skill, path });
  return (
    <Panel title={t('kindling.title')} aside={view.count} flush className={k.panel}>
      <Slot id="skill.kindling">
        {view.note && <p className={k.note}>{view.note}</p>}
        {view.paths.length > 0 && (
          <div role="group" aria-label={t('kindling.paths')}>
            {view.paths.map((p) => (
              <ActionRow
                key={p.id}
                icon={<ItemIcon name={`path-${p.id}`} size={32} />}
                name={p.name}
                facts={[p.text]}
                status={p.current ? <Pill tone="moss">{t('kindling.walking')}</Pill> : undefined}
                actions={
                  p.current ? (
                    <Button variant="quiet" onClick={() => walk(null)}>
                      {t('kindling.leave')}
                    </Button>
                  ) : (
                    <Button onClick={() => walk(p.id)}>{t('kindling.take')}</Button>
                  )
                }
              />
            ))}
            <p className={k.note}>{t('kindling.pathsNote')}</p>
          </div>
        )}
      </Slot>
    </Panel>
  );
}
