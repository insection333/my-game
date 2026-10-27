// The Expeditions tab's side: each boss, fought alone once a day, and the relics marks buy (fourteen
// rows, scrolling inside their own box).
import { t } from '@idle-clash/content';
import type { BossRow, RelicsView } from '@idle-clash/features';
import { actionKey, LANE_IDS } from '@idle-clash/kernel';
import { ActionRow, Button, hasIcon, ItemIcon, Panel, Pill } from '@idle-clash/ui';
import { useGame } from '../game/hooks.ts';
import { game } from '../game/store.ts';
import { Slot } from '../slots.tsx';
import s from './expeditions.module.css';

const VERDICT_TONE = { easy: 'moss', fair: 'woad', costly: 'gold', tooStrong: 'neutral' } as const;

export function Bosses({ bosses }: { bosses: BossRow[] }) {
  return (
    <Panel title={t('expeditions.title')} flush>
      <Slot id="combat.bosses">
        {bosses.map((b) => (
          <Boss key={b.id} boss={b} />
        ))}
      </Slot>
    </Panel>
  );
}

function Boss({ boss }: { boss: BossRow }) {
  const { state } = useGame();
  const fighting = LANE_IDS.some((l) => {
    const c = state.lanes[l].current;
    return c !== null && actionKey(c.action) === `expeditions:${boss.id}`;
  });
  return (
    <ActionRow
      icon={hasIcon(boss.id) ? <ItemIcon name={boss.id} size={32} /> : undefined}
      name={boss.name}
      locked={!boss.ready && !boss.verdict}
      facts={[boss.region, boss.style, boss.wins]}
      status={
        fighting ? (
          <Pill tone="woad">{t('action.working')}</Pill>
        ) : boss.status ? (
          <Pill>{boss.status}</Pill>
        ) : boss.verdict ? (
          <Pill tone={VERDICT_TONE[boss.verdictId as keyof typeof VERDICT_TONE]}>{boss.verdict}</Pill>
        ) : undefined
      }
      actions={
        boss.ready &&
        !fighting && (
          <Button
            variant="primary"
            onClick={() =>
              game.command({ type: 'start', lane: 'combat', action: { feature: 'expeditions', id: boss.id } })
            }
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
        {/* Fourteen rows scroll inside their own box, which takes the keyboard too. */}
        <div className={s.relics} tabIndex={0} role="group" aria-label={t('relic.title')}>
          {relics.relics.map((r) => (
            <ActionRow
              key={r.id}
              icon={hasIcon(r.id) ? <ItemIcon name={r.id} size={32} /> : undefined}
              name={r.name}
              facts={[r.effect, r.rank]}
              status={r.raise ? undefined : <Pill tone="moss">{t('relic.full')}</Pill>}
              actions={
                r.raise && (
                  <Button disabled={!r.affordable} onClick={() => game.act('expeditions', 'relic', { relic: r.id })}>
                    {r.raise}
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
