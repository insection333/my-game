// The arena (session 42): the fight the Combat lane is in, played out swing by swing at the top of the
// Foes panel. You on the left with your weapon and health, the foe on the right with theirs; each
// swing as it falls: your hits over the foe (the top tenth of rolls a critical, in gold), their hits on
// you, misses, meals eaten. When the felling blow lands, Slain, until the lane brings the next. It is the
// very fight the engine settles (features' arenaOf), kept in time with the lane's bar (session 46), so
// what it shows is what happens, when it happens.
import { fmt, midSentence, t } from '@idle-clash/content';
import { arenaAt, arenaOf, combatData, type Arena, type Swing } from '@idle-clash/features';
import { hasIcon, ItemIcon, TextLink } from '@idle-clash/ui';
import { useEffect, useReducer } from 'react';
import { useGame } from '../game/hooks.ts';
import { serverNow } from '../game/store.ts';
import { navigate } from '../router.ts';
import s from './combat.module.css';

/** The Combat page's clock: the game's, and a render at the moment each swing lands between its
 *  once-a-second ticks, so the arena, the health bar and the lane's bar keep time together. */
export function useFightClock(): number {
  const { state, now } = useGame();
  const arena = arenaOf(state);
  const [, land] = useReducer((n: number) => n + 1, 0);
  const at = Math.max(now, serverNow());
  const next = arena ? arenaAt(arena, at).next : null;
  useEffect(() => {
    if (next === null) return;
    const id = setTimeout(land, Math.max(0, next - serverNow()) + 10);
    return () => clearTimeout(id);
  }, [next]);
  return at;
}

/** The foe's name, and how a sentence names it in its middle and at its start: a foe is a common noun
 *  ("the hollow rat", "The hollow rat misses"), a boss its own name ("the Drowned Warden"). */
export function foeWords(a: Arena): { name: string; mid: string; start: string } {
  const name = t(a.boss ? `boss.${a.foe.id}` : `action.combat.${a.foe.id}`);
  const mid = a.boss ? midSentence(name) : t('arena.theFoe', { foe: midSentence(name) });
  return { name, mid, start: mid.charAt(0).toUpperCase() + mid.slice(1) };
}

/** What a swing says in words, under the bars; `foe` names it at a sentence's start. */
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
          {t('arena.health', { hp: fmt.int(hp > 0 ? Math.max(1, hp) : 0), most: fmt.int(most) })}
        </span>
      </div>
    </div>
  );
}

/** Where the bosses are fought (the Expeditions tab's address). */
const BOSSES_AT = '/combat/expeditions';

/** The arena where it is shown: over the Foes list of a region and tier, or over the bosses. A fight
 *  belonging elsewhere (another tier's foe, or a boss while on the Foes tab) is one line saying where,
 *  with the way there; the bosses show only a boss's fight. */
export function CombatArena({ now, place }: { now: number; place: { region: string; tier: number } | 'bosses' }) {
  const { state } = useGame();
  const arena = arenaOf(state);
  if (!arena) return null;
  if (place === 'bosses') return arena.boss ? <Arena arena={arena} now={now} /> : null;
  const region = combatData.regionOf(arena.foe.tier);
  if (!arena.boss && region === place.region && arena.foe.tier === place.tier) return <Arena arena={arena} now={now} />;
  const { mid } = foeWords(arena);
  const href = arena.boss ? BOSSES_AT : `/combat?region=${region}&tier=${arena.foe.tier}`;
  return (
    <p className={s.elsewhere}>
      {arena.boss
        ? t('arena.elsewhereBoss', { foe: mid })
        : t('arena.elsewhere', {
            foe: mid,
            region: midSentence(t(`combat.region.${region}`)),
            tier: fmt.int(arena.foe.tier),
          })}{' '}
      <TextLink href={href} onNavigate={navigate}>
        {t('arena.watch')}
      </TextLink>
    </p>
  );
}

function Arena({ arena, now }: { arena: Arena; now: number }) {
  const { state } = useGame();
  const at = arenaAt(arena, now);
  const c = state.features.combat as { worn?: { weapon?: string } } | undefined;
  const { name: foeName, mid, start } = foeWords(arena);
  const { latest, yours, theirs } = at;
  // Each side's last number shows over it, keyed so it rises once: yours over the foe, theirs and meals
  // over you.
  const onFoe = yours
    ? {
        key: `${arena.startedAt}:${yours.at}`,
        text: yours.by === 'you' && yours.hit ? fmt.int(Math.max(1, Math.round(yours.damage))) : t('arena.miss'),
        kind: yours.by !== 'you' || !yours.hit ? ('miss' as const) : yours.crit ? ('crit' as const) : ('hit' as const),
      }
    : null;
  const onYou = theirs
    ? theirs.by === 'meal'
      ? {
          key: `${arena.startedAt}:${theirs.at}:m`,
          text: `+${fmt.int(Math.round(theirs.heals))}`,
          kind: 'heal' as const,
        }
      : {
          key: `${arena.startedAt}:${theirs.at}`,
          text: theirs.hit ? fmt.int(Math.max(1, Math.round(theirs.damage))) : t('arena.miss'),
          kind: theirs.hit ? ('hit' as const) : ('miss' as const),
        }
    : null;
  const weapon = c?.worn?.weapon ?? null;
  return (
    <div data-slot="combat.arena" className={s.arena}>
      <div className={s.duel}>
        <Side icon={weapon} name={t('arena.you')} hp={at.health} most={arena.most} fresh={onYou} />
        <span className={s.versus} aria-hidden="true">
          {t('arena.versus')}
        </span>
        <Side icon={arena.foe.id} name={foeName} hp={at.foeHp} most={arena.foe.hp} fresh={onFoe} slain={at.slain} />
      </div>
      <p className={s.said} data-crit={(latest?.by === 'you' && latest.crit) || undefined}>
        {at.slain
          ? t('arena.slainLine', { foe: start })
          : latest
            ? said(latest, start)
            : t('arena.squaresUp', { foe: mid })}
      </p>
    </div>
  );
}
