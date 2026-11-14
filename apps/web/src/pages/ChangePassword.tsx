// Changing one's own password from Settings (session 105): a line opens a short form asking for the current
// password and a new one; the page it is changed from stays signed in, every other session ends, and the
// form says it is done. Until then a player had no way to, even after an admin's reset handed them one.
import { t } from '@idle-clash/content';
import { passwordOk } from '@idle-clash/contracts';
import { Button, Field } from '@idle-clash/ui';
import { useState, type FormEvent } from 'react';
import { api, ApiError } from '../api.ts';
import s from './pages.module.css';

export function ChangePassword() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [state, setState] = useState<'writing' | 'saving' | 'done'>('writing');
  const [errors, setErrors] = useState<{ current?: string; next?: string }>({});
  if (state === 'done')
    return (
      <p className={s.feedbackSent} role="status">
        {t('settings.password.done')}
      </p>
    );
  if (!open)
    return (
      <div className={s.feedback}>
        <Button variant="quiet" onClick={() => setOpen(true)}>
          {t('settings.password')}
        </Button>
      </div>
    );
  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!passwordOk(next)) return setErrors({ next: t('error.password') });
    setState('saving');
    try {
      await api.changePassword(current, next);
      setState('done');
    } catch (err) {
      setErrors(
        err instanceof ApiError && err.code === 'wrongPassword'
          ? { current: t('settings.delete.wrong') }
          : { next: t('error.other') },
      );
      setState('writing');
    }
  };
  return (
    <form className={s.feedback} onSubmit={(e) => void save(e)}>
      <Field
        label={t('settings.password.current')}
        type="password"
        autoComplete="current-password"
        value={current}
        error={errors.current}
        onChange={(e) => {
          setCurrent(e.target.value);
          setErrors({});
        }}
        required
      />
      <Field
        label={t('settings.password.new')}
        type="password"
        autoComplete="new-password"
        hint={t('welcome.password.hint')}
        value={next}
        error={errors.next}
        onChange={(e) => {
          setNext(e.target.value);
          setErrors({});
        }}
        required
      />
      <p className={s.muted}>{t('settings.password.others')}</p>
      <div className={s.dangerActions}>
        <Button type="submit" variant="primary" disabled={state === 'saving' || !current || !next}>
          {t('settings.password.save')}
        </Button>
        <Button variant="secondary" onClick={() => setOpen(false)}>
          {t('settings.password.cancel')}
        </Button>
      </div>
    </form>
  );
}
