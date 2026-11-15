// A fault caught where it happens (session 108): a page, or the game around it, that throws while drawing
// says so, is reported to the server's log, and offers Reload, where the whole game went blank with no
// word and no report. Around a page (keyed by its address) the header and menu stay, and going to another
// page clears it; around the game it catches a fault in the shell itself, as the lanes' was.
import { t } from '@idle-clash/content';
import { Button } from '@idle-clash/ui';
import { Component, type ReactNode } from 'react';
import { report } from './errors.ts';
import { PageHead } from './pages/PageHead.tsx';
import s from './pages/pages.module.css';

interface Props {
  children: ReactNode;
  /** Drawn without the shell around it (a fault in the shell itself). */
  bare?: boolean;
}

export class Fault extends Component<Props, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  override componentDidCatch(err: unknown) {
    report(err);
  }

  override render() {
    if (!this.state.failed) return this.props.children;
    const said = (
      <PageHead title={t('fault.title')} lead={t('fault.lead')}>
        <Button variant="primary" className={s.faultReload} onClick={() => location.reload()}>
          {t('fault.reload')}
        </Button>
      </PageHead>
    );
    return this.props.bare ? <main className={s.faultBare}>{said}</main> : said;
  }
}
