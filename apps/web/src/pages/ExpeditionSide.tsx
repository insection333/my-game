// The Expeditions tab's side: each boss, fought alone once a day, and the relics marks buy (fourteen
// rows, scrolling inside their own box).
import { t } from '@idle-clash/content';
import type { BossRow, RealmView, RelicsView, RoundView } from '@idle-clash/features';
import { actionKey, LANE_IDS } from '@idle-clash/kernel';
import { ActionRow, Button, hasIcon, ItemIcon, Panel, Pill } from '@idle-clash/ui';
import { useGame } from '../game/hooks.ts';
import { game } from '../game/store.ts';
import { Slot } from '../slots.tsx';
import { bossCommands, inRound } from './boss-start.ts';
import { CombatArena, useFightClock } from './CombatArena.tsx';
import { RealmRow } from './RealmRow.tsx';
import { Quartermaster } from './Quartermaster.tsx';
import { DeepRelics } from './DeepRelics.tsx';
import s from './expeditions.module.css';

const VERDICT_TONE = { easy: 'moss', fair: 'woad', costly: 'gold', tooStrong: 'neutral' } as const;

export function Bosses({
  bosses,
  realm,
  round,
}: {
  bosses: BossRow[];
  realm: RealmView | null;
  round: RoundView | null;
}) {
  const now = useFightClock();
  return (
    <Panel title={t('expeditions.title')} flush>
      <Slot id="combat.bosses">
        {/* A boss fought in the lane, played out over the bosses (session 46). */}
        <CombatArena now={now} place="bosses" />
        {/* The realm's boss of the week leads the bosses (session 174). */}
        {realm && <RealmRow realm={realm} round={round} />}
        {round && <RoundRow round={round} />}
        {/* Six bosses since session 210: their rows scroll inside their own box, as the relics' do. */}
        <div className={s.bosses} data-scrollbox tabIndex={0} role="group" aria-label={t('expeditions.title')}>
          {bosses.map((b) => (
            <Boss key={b.id} boss={b} round={round} />
          ))}
        </div>
      </Slot>
    </Panel>
  );
}

/** The day's bosses (session 239): one press fights every boss waiting today, one after another. */
function RoundRow({ round }: { round: RoundView }) {
  const { state } = useGame();
  return (
    <Slot id="combat.round">
      <ActionRow
        icon={hasIcon(round.icon) ? <ItemIcon name={round.icon} size={32} /> : undefined}
        name={t('round.name')}
        facts={[round.text]}
        status={round.running ? <Pill tone="woad">{t('action.working')}</Pill> : undefined}
        actions={
          !round.running && (
            <Button
              variant="primary"
              onClick={() => {
                const set = game.act('expeditions', 'round', {});
                if (!set || typeof set !== 'object' || !('ok' in set) || !set.ok) return;
                for (const cmd of bossCommands(state, 'bosses')) if (!game.command(cmd).ok) break;
              }}
            >
              {t('round.fight')}
            </Button>
          )
        }
      />
    </Slot>
  );
}

function Boss({ boss, round }: { boss: BossRow; round: RoundView | null }) {
  const { state } = useGame();
  const turn = inRound(round, boss.id);
  const fighting =
    turn === 'on' ||
    LANE_IDS.some((l) => {
      const c = state.lanes[l].current;
      return c !== null && actionKey(c.action) === `expeditions:${boss.id}`;
    });
  return (
    <ActionRow
      icon={hasIcon(boss.id) ? <ItemIcon name={boss.id} size={32} /> : undefined}
      name={boss.name}
      locked={!boss.ready && !boss.verdict}
      facts={[boss.region, boss.style, ...(boss.trait ? [boss.trait] : []), boss.wins]}
      status={
        fighting ? (
          <Pill tone="woad">{t('action.working')}</Pill>
        ) : turn === 'waiting' ? (
          <Pill tone="woad">{t('action.queued')}</Pill>
        ) : boss.status ? (
          <Pill>{boss.status}</Pill>
        ) : boss.verdict ? (
          <Pill tone={VERDICT_TONE[boss.verdictId as keyof typeof VERDICT_TONE]}>{boss.verdict}</Pill>
        ) : undefined
      }
      actions={
        boss.ready &&
        !fighting &&
        !turn && (
          <Button
            variant="primary"
            onClick={() => {
              // The fight the lane was on is queued next, to go back to once the boss is done (session 72).
              for (const cmd of bossCommands(state, boss.id)) if (!game.command(cmd).ok) break;
            }}
          >
            {t('combat.fight')}
          </Button>
        )
      }
    />
  );
}

export function Relics({ relics }: { relics: RelicsView }) {
  return (
    <Panel title={t('relic.title')} aside={relics.marks} flush>
      <Slot id="combat.relics">
        {/* Every relic raised: the quartermaster leads, as the marks have nothing else to buy. */}
        {relics.trade && <Quartermaster trade={relics.trade} />}
        {/* Fourteen rows scroll inside their own box, which takes the keyboard too. */}
        <div className={s.relics} data-scrollbox tabIndex={0} role="group" aria-label={t('relic.title')}>
          {/* The Deep's relics lead from Hitpoints 99 (session 215), in the same box: they never run out of
              ranks, and the panel keeps its height. */}
          {relics.deep && <DeepRelics rows={relics.deep} />}
          {relics.relics.map((r) => (
            <ActionRow
              key={r.id}
              icon={hasIcon(r.id) ? <ItemIcon name={r.id} size={32} /> : undefined}
              name={r.name}
              facts={[r.effect, r.rank, ...(r.raise ? [r.raise] : [])]}
              status={r.raise ? undefined : <Pill tone="moss">{t('relic.full')}</Pill>}
              actions={
                r.raise && (
                  <Button disabled={!r.affordable} onClick={() => game.act('expeditions', 'relic', { relic: r.id })}>
                    {t('relic.raise')}
                  </Button>
                )
              }
            />
          ))}
        </div>
      </Slot>
    </Panel>
  );
}
