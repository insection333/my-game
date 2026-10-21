// The privacy page and the terms of use: short sections in plain words, readable signed in (inside
// the shell) or signed out (from the welcome page).
import { t } from '@idle-clash/content';
import { TextLink } from '@idle-clash/ui';
import { navigate } from '../router.ts';
import { Slot } from '../slots.tsx';
import { PageHead } from './PageHead.tsx';
import s from './pages.module.css';

export type LegalPage = 'privacy' | 'terms';
export const legalPage = (path: string): LegalPage | null =>
  path === '/privacy' ? 'privacy' : path === '/terms' ? 'terms' : null;

/** `standalone`: signed out, with no shell around it, so it brings its own frame. */
export function Legal({ page, back, standalone }: { page: LegalPage; back?: string; standalone?: boolean }) {
  const sections = t(page === 'privacy' ? 'legal.privacy.body' : 'legal.terms.body')
    .split('\n\n')
    .map((part) => {
      const [title, ...body] = part.split('\n');
      return { title, body: body.join(' ') };
    });
  const body = (
    <Slot id="legal.text" className={s.legal}>
      <PageHead
        title={page === 'privacy' ? t('legal.privacy.title') : t('legal.terms.title')}
        lead={page === 'privacy' ? t('legal.privacy.updated') : t('legal.terms.updated')}
      />
      {sections.map((sec) => (
        <section key={sec.title} className={s.legalSection}>
          <h2>{sec.title}</h2>
          <p>{sec.body}</p>
        </section>
      ))}
      <p className={s.legalLinks}>
        {back && (
          <TextLink href={back} onNavigate={navigate}>
            {t('legal.back')}
          </TextLink>
        )}
        {page === 'privacy' ? (
          <TextLink href="/terms" onNavigate={navigate}>
            {t('legal.terms.title')}
          </TextLink>
        ) : (
          <TextLink href="/privacy" onNavigate={navigate}>
            {t('legal.privacy.title')}
          </TextLink>
        )}
      </p>
    </Slot>
  );
  return standalone ? (
    <main className={s.standalone} id="main">
      {body}
    </main>
  ) : (
    body
  );
}
