// Notices while away in Settings (session 171): off until switched on here (or from the offer on a return),
// with what they say and when they come; where this browser cannot take them, why.
import { t } from '@idle-clash/content';
import { useEffect, useState } from 'react';
import { pushOff, pushOn, pushState, type PushState } from '../push.ts';
import { refused } from '../refused.ts';
import s from './pages.module.css';

/** Why this browser cannot take notices, as it can be fixed. */
const WHY: Record<'blocked' | 'install' | 'unsupported', () => string> = {
  blocked: () => t('settings.push.blocked'),
  install: () => t('settings.push.install'),
  unsupported: () => t('settings.push.unsupported'),
};

export function PushChoices() {
  const [state, setState] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    void pushState().then(setState);
  }, []);
  const choose = async (on: boolean) => {
    setBusy(true);
    setError('');
    try {
      setState(await (on ? pushOn() : pushOff()));
    } catch (err) {
      setError(refused(err));
      setState(await pushState());
    }
    setBusy(false);
  };
  const can = state === 'on' || state === 'off';
  return (
    <fieldset className={s.choices} data-slot="settings.push">
      <legend>{t('settings.push')}</legend>
      <p className={s.choiceNote}>{t('settings.push.about')}</p>
      {can &&
        (
          [
            ['off', t('settings.push.off')],
            ['on', t('settings.push.on')],
          ] as const
        ).map(([v, label]) => (
          <label key={v} className={s.choice}>
            <input
              type="radio"
              name="push"
              data-ui="Radio"
              checked={state === v}
              disabled={busy}
              onChange={() => void choose(v === 'on')}
            />
            {label}
          </label>
        ))}
      {state && !can && <p className={s.choiceNote}>{WHY[state]()}</p>}
      {error && (
        <p className={s.choiceNote} role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}
