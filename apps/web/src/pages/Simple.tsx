// Pages whose features have not arrived yet show their title and purpose; their slots fill as
// Combat (session 8), the Storehouse and Hiscores (session 9) are built.
import { t } from '@idle-clash/content';
import { Tabs } from '@idle-clash/ui';
import { navigate } from '../router.ts';
import { PageHead } from './PageHead.tsx';

export const Combat = () => <PageHead title={t('combat.title')} lead={t('combat.lead')} />;
export const Hiscores = () => <PageHead title={t('hiscores.title')} lead={t('hiscores.lead')} />;

export function Storehouse({ path }: { path: string }) {
  const tabs = [
    { href: '/storehouse', label: t('store.tab.items'), current: path === '/storehouse' },
    { href: '/storehouse/log', label: t('store.tab.log'), current: path === '/storehouse/log' },
  ];
  return (
    <PageHead title={t('store.title')} lead={t('store.lead')}>
      <Tabs tabs={tabs} label={t('store.title')} onNavigate={navigate} />
    </PageHead>
  );
}

export const NotFound = () => <PageHead title={t('notFound.title')} lead={t('notFound.lead')} />;
