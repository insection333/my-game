// A player's activity (session 234, the record's Activity tab): the days they came in the last twelve weeks,
// drawn as a calendar (a column a week, Monday at the top); the browsers signed in, each of which can be
// signed out alone (Account's press signs out every one); and the last notices the game sent them, in its
// words. Read as the tab opens.
import { ACTIVITY_DAYS, type ActivityResponse, type RecordResponse } from '@idle-clash/contracts';
import { fmt, t } from '@idle-clash/content';
import { Button, Panel, Pill } from '@idle-clash/ui';
import { useEffect, useState } from 'react';
import { api } from '../api.ts';
import { handled } from '../game/session.ts';
import { dayOf, whenOf } from '../pages/days.ts';
import { untilLoaded } from '../Ready.tsx';
import type { Run } from './Players.tsx';
import m from './more.module.css';
import s from './pages.module.css';

const DAY = 86_400_000;
const WEEKS = ACTIVITY_DAYS / 7;

/** The calendar's days, a column a week from the Monday eleven weeks before this one, Monday first; a day
 *  after today is null. */
export function calendarOf(now: number): (string | null)[] {
  const today = new Date(new Date(now).toISOString().slice(0, 10)).getTime();
  const monday = today - ((new Date(today).getUTCDay() + 6) % 7) * DAY - (WEEKS - 1) * 7 * DAY;
  return Array.from({ length: WEEKS * 7 }, (_, i) => {
    const at = monday + i * DAY;
    return at > today ? null : new Date(at).toISOString().slice(0, 10);
  });
}

function Calendar({ a }: { a: ActivityResponse }) {
  const came = new Set(a.days);
  const days = calendarOf(a.at);
  const shown = days.filter((d) => d !== null).length;
  const count = days.filter((d) => d !== null && came.has(d)).length;
  const words = t('record.daysPlayed', { count: fmt.int(count), days: fmt.int(shown) });
  return (
    <Panel title={t('record.calendar')} aside={words}>
      <div className={m.calendar} role="img" aria-label={words}>
        {days.map((d, i) => (
          <span
            key={i}
            className={m.day}
            data-came={d !== null && came.has(d) ? '' : undefined}
            data-future={d === null ? '' : undefined}
            title={
              d === null
                ? undefined
                : came.has(d)
                  ? t('record.dayCame', { day: dayOf(Date.parse(`${d}T12:00:00Z`), a.at) })
                  : t('record.dayMissed', { day: dayOf(Date.parse(`${d}T12:00:00Z`), a.at) })
            }
          />
        ))}
      </div>
      <p className={s.note}>{t('record.calendarNote')}</p>
    </Panel>
  );
}

export function RecordActivity({ record, run }: { record: RecordResponse; run: Run }) {
  const [a, setA] = useState<ActivityResponse | null>(null);
  const [said, setSaid] = useState<string | null>(null);
  const load = () => untilLoaded(api.admin.activity(record.id)).then(setA, (err: unknown) => void handled(err));
  useEffect(() => void load(), [record.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!a) return null;
  const end = (handle: string) =>
    void run(
      () => api.admin.endSession(record.id, handle),
      () => {
        setSaid(t('record.browserEnded'));
        void load();
      },
    );
  return (
    <div className={s.columns}>
      <div className={s.wide}>
        <Calendar a={a} />
      </div>
      <Panel title={t('record.browsers')} aside={fmt.int(a.sessions.length)}>
        {a.sessions.length ? (
          <ul className={m.browsers}>
            {a.sessions.map((x) => (
              <li key={x.handle}>
                <span className={m.browserWords}>
                  <span>{t('record.browserSeen', { when: whenOf(x.lastSeenAt, a.at) })}</span>
                  <span className={s.muted}>
                    {t('record.browserMeta', { since: dayOf(x.createdAt, a.at), until: dayOf(x.expiresAt, a.at) })}
                  </span>
                  {x.online && (
                    <span>
                      <Pill tone="moss">{t('record.online')}</Pill>
                    </span>
                  )}
                </span>
                <Button onClick={() => end(x.handle)}>{t('record.endBrowser')}</Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className={s.note}>{t('record.noBrowsers')}</p>
        )}
        {said && (
          <p className={s.note} role="status">
            {said}
          </p>
        )}
      </Panel>
      <div className={m.span2}>
        <Panel title={t('record.notices')}>
          {a.notices.length ? (
            <ul className={s.letters}>
              {a.notices.map((n, i) => (
                <li key={`${n.at}-${i}`}>
                  <span className={s.muted}>{whenOf(n.at, a.at)}</span>
                  <span>{n.text}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={s.note}>{t('record.noNotices')}</p>
          )}
        </Panel>
      </div>
    </div>
  );
}
