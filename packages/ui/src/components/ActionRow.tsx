// One row for anything a lane can do: an action, a recipe, a foe. The same row in every skill.
import { useId, type ReactNode } from 'react';
import s from './ActionRow.module.css';

export interface ActionRowProps {
  icon?: ReactNode;
  name: string;
  /** Short facts, each formatted already: "7.5 s", "5,400 XP an hour", "Pine logs ×1". */
  facts: string[];
  /** A status shown beside the name: mastery, a verdict, "Opens at level 14". */
  status?: ReactNode;
  /** Progress under the facts, such as towards the next mastery step. */
  progress?: ReactNode;
  actions?: ReactNode;
  locked?: boolean;
}

export function ActionRow({ icon, name, facts, status, progress, actions, locked }: ActionRowProps) {
  // A group named by the row's name: a screen reader says "Pine tree" on entering it, so its "Start"
  // and "Next" are heard with what they start.
  const id = useId();
  return (
    <div data-ui="ActionRow" data-locked={locked || undefined} className={s.row} role="group" aria-labelledby={id}>
      <div className={s.grid} data-icon={icon ? true : undefined}>
        {icon && <div className={s.icon}>{icon}</div>}
        <div className={s.main}>
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
      </div>
    </div>
  );
}
