// The castle's edict where it works (Castle Clash, session 33): a pill on a skill's page and on Combat
// saying which edict is in force and what it gives, so the lift is seen where it is earned.
import { EDICTS, fmt, t } from '@idle-clash/content';
import { castleEngine as E } from '@idle-clash/features';
import { Pill } from '@idle-clash/ui';
import { useGame } from '../../game/hooks.ts';
import { edictGives, edictName } from './labels.ts';
import s from './castle.module.css';

export function EdictPill({ fights }: { fights?: boolean }) {
  const { state, now } = useGame();
  const m = E.mirrorOf(state);
  const lifts = EDICTS.find((e) => e.id === m.edict)?.lifts;
  // Fight gold only on Combat; XP and finds wherever a skill is trained.
  if (!lifts || (lifts === 'fightGold' && !fights) || E.edictPct(state, now, lifts) <= 0) return null;
  const gives = edictGives(lifts, { pct: fmt.pct(Math.round(m.pct * 10) / 10) });
  return (
    <span className={s.edictPill}>
      <Pill tone="gold">{t('castle.edict.active', { edict: edictName(m.edict), gives })}</Pill>
    </span>
  );
}
