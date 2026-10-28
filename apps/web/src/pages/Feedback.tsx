// Feedback from Settings (the closed test, session 18): a line opens a short form; what is written goes
// to the team with the page the player came from, and the form says it arrived.
import { t } from '@idle-clash/content';
import { FEEDBACK_MAX } from '@idle-clash/contracts';
import { Button, Field } from '@idle-clash/ui';
import { useState, type FormEvent } from 'react';
import { api } from '../api.ts';
import s from './pages.module.css';

/** The page behind the sheet: where the player was when they opened Settings. */
const pageOf = () => {
  const url = new URL(location.href);
  url.searchParams.delete('panel');
  return `${url.pathname}${url.search}`.slice(0, 200);
};

export function Feedback() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [state, setState] = useState<'writing' | 'sending' | 'sent'>('writing');
  const [error, setError] = useState<string | null>(null);
  if (state === 'sent')
    return (
      <p className={s.feedbackSent} role="status">
        {t('feedback.sent')}
      </p>
    );
  if (!open)
    return (
      <div className={s.feedback}>
        <Button variant="quiet" onClick={() => setOpen(true)}>
          {t('feedback.title')}
        </Button>
      </div>
    );
  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return setError(t('feedback.empty'));
    setState('sending');
    try {
      await api.feedback(text.trim(), pageOf());
      setState('sent');
    } catch {
      setError(t('error.other'));
      setState('writing');
    }
  };
  return (
    <form className={s.feedback} onSubmit={(e) => void send(e)}>
      <p>{t('feedback.lead')}</p>
      <Field
        label={t('feedback.label')}
        rows={5}
        value={text}
        error={error}
        maxLength={FEEDBACK_MAX}
        onChange={(e) => {
          setText(e.target.value);
          setError(null);
        }}
      />
      <div className={s.dangerActions}>
        <Button type="submit" variant="primary" disabled={state === 'sending'}>
          {t('feedback.send')}
        </Button>
      </div>
    </form>
  );
}
