// The realm's banner in the console (session 235, on Live): the banner standing now, with when it goes and who
// put it up, and Take it down; and a line to put up for every player, shown across the top of the game for an
// hour to a week. A new banner takes the old one's place, and shows again to players who put the old away.
import { BANNER_HOURS, BANNER_MAX, type LiveResponse } from '@idle-clash/contracts';
import { fmt, t } from '@idle-clash/content';
import { Button, Field, Panel } from '@idle-clash/ui';
import { useRef, useState, type FormEvent } from 'react';
import { api } from '../api.ts';
import { handled } from '../game/session.ts';
import { whenOf } from '../pages/days.ts';
import { refused } from '../refused.ts';
import a from './admin.module.css';
import m from './more.module.css';
import s from './pages.module.css';

const LONG: Record<(typeof BANNER_HOURS)[number], () => string> = {
  1: () => t('console.banner.hour'),
  6: () => t('console.banner.hours6'),
  24: () => t('console.banner.day'),
  72: () => t('console.banner.days3'),
  168: () => t('console.banner.week'),
};

export function ConsoleBanner({ live, reload }: { live: LiveResponse; reload: () => void }) {
  const [text, setText] = useState('');
  const [hours, setHours] = useState<(typeof BANNER_HOURS)[number]>(6);
  const [said, setSaid] = useState<{ text: string; bad: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  // One press at a time, held in a ref (session 236): a state set by the first click is not yet read by a
  // second in the same moment, so a double click put the banner up twice.
  const pressing = useRef(false);
  const act = async (go: () => Promise<unknown>, done: string) => {
    if (pressing.current) return;
    pressing.current = true;
    setBusy(true);
    try {
      await go();
      setSaid({ text: done, bad: false });
      reload();
    } catch (err) {
      if (!handled(err)) setSaid({ text: refused(err), bad: true });
    } finally {
      pressing.current = false;
      setBusy(false);
    }
  };
  const putUp = (e: FormEvent) => {
    e.preventDefault();
    void act(async () => {
      await api.admin.banner(text.trim(), hours);
      setText('');
    }, t('console.banner.up'));
  };
  const b = live.banner;
  return (
    <Panel title={t('console.banner')}>
      <div className={s.stack}>
        {b ? (
          <div className={m.standing}>
            <p className={s.muted}>
              {t('console.banner.standing', {
                until: whenOf(b.until, live.at),
                admin: b.actor || t('console.audit.departed'),
              })}
            </p>
            <p className={m.bannerText}>{b.text}</p>
            <div>
              <Button onClick={() => void act(() => api.admin.bannerDown(), t('console.banner.downDone'))}>
                {t('console.banner.down')}
              </Button>
            </div>
          </div>
        ) : (
          <p className={s.note}>{t('console.banner.none')}</p>
        )}
        <form className={s.form} onSubmit={putUp}>
          <Field
            label={b ? t('console.banner.another') : t('console.banner.text')}
            hint={t('console.banner.chars', { used: fmt.int(text.length), max: fmt.int(BANNER_MAX) })}
            rows={5}
            value={text}
            maxLength={BANNER_MAX}
            onChange={(e) => (setText(e.target.value), setSaid(null))}
          />
          <div role="group" aria-label={t('console.banner.for')} className={m.choices}>
            <span className={m.choicesName} aria-hidden="true">
              {t('console.banner.for')}
            </span>
            {BANNER_HOURS.map((h) => (
              <Button
                key={h}
                variant={h === hours ? 'primary' : 'secondary'}
                aria-pressed={h === hours}
                onClick={() => setHours(h)}
              >
                {LONG[h]()}
              </Button>
            ))}
          </div>
          <div className={a.actions}>
            <Button type="submit" variant="primary" disabled={busy || text.trim().length < 10}>
              {t('console.banner.putUp')}
            </Button>
          </div>
          {said && (
            <p className={said.bad ? a.error : s.note} data-said>
              {said.text}
            </p>
          )}
        </form>
      </div>
    </Panel>
  );
}
