// The console's account choosing its own password (session 237). At the first sign-in, while it holds the
// first password it was made with, this is all the console shows ("Choose your own password"), and every
// admin route refuses it until it is done; after that it stands at `/admin/password`, from the name in the
// bar and from Go to. The current password, then a new one of the players' length that is neither the one it
// replaces nor the first; the console's other sessions end, this one stays.
import { t } from '@idle-clash/content';
import { passwordOk } from '@idle-clash/contracts';
import { Button, Field, Panel } from '@idle-clash/ui';
import { useRef, useState, type FormEvent } from 'react';
import { api, ApiError } from '../api.ts';
import { handled, passwordChosen } from '../game/session.ts';
import { PageHead } from '../pages/PageHead.tsx';
import { refused } from '../refused.ts';
import a from './admin.module.css';
import s from './pages.module.css';

export function ConsolePassword({ first }: { first: boolean }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [errors, setErrors] = useState<{ current?: string; next?: string; again?: string }>({});
  const [done, setDone] = useState(false);
  const pressing = useRef(false);
  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (pressing.current) return;
    if (!passwordOk(next)) return setErrors({ next: t('error.password') });
    if (next !== again) return setErrors({ again: t('console.password.mismatch') });
    pressing.current = true;
    try {
      await api.consolePassword(current, next);
      setDone(true);
      setCurrent('');
      setNext('');
      setAgain('');
      passwordChosen();
    } catch (err) {
      if (!handled(err))
        setErrors(
          err instanceof ApiError && err.code === 'samePassword'
            ? { next: t('console.password.same') }
            : { current: refused(err, { wrongPassword: t('settings.delete.wrong') }) },
        );
    } finally {
      pressing.current = false;
    }
  };
  return (
    <>
      <PageHead
        title={first ? t('console.password.firstTitle') : t('console.password.title')}
        lead={first ? t('console.password.firstLead') : t('console.password.lead')}
      />
      <Panel>
        <form className={s.form} onSubmit={(e) => void save(e)}>
          <Field
            label={first ? t('console.password.firstCurrent') : t('settings.password.current')}
            type="password"
            autoComplete="current-password"
            value={current}
            error={errors.current}
            onChange={(e) => (setCurrent(e.target.value), setErrors({}), setDone(false))}
            required
          />
          <Field
            label={t('settings.password.new')}
            type="password"
            autoComplete="new-password"
            hint={t('welcome.password.hint')}
            value={next}
            error={errors.next}
            onChange={(e) => (setNext(e.target.value), setErrors({}), setDone(false))}
            required
          />
          <Field
            label={t('console.password.again')}
            type="password"
            autoComplete="new-password"
            value={again}
            error={errors.again}
            onChange={(e) => (setAgain(e.target.value), setErrors({}), setDone(false))}
            required
          />
          <p className={s.note}>{t('console.password.others')}</p>
          <div className={a.actions}>
            <Button type="submit" variant="primary" disabled={!current || !next || !again}>
              {t('console.password.save')}
            </Button>
          </div>
          {done && (
            <p className={s.note} data-said>
              {t('console.password.done')}
            </p>
          )}
        </form>
      </Panel>
    </>
  );
}
