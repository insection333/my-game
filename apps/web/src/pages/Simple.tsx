// Pages whose features have not arrived yet show their title and purpose; their slots fill as
// the Storehouse and Hiscores (session 9) are built. The collection log is here
// since session 6.
import { t } from '@idle-clash/content';
import type { CollectionGroup } from '@idle-clash/features';
import { Panel, Tabs } from '@idle-clash/ui';
import { useGame } from '../game/hooks.ts';
import { navigate } from '../router.ts';
import { fills, Slot } from '../slots.tsx';
import { FindGrid } from './Finds.tsx';
import { ItemGrid } from './Items.tsx';
import { PageHead } from './PageHead.tsx';
import s from './pages.module.css';

export const Hiscores = () => <PageHead title={t('hiscores.title')} lead={t('hiscores.lead')} />;

export function Storehouse({ path }: { path: string }) {
  const tabs = [
    { href: '/storehouse', label: t('store.tab.items'), current: path === '/storehouse' },
    { href: '/storehouse/log', label: t('store.tab.log'), current: path === '/storehouse/log' },
  ];
  return (
    <>
      <PageHead title={t('store.title')}>
        <Tabs tabs={tabs} label={t('store.title')} onNavigate={navigate} />
      </PageHead>
      {path === '/storehouse/log' ? <CollectionLog /> : <ItemGrid />}
    </>
  );
}

/** Every skill's six finds, found or silhouetted, with how many of each skill's are found. */
function CollectionLog() {
  const { state, now, features } = useGame();
  const groups = fills<CollectionGroup>(features, 'collection.log', state, now);
  return (
    <Slot id="collection.log" className={s.stack}>
      {groups.map(({ feature, data }) => (
        <Panel key={feature} title={data.name} aside={data.progress} flush>
          <FindGrid finds={data.finds} />
        </Panel>
      ))}
    </Slot>
  );
}

export const NotFound = () => <PageHead title={t('notFound.title')} lead={t('notFound.lead')} />;
