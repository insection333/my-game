// One row for anything a lane can do: an action, a recipe, a foe. The same row in every skill.
import { useId, type ReactNode } from 'react';
import s from './ActionRow.module.css';

export interface ActionRowProps {
  icon?: ReactNode;
  /** The icon gives way to the words on the narrowest rows (a 320 px phone), for rows whose buttons are
   *  long (Castle Clash's costs); otherwise it stays at every width. */
  iconYields?: boolean;
  name: string;
  /** Short facts, each formatted already: "7.5 s", "5,400 XP an hour", "Pine logs ×1". */
  facts: string[];
  /** A status shown beside the name: mastery, a verdict, "Opens at level 14". */
  status?: ReactNode;
  /** Progress under the facts, such as towards the next mastery step. */
  progress?: ReactNode;
  actions?: ReactNode;
  /** Lesser presses on a line of their own under the row, side by side, beneath the name (session 133):
   *  a troop's Drill and Drill ×5, a relic's Wear or Take off, a lord's Plan, where they were stacked
   *  over the row's button with room to spare, or wrapped one under the other in a narrow column. */
  foot?: ReactNode;
  /** The row's button is too wide to sit beside the name on a narrow row (a lord's Strike back, a
   *  relic's Temper): there the name takes its line, and the foot and the button share the next, the
   *  foot at the left and the button at the right, where each took a line of its own. */
  wide?: boolean;
  locked?: boolean;
}

export function ActionRow({
  icon,
  iconYields,
  name,
  facts,
  status,
  progress,
  actions,
  foot,
  wide,
  locked,
}: ActionRowProps) {
  // A group named by the row's name: a screen reader says "Pine tree" on entering it, so its "Start"
  // and "Next" are heard with what they start.
  const id = useId();
  return (
    <div data-ui="ActionRow" data-locked={locked || undefined} className={s.row} role="group" aria-labelledby={id}>
      <div
        className={s.grid}
        data-icon={icon ? true : undefined}
        data-yields={(icon && iconYields) || undefined}
        data-wide={wide || undefined}
      >
        {icon && <div className={s.icon}>{icon}</div>}
        <div className={s.main} data-part="main">
          <div className={s.title}>
            <span className={s.name} id={id}>
              {name}
            </span>
            {status}
          </div>
          <div className={s.facts}>
            {facts.map((f) => (
              <span key={f}>{f}</span>
            ))}
          </div>
          {progress && <div className={s.progress}>{progress}</div>}
        </div>
        {actions && <div className={s.actions}>{actions}</div>}
        {foot && <div className={s.foot}>{foot}</div>}
      </div>
    </div>
  );
}
