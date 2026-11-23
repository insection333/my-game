// The week's contract on the Hearth (session 172): one row under the day's goal, with its tasks beneath its
// name, each ticked when done with its count, and Swap on a task not yet done, once a week.
import { t } from '@idle-clash/content';
import type { GoalRow } from '@idle-clash/features';
import { ActionRow, Button, Pill, ProgressBar } from '@idle-clash/ui';
import { useState } from 'react';
import { game } from '../game/store.ts';
import s from './week.module.css';

export function WeekGoal({ row }: { row: GoalRow & { parts: NonNullable<GoalRow['parts']> } }) {
  const b = row.button;
  // Its tasks open under it on a press, so the goals stay on a phone's first screen.
  const [open, setOpen] = useState(false);
  return (
    <ActionRow
      name={row.name}
      facts={[row.reward]}
      status={row.count ? <Pill tone={row.state === 'claimed' ? 'moss' : undefined}>{row.count}</Pill> : undefined}
      progress={row.state !== 'claimed' && <ProgressBar value={row.progress} label={row.name} />}
      foot={
        <div className={s.foot} data-slot="goals.week">
          <Button variant="quiet" aria-expanded={open} onClick={() => setOpen(!open)}>
            {t(open ? 'goals.week.hide' : 'goals.week.show')}
          </Button>
          {open && (
            <ul className={s.tasks}>
              {row.parts.map((p, i) => (
                <li key={i} className={s.task} data-done={p.done || undefined}>
                  <span className={s.mark} aria-hidden="true">
                    {p.done ? '✓' : ''}
                  </span>
                  <span className={s.text}>{p.text}</span>
                  <span className={s.count}>{p.count}</span>
                  {p.swap && (
                    <Button variant="quiet" onClick={() => game.act(p.swap!.feature, p.swap!.route, p.swap!.input)}>
                      {t('goals.week.swap')}
                    </Button>
                  )}
                </li>
              ))}
              {row.note && <li className={s.turns}>{row.note}</li>}
            </ul>
          )}
        </div>
      }
      actions={
        b &&
        'claim' in b && (
          <Button variant="primary" onClick={() => game.act('goals', 'claim', { goal: b.claim })}>
            {b.label}
          </Button>
        )
      }
    />
  );
}
