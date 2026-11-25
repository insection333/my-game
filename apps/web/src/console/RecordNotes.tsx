// Notes on a player (session 234), kept by admins for each other: what was asked and answered, what was given
// back and why, what to watch for. The player never sees them; each written or struck out is in the Audit
// log. Shown first on the record's Summary, newest first, with a box to keep another.
import { NOTE_MAX, type RecordResponse } from '@idle-clash/contracts';
import { fmt, t } from '@idle-clash/content';
import { Button, Field, Panel } from '@idle-clash/ui';
import { useState, type FormEvent } from 'react';
import { api } from '../api.ts';
import { whenOf } from '../pages/days.ts';
import type { Run } from './Players.tsx';
import m from './more.module.css';
import s from './pages.module.css';

export function RecordNotes({ record, reload, run }: { record: RecordResponse; reload: () => void; run: Run }) {
  const notes = record.notes;
  const [text, setText] = useState('');
  const keep = (e: FormEvent) => {
    e.preventDefault();
    void run(
      () => api.admin.note(record.id, text.trim()),
      (r) => {
        if (!r.ok) return;
        setText('');
        reload();
      },
    );
  };
  const strike = (id: number) => void run(() => api.admin.unnote(record.id, id), reload);
  return (
    <Panel title={t('record.notes')} aside={notes.length ? fmt.int(notes.length) : undefined}>
      <div className={m.notes}>
        {notes.length ? (
          <ul className={m.noteList} aria-label={t('record.notes')}>
            {notes.map((n) => (
              <li key={n.id}>
                <span className={s.muted}>
                  {t('record.noteMeta', {
                    when: whenOf(n.at, record.at),
                    admin: n.actor || t('console.audit.departed'),
                  })}
                </span>
                <span className={m.noteText}>{n.text}</span>
                <Button
                  variant="quiet"
                  onClick={() => strike(n.id)}
                  aria-label={t('record.strikeNamed', { when: whenOf(n.at, record.at) })}
                >
                  {t('record.strike')}
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className={s.note}>{t('record.noNotes')}</p>
        )}
        <form className={s.form} onSubmit={keep}>
          <Field
            label={t('record.noteField')}
            hint={t('record.noteHint', { max: fmt.int(NOTE_MAX) })}
            rows={3}
            value={text}
            maxLength={NOTE_MAX}
            onChange={(e) => setText(e.target.value)}
          />
          <div>
            <Button type="submit" variant="primary" disabled={text.trim().length < 3}>
              {t('record.keepNote')}
            </Button>
          </div>
        </form>
      </div>
    </Panel>
  );
}
