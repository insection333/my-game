// The sheet behind the bell (session 45): Notices and Messages as two tabs, each with its own address
// (`?panel=tray`, `?panel=tray&tray=mail`, and `&to=Name` to write to someone from their card).
import { fmt, t } from '@idle-clash/content';
import { Sheet, Tabs } from '@idle-clash/ui';
import { useUnreadMail } from '../game/mail.ts';
import { navigate, trayHref, useLocation } from '../router.ts';
import { Messages } from './Mail.tsx';
import { Tray } from './Panels.tsx';

export function TraySheet({ onClose }: { onClose: () => void }) {
  useLocation();
  const view = new URLSearchParams(location.search).get('tray') === 'mail' ? 'mail' : 'notices';
  const unread = useUnreadMail();
  const messages = t('tray.messages');
  return (
    <Sheet
      title={view === 'mail' ? messages : t('tray.notices')}
      closeLabel={t('shell.close')}
      onClose={onClose}
      slot="tray.list"
    >
      <Tabs
        label={t('tray.views')}
        onNavigate={navigate}
        tabs={[
          { href: trayHref('notices'), label: t('tray.notices'), current: view === 'notices' },
          {
            href: trayHref('mail'),
            label: unread ? `${messages} (${fmt.int(unread)})` : messages,
            current: view === 'mail',
          },
        ]}
      />
      {view === 'mail' ? <Messages /> : <Tray />}
    </Sheet>
  );
}
