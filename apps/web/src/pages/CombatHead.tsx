// The Combat page's title and its two tabs, Fight and Expeditions (IA.md); a tab's own strip (the
// regions on Fight) sits under them.
import { t } from '@idle-clash/content';
import { Tabs } from '@idle-clash/ui';
import type { ReactNode } from 'react';
import { navigate } from '../router.ts';
import { PageHead } from './PageHead.tsx';

export function CombatHead({ expeditions, children }: { expeditions?: boolean; children?: ReactNode }) {
  const tabs = [
    { href: '/combat', label: t('combat.tab.fight'), current: !expeditions },
    { href: '/combat/expeditions', label: t('combat.tab.expeditions'), current: !!expeditions },
  ];
  return (
    <PageHead title={t('combat.title')}>
      <Tabs tabs={tabs} label={t('combat.title')} onNavigate={navigate} />
      {children}
    </PageHead>
  );
}
