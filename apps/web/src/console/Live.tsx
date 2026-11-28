// The console's Live section (session 230, `/admin/live`): who has the game open now and who joined lately,
// each a press from their record; a letter to every player not banned, written here and asked once before it
// goes, as the game's own letter from the keepers of the realm; and the letters already sent to everyone.
// Since session 235 the realm's banner is put up and taken down here too.
import { BROADCAST_MAX, type LiveResponse } from '@idle-clash/contracts';
import { fmt, t } from '@idle-clash/content';
import { Button, Field, Panel, TextLink } from '@idle-clash/ui';
import { useEffect, useState } from 'react';
import { api } from '../api.ts';
import { handled } from '../game/session.ts';
import { dayOf, whenOf } from '../pages/days.ts';
import { untilLoaded } from '../Ready.tsx';
import { refused } from '../refused.ts';
import { navigate } from '../router.ts';
import { Slot } from '../slots.tsx';
import { useFresh } from './fresh.ts';
import { ConsoleBanner } from './ConsoleBanner.tsx';
import { Facts } from './RecordSummary.tsx';
import a from './admin.module.css';
import s from './pages.module.css';

const recordHref = (id: string) => `/admin/players/${encodeURIComponent(id)}`;
const named = (p: { id: string; name: string }) => (
  <TextLink href={recordHref(p.id)} onNavigate={navigate}>
    {p.name}
  </TextLink>
);

export function Live() {
  const [live, setLive] = useState<LiveResponse | null>(null);
  const [text, setText] = useState('');
  const [asking, setAsking] = useState(false);
  const [said, setSaid] = useState<{ text: string; bad: boolean } | null>(null);
  const load = () => untilLoaded(api.admin.live()).then(setLive, (err: unknown) => void handled(err));
  useEffect(() => void load(), []);
  // Who is online moves by the minute: read again while the page is in view (session 231).
  useFresh(() => void api.admin.live().then(setLive, (err: unknown) => void handled(err)));
  if (!live) return null;
  const send = async () => {
    setAsking(false);
    try {
      const r = await api.admin.broadcast(text.trim(), live.reach);
      if (r.ok) {
        setSaid({ text: t('console.letter.sent', { count: fmt.int(r.count) }), bad: false });
        setText('');
      } else setSaid({ text: t('console.letter.changed', { count: fmt.int(r.reach) }), bad: true });
      void load();
    } catch (err) {
      if (!handled(err)) setSaid({ text: refused(err), bad: true });
    }
  };
  const ready = text.trim().length >= 10;
  return (
    <div className={s.stack}>
      <Slot id="admin.live" className={s.columns}>
        <Panel title={t('console.online')} aside={fmt.int(live.online.length)}>
          {live.online.length ? (
            <ul className={s.names}>
              {live.online.map((p) => (
                <li key={p.id}>{named(p)}</li>
              ))}
            </ul>
          ) : (
            <p className={s.note}>{t('console.online.none')}</p>
          )}
        </Panel>
        <Panel title={t('console.joined')}>
          <Facts rows={live.joined.map((p) => [named(p), dayOf(p.createdAt, live.at)])} />
        </Panel>
        <ConsoleBanner live={live} reload={() => void load()} />
      </Slot>
      <Slot id="admin.letter" className={s.stack}>
        <Panel title={t('console.letter')}>
          <form className={s.form} onSubmit={(e) => (e.preventDefault(), setAsking(true))}>
            <p className={s.note}>{t('console.letter.lead', { count: fmt.int(live.reach) })}</p>
            <Field
              label={t('console.letter.text')}
              hint={t('console.letter.chars', { used: fmt.int(text.length), max: fmt.int(BROADCAST_MAX) })}
              rows={5}
              value={text}
              maxLength={BROADCAST_MAX}
              onChange={(e) => (setText(e.target.value), setSaid(null))}
            />
            {asking ? (
              <div className={a.ask} role="group" aria-label={t('console.letter.send')}>
                <p>{t('console.letter.ask', { count: fmt.int(live.reach) })}</p>
                <div className={a.actions}>
                  <Button variant="primary" onClick={() => void send()}>
                    {t('console.letter.yes')}
                  </Button>
                  <Button onClick={() => setAsking(false)}>{t('record.cancel')}</Button>
                </div>
              </div>
            ) : (
              <div className={a.actions}>
                <Button type="submit" variant="primary" disabled={!ready}>
                  {t('console.letter.send')}
                </Button>
              </div>
            )}
            {said && (
              <p className={said.bad ? a.error : s.note} data-said>
                {said.text}
              </p>
            )}
          </form>
        </Panel>
        <Panel title={t('console.letters')}>
          {live.sent.length ? (
            <ul className={s.letters}>
              {live.sent.map((l) => (
                <li key={l.at}>
                  <span className={s.muted}>
                    {t('console.letters.meta', {
                      when: whenOf(l.at, live.at),
                      admin: l.actor || t('console.audit.departed'),
                      count: fmt.int(l.count),
                    })}
                  </span>
                  <span>{l.text}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={s.note}>{t('console.letters.none')}</p>
          )}
        </Panel>
      </Slot>
    </div>
  );
}
