// The arena (session 42): the fight the Combat lane is in, played out swing by swing at the top of the
// Foes panel. You on the left with your weapon and health, the foe on the right with theirs; each
// swing as it falls: your hits over the foe (the top tenth of rolls a critical, in gold), their hits on
// you, misses, meals eaten. When the foe falls, Slain, and the next steps in. It is the very fight the
// engine settles (features' arenaOf), so what it shows is what happens.
import { fmt, t } from '@idle-clash/content';
import { arenaOf, type Arena, type Swing } from '@idle-clash/features';
import type { State } from '@idle-clash/kernel';
import { hasIcon, ItemIcon } from '@idle-clash/ui';
import { useMemo } from 'react';
import { useGame } from '../game/hooks.ts';
import s from './combat.module.css';

/** How long Slain stands over a fallen foe as the next fight begins. */
const SLAIN_MS = 2000;

/** The fight, worked out once each time a new one begins. */
function useArena(state: State): Arena | null {
  const run = state.lanes.combat.current;
  const key = run ? `${run.action.id}:${run.startedAt}:${run.seed ?? ''}` : '';
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => arenaOf(state), [key]);
}

/** What a swing says in words, under the bars. */
function said(x: Swing, foe: string): string {
  if (x.by === 'meal') return t('arena.ate', { item: t(`item.${x.item}`), heals: fmt.int(Math.round(x.heals)) });
  const dmg = fmt.int(Math.max(1, Math.round(x.damage)));
  if (x.by === 'you')
    return !x.hit
      ? t('arena.youMiss')
      : x.crit
        ? t('arena.youCrit', { damage: dmg })
        : t('arena.youHit', { damage: dmg });
  return !x.hit ? t('arena.foeMiss', { foe }) : t('arena.foeHit', { foe, damage: dmg });
}

function Side({
  icon,
  name,
  hp,
  most,
  fresh,
  slain,
}: {
  icon: string | null;
  name: string;
  hp: number;
  most: number;
  /** The swing that has just landed on this side, if any, keyed so its number rises once. */
  fresh: { key: string; text: string; kind: 'hit' | 'crit' | 'miss' | 'heal' } | null;
  slain?: boolean;
}) {
  const share = Math.max(0, Math.min(1, hp / most));
  return (
    <div className={s.side}>
      <div className={s.fighter}>
        {icon && hasIcon(icon) && <ItemIcon name={icon} size={48} />}
        {fresh && (
          <span key={fresh.key} className={s.float} data-kind={fresh.kind} aria-hidden="true">
            {fresh.text}
          </span>
        )}
        {slain && (
          <span className={s.slain} aria-hidden="true">
            {t('arena.slain')}
          </span>
        )}
      </div>
      <div className={s.sideText}>
        <span className={s.sideName}>{name}</span>
        <div className={s.health} aria-hidden="true">
          <span style={{ width: `${share * 100}%` }} data-low={share < 0.25 || undefined} />
        </div>
        <span className={s.hp}>
          {t('arena.health', { hp: fmt.int(Math.ceil(Math.max(0, hp))), most: fmt.int(most) })}
        </span>
      </div>
    </div>
  );
}

export function CombatArena() {
  const { state, now } = useGame();
  const arena = useArena(state);
  if (!arena) return null;
  const elapsed = now - arena.startedAt;
  const shown = arena.swings.filter((x) => x.t * 1000 <= elapsed);
  const latest = shown.at(-1) ?? null;
  // The last fight ended in a defeat of its foe the moment this one began (the lane's health was set
  // then, with no retreat): for its first moments, Slain stands over the foe.
  const c = state.features.combat as { healthAt?: number; retreated?: unknown; worn?: { weapon?: string } } | undefined;
  const justSlain = !latest && elapsed < SLAIN_MS && c?.healthAt === arena.startedAt && !c.retreated;
  const foeName = t(`action.combat.${arena.foe.id}`);
  // Within a sentence the foe is a common noun: "The hollow rat misses".
  const foeWord = foeName.charAt(0).toLowerCase() + foeName.slice(1);
  const hp = latest ? latest.health : arena.health;
  const foeHp = latest ? latest.foeHp : arena.foe.hp;
  // A swing's number shows on the side it lands on: yours over the foe, theirs and meals over you.
  const key = latest ? `${arena.startedAt}:${shown.length}` : '';
  const onFoe =
    latest?.by === 'you'
      ? {
          key,
          text: latest.hit ? fmt.int(Math.max(1, Math.round(latest.damage))) : t('arena.miss'),
          kind: !latest.hit ? ('miss' as const) : latest.crit ? ('crit' as const) : ('hit' as const),
        }
      : null;
  const onYou =
    latest?.by === 'foe'
      ? {
          key,
          text: latest.hit ? fmt.int(Math.max(1, Math.round(latest.damage))) : t('arena.miss'),
          kind: latest.hit ? ('hit' as const) : ('miss' as const),
        }
      : latest?.by === 'meal'
        ? { key, text: `+${fmt.int(Math.round(latest.heals))}`, kind: 'heal' as const }
        : null;
  const weapon = c?.worn?.weapon ?? null;
  return (
    <div data-slot="combat.arena" className={s.arena}>
      <div className={s.duel}>
        <Side icon={weapon} name={t('arena.you')} hp={hp} most={arena.most} fresh={onYou} />
        <span className={s.versus} aria-hidden="true">
          {t('arena.versus')}
        </span>
        <Side
          icon={arena.foe.id}
          name={foeName}
          hp={justSlain ? 0 : foeHp}
          most={arena.foe.hp}
          fresh={onFoe}
          slain={justSlain}
        />
      </div>
      <p className={s.said} data-crit={(latest?.by === 'you' && latest.crit) || undefined}>
        {justSlain
          ? t('arena.slainLine', { foe: foeWord })
          : latest
            ? said(latest, foeWord)
            : t('arena.squaresUp', { foe: foeWord })}
      </p>
    </div>
  );
}
