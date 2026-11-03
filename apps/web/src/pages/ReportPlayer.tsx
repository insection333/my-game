// Reporting a player (session 39), wherever their name is shown to others: their profile card (session 44)
// and a lord's sheet in the War. Two reasons, no words of one's own; never shown for one's own name. Once
// sent it says so, and the same whatever the server made of it.
import { REPORT_REASONS, type ReportReason } from '@idle-clash/contracts';
import { t } from '@idle-clash/content';
import { Button } from '@idle-clash/ui';
import { useState } from 'react';
import { api } from '../api.ts';
import { handled, useSession } from '../game/session.ts';
import s from './report.module.css';

const REASON: Record<ReportReason, string> = { name: 'report.name', cheating: 'report.cheating' };

export function ReportPlayer({ name }: { name: string }) {
  const { player } = useSession();
  const [state, setState] = useState<'ready' | 'sending' | 'sent' | 'failed'>('ready');
  if (!player || player.name.toLowerCase() === name.toLowerCase()) return null;
  const send = async (reason: ReportReason) => {
    setState('sending');
    try {
      await api.report(name, reason);
      setState('sent');
    } catch (err) {
      setState(handled(err) ? 'ready' : 'failed');
    }
  };
  return (
    <div className={s.report} data-slot="player.report">
      <h3>{t('report.title')}</h3>
      {state === 'sent' ? (
        <p role="status">{t('report.sent')}</p>
      ) : (
        <div className={s.reasons}>
          {REPORT_REASONS.map((r) => (
            <Button key={r} variant="quiet" disabled={state === 'sending'} onClick={() => void send(r)}>
              {t(REASON[r])}
            </Button>
          ))}
        </div>
      )}
      {state === 'failed' && <p role="status">{t('report.failed')}</p>}
    </div>
  );
}
