// A player's record, Save and History (session 229). Save: check and mend it (every read mends, keeping the
// original), download it as a file, what was repaired, and the save itself. History: what admins have done
// to the player, newest first.
import type { AdminSaveResponse, AuditEntry, RecordResponse } from '@idle-clash/contracts';
import { t } from '@idle-clash/content';
import { Button, Panel, ResponsiveTable, type Column } from '@idle-clash/ui';
import { useEffect, useState } from 'react';
import { api } from '../api.ts';
import { dayOf, whenOf } from '../pages/days.ts';
import { untilLoaded } from '../Ready.tsx';
import { actionWords, detailWords } from './Audit.tsx';
import type { Run } from './Players.tsx';
import s from './admin.module.css';
import p from './pages.module.css';

/** Hands the save to the browser as a file named for the player and the day. */
function download(save: AdminSaveResponse) {
  const blob = new Blob([JSON.stringify(save.doc, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${save.player.name}-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function RecordSave({ id, run }: { id: string; run: Run }) {
  const [save, setSave] = useState<AdminSaveResponse | null>(null);
  useEffect(() => void run(() => untilLoaded(api.admin.save(id)), setSave), [id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!save) return null;
  return (
    <Panel title={t('record.save')}>
      <div className={s.player}>
        <div className={s.actions}>
          <Button onClick={() => void run(() => api.admin.mend(id), setSave)}>{t('admin.mend')}</Button>
          <Button onClick={() => download(save)}>{t('record.download')}</Button>
        </div>
        <h3>{t('admin.repairs')}</h3>
        {save.repairs.length === 0 ? (
          <p className={s.note}>{t('admin.noRepairs')}</p>
        ) : (
          <ul className={s.repairs}>
            {save.repairs.map((r) => (
              <li key={r.at}>
                {dayOf(r.at)}: {r.repairs.join('; ')}
              </li>
            ))}
          </ul>
        )}
        <h3>{t('admin.save')}</h3>
        <pre className={s.doc} data-scrolls tabIndex={0} aria-label={t('admin.save')}>
          {JSON.stringify(save.doc, null, 2)}
        </pre>
      </div>
    </Panel>
  );
}

export function RecordHistory({ record }: { record: RecordResponse }) {
  const columns: Column<AuditEntry>[] = [
    { key: 'when', label: t('console.audit.when'), cell: (e) => whenOf(e.at, record.at) },
    { key: 'admin', label: t('console.audit.admin'), cell: (e) => e.actor || t('console.audit.departed') },
    {
      key: 'action',
      label: t('console.audit.action'),
      cell: (e) => (
        <span className={p.actionCell}>
          <span>{actionWords(e.action)}</span>
          {detailWords(e) && <span className={p.muted}>{detailWords(e)}</span>}
        </span>
      ),
    },
  ];
  return (
    <Panel title={t('record.history')} flush={record.history.length > 0}>
      {record.history.length === 0 ? (
        <p className={s.note}>{t('record.noHistory')}</p>
      ) : (
        <ResponsiveTable
          caption={t('record.history')}
          columns={columns}
          rows={record.history}
          rowKey={(e) => String(e.id)}
        />
      )}
    </Panel>
  );
}
