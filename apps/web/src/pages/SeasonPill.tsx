// The season where it works (session 164): a pill on a skill's page and on Combat naming the season and
// what it lifts there, beside the castle's edict, so the lift is seen where it is earned.
import { seasonPill } from '@idle-clash/features';
import { Pill } from '@idle-clash/ui';
import { useGame } from '../game/hooks.ts';
import s from './castle/castle.module.css';

export function SeasonPill({ skill }: { skill?: string }) {
  const { now } = useGame();
  const words = seasonPill(now, skill ? { skill } : { combat: true });
  if (!words) return null;
  return (
    <span className={s.edictPill} data-season>
      <Pill tone="woad">{words}</Pill>
    </span>
  );
}
