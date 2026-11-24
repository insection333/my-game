// The admin console (session 227): its own frame outside the game's shell, for the console's own account
// and for players on the admin list. A bar across the top (the game's mark, who is signed in, Sign out or
// Back to the game), the sections down the side in the lodge's night on a wide screen and as a grid of
// links above the page on a phone, and the section open. Each section has its own address.
import { t } from '@idle-clash/content';
import { GameMark } from '@idle-clash/ui';
import { useEffect, type MouseEvent } from 'react';
import { account, useSession } from '../game/session.ts';
import { PageHead } from '../pages/PageHead.tsx';
import { NotFound } from '../pages/Simple.tsx';
import { Ready } from '../Ready.tsx';
import { navigate } from '../router.ts';
import { ClosedTest } from './ClosedTest.tsx';
import { MailMonitor } from './Mail.tsx';
import { Moderation } from './Moderation.tsx';
import { Audit } from './Audit.tsx';
import { Directory } from './Directory.tsx';
import { Overview } from './Overview.tsx';
import { PlayerRecord } from './Players.tsx';
import s from './console.module.css';

export const SECTIONS = [
  { id: 'overview', label: 'console.overview', lead: 'console.overview.lead' },
  { id: 'players', label: 'console.players', lead: 'console.players.lead' },
  { id: 'moderation', label: 'console.moderation', lead: 'console.moderation.lead' },
  { id: 'mail', label: 'console.mail', lead: 'console.mail.lead' },
  { id: 'test', label: 'console.test', lead: 'console.test.lead' },
  { id: 'audit', label: 'console.audit', lead: 'console.audit.lead' },
] as const;
export type SectionId = (typeof SECTIONS)[number]['id'];

/** The section an address opens (a player's record is in Players), or null for one the console lacks. */
export function sectionOf(path: string): SectionId | null {
  const m = /^\/admin(?:\/([a-z]+)(?:\/[^/]+)?)?$/.exec(path);
  if (!m) return null;
  if (!m[1]) return 'overview';
  if (path.split('/').length > 3 && m[1] !== 'players') return null;
  return SECTIONS.find((x) => x.id === m[1])?.id ?? null;
}

/** The player whose record an address opens. */
const recordOf = (path: string): string | null => {
  const m = /^\/admin\/players\/([^/]+)$/.exec(path);
  return m ? decodeURIComponent(m[1]) : null;
};

const go = (href: string) => (e: MouseEvent) => {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
  e.preventDefault();
  navigate(href);
};

function Body({ id, path }: { id: SectionId; path: string }) {
  const record = recordOf(path);
  if (id === 'overview') return <Overview />;
  if (id === 'players') return record ? <PlayerRecord id={record} /> : <Directory />;
  if (id === 'moderation') return <Moderation open={(p) => navigate(`/admin/players/${encodeURIComponent(p)}`)} />;
  if (id === 'mail') return <MailMonitor />;
  if (id === 'audit') return <Audit />;
  return <ClosedTest />;
}

function Section({ id, path }: { id: SectionId; path: string }) {
  const at = SECTIONS.find((x) => x.id === id)!;
  return (
    <>
      {!recordOf(path) && <PageHead title={t(at.label)} lead={t(at.lead)} />}
      <Body id={id} path={path} />
    </>
  );
}

export default function Console({ path }: { path: string }) {
  const { admin, staff, player } = useSession();
  const section = sectionOf(path);
  useEffect(() => {
    document.title = `${t('console.title')} · ${t('shell.name')}`;
  }, []);
  if (!admin) return <NotFound />;
  return (
    <div className={s.console}>
      <a className={s.skip} href="#console-main" data-ui="Link">
        {t('shell.skip')}
      </a>
      <header className={s.bar} data-chrome>
        <span className={s.brand}>
          <GameMark size={28} />
          <span className={s.brandName}>{t('shell.name')}</span>
          <span className={s.brandRole}>{t('console.title')}</span>
        </span>
        <span className={s.who}>
          <span className={s.whoName}>{t('console.signedInAs', { name: player?.name ?? '' })}</span>
          {/* Drawn for the bar's night, so it is its own control and not a page's Button (one control, one look). */}
          <button
            type="button"
            data-ui="ConsoleBarButton"
            className={s.barButton}
            onClick={() => (staff ? void account.signOut() : navigate('/'))}
          >
            {staff ? t('console.signOut') : t('console.back')}
          </button>
        </span>
      </header>
      <nav className={s.nav} aria-label={t('console.sections')} data-chrome>
        <ul>
          {SECTIONS.map((x) => {
            const href = x.id === 'overview' ? '/admin' : `/admin/${x.id}`;
            return (
              <li key={x.id}>
                <a
                  href={href}
                  data-ui="ConsoleLink"
                  className={s.navLink}
                  aria-current={section === x.id ? 'page' : undefined}
                  onClick={go(href)}
                >
                  {t(x.label)}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
      <main id="console-main" className={s.main} tabIndex={-1}>
        <div className={s.content}>
          {section ? <Section key={recordOf(path) ?? section} id={section} path={path} /> : <NotFound />}
        </div>
      </main>
      <Ready />
    </div>
  );
}
