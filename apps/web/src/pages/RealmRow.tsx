// The realm's boss of the week on the Combat page (session 174): over the bosses, its name, the realm's
// strikes and yours, a bar to its fall, Fight once a day at your own measure, and your share to take once it
// falls with your strike.
import { t } from '@idle-clash/content';
import type { RealmView, RoundView } from '@idle-clash/features';
import { actionKey, LANE_IDS } from '@idle-clash/kernel';
import { ActionRow, Button, hasIcon, ItemIcon, Pill, ProgressBar } from '@idle-clash/ui';
import { useGame } from '../game/hooks.ts';
import { game } from '../game/store.ts';
import { Slot } from '../slots.tsx';
import { bossCommands, inRound } from './boss-start.ts';
import s from './expeditions.module.css';

const VERDICT_TONE = { easy: 'moss', fair: 'woad', costly: 'gold', tooStrong: 'neutral' } as const;

export function RealmRow({ realm, round }: { realm: RealmView; round: RoundView | null }) {
  const { state } = useGame();
  // Fought alone, or as the day's bosses' first (session 239).
  const turn = inRound(round, 'realm');
  const fighting =
    turn === 'on' ||
    LANE_IDS.some((l) => {
      const c = state.lanes[l].current;
      return c !== null && actionKey(c.action) === 'expeditions:realm';
    });
  return (
    <Slot id="combat.realm">
      <ActionRow
        icon={hasIcon(realm.boss) ? <ItemIcon name={realm.boss} size={32} /> : undefined}
        name={realm.name}
        facts={[realm.strikes, realm.mine, ...(realm.mark ? [realm.mark] : [])]}
        status={
          fighting ? (
            <Pill tone="woad">{t('action.working')}</Pill>
          ) : turn === 'waiting' ? (
            <Pill tone="woad">{t('action.queued')}</Pill>
          ) : realm.fell ? (
            <Pill tone="moss">{t('realm.fallenPill')}</Pill>
          ) : realm.status ? (
            <Pill>{realm.status}</Pill>
          ) : realm.verdict ? (
            <Pill tone={VERDICT_TONE[realm.verdictId as keyof typeof VERDICT_TONE]}>{realm.verdict}</Pill>
          ) : undefined
        }
        progress={<ProgressBar value={realm.progress} label={realm.strikes} />}
        actions={
          realm.share ? (
            <Button variant="primary" onClick={() => game.act('expeditions', 'share', {})}>
              {realm.share.label}
            </Button>
          ) : (
            realm.ready &&
            !fighting &&
            !turn && (
              <Button
                variant="primary"
                onClick={() => {
                  for (const cmd of bossCommands(state, 'realm')) if (!game.command(cmd).ok) break;
                }}
              >
                {t('combat.fight')}
              </Button>
            )
          )
        }
      />
      <p className={s.realmNote}>{realm.share ? realm.share.text : realm.note}</p>
    </Slot>
  );
}
