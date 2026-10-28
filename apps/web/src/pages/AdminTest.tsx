// The players on the admin page (docs/CLOSED_TEST.md), two panels under the player search: each player's
// days, whether they came back on their second and third, their total level and what the Hearth asks of
// them now; and the feedback sent from Settings, newest first, each note and all of them copyable as
// plain text to pass on. Each list scrolls in its own box, so no panel outgrows a phone's screen.
import { fmt, t } from '@idle-clash/content';
import type { AdminTestResponse, TesterView } from '@idle-clash/contracts';
import { ActionRow, Panel, Pill } from '@idle-clash/ui';
import { useEffect, useState } from 'react';
import { api } from '../api.ts';
import { handled } from '../game/session.ts';
import { Slot } from '../slots.tsx';
import s from './admin.module.css';
import { CopyButton } from './CopyButton.tsx';
import { feedbackNote, feedbackNotes } from './feedback-copy.ts';

export function AdminTest() {
  const [view, setView] = useState<AdminTestResponse | null>(null);
  useEffect(() => void api.admin.test().then(setView, (err: unknown) => void handled(err)), []);
  if (!view) return null;
  return (
    <Slot id="admin.test" className={s.test}>
      <Panel title={t('admin.test.testers')} flush>
        {view.testers.length === 0 ? (
          <p className={s.note}>{t('admin.test.noPlayers')}</p>
        ) : (
          <div className={s.testers} tabIndex={0} aria-label={t('admin.test.testers')}>
            {view.testers.map((p) => (
              <Tester key={p.name} p={p} />
            ))}
          </div>
        )}
      </Panel>
      <Panel
        title={t('admin.test.feedback')}
        aside={
          view.feedback.length > 0 && (
            <CopyButton label={t('admin.test.copyAll')} text={() => feedbackNotes(view.feedback)} />
          )
        }
        flush
      >
        {view.feedback.length === 0 ? (
          <p className={s.note}>{t('admin.test.noFeedback')}</p>
        ) : (
          <ul className={s.list} tabIndex={0} aria-label={t('admin.test.feedback')}>
            {view.feedback.map((f) => (
              <li key={`${f.at}-${f.name ?? ''}-${f.text.length}`}>
                <div className={s.noteHead}>
                  <p className={s.muted}>
                    {t('admin.test.from', {
                      name: f.name ?? t('admin.test.someone'),
                      page: f.page,
                      date: fmt.date(f.at),
                    })}
                  </p>
                  <CopyButton label={t('admin.test.copy')} text={() => feedbackNote(f)} />
                </div>
                <p className={s.said}>{f.text}</p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </Slot>
  );
}

function Tester({ p }: { p: TesterView }) {
  return (
    <ActionRow
      name={p.name}
      facts={[
        t('admin.joined', { date: fmt.date(p.joinedAt) }),
        p.daysPlayed === 1 ? t('admin.test.dayOne') : t('admin.test.days', { days: fmt.int(p.daysPlayed) }),
        t('admin.totalLevel', { level: fmt.int(p.totalLevel) }),
        p.aims.length ? t('admin.test.aims', { aims: p.aims.join('; ') }) : t('admin.test.noAims'),
      ]}
      status={
        <span className={s.pills}>
          <Back day={2} back={p.day2} />
          <Back day={3} back={p.day3} />
        </span>
      }
    />
  );
}

/** Whether a tester came back on their second or third day: yes, no, or that day still to come. */
const BACK = {
  2: { yes: 'admin.test.day2', no: 'admin.test.notBack2', soon: 'admin.test.day2Soon' },
  3: { yes: 'admin.test.day3', no: 'admin.test.notBack3', soon: 'admin.test.day3Soon' },
} as const;
function Back({ day, back }: { day: 2 | 3; back: boolean | null }) {
  const words = BACK[day];
  if (back === null) return <Pill>{t(words.soon)}</Pill>;
  return back ? <Pill tone="moss">{t(words.yes)}</Pill> : <Pill tone="ember">{t(words.no)}</Pill>;
}
