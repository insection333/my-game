// The Hearth: what is happening, what happened while you were away, and what to aim for next.
import { t } from '@idle-clash/content';
import type { GoalRow, GoalsView, NextUpRow } from '@idle-clash/features';
import { ActionRow, Button, Panel, Pill, ProgressBar } from '@idle-clash/ui';
import { useGame } from '../game/hooks.ts';
import { game } from '../game/store.ts';
import { navigate } from '../router.ts';
import { LaneList, laneViews } from '../shell/Lanes.tsx';
import { fills, Slot } from '../slots.tsx';
import s from './pages.module.css';

export function Hearth() {
  const { state, now, features } = useGame();
  const next = fills<NextUpRow>(features, 'hearth.nextUp', state, now);
  const [goals] = fills<GoalsView>(features, 'hearth.goals', state, now);
  return (
    <>
      <h1 className="visually-hidden">{t('hearth.title')}</h1>
      <div className={s.pair}>
        <section data-section>
          <Slot id="hearth.today">
            <Panel>
              <div className={s.welcome}>
                <h2>{t('hearth.welcome.title')}</h2>
                <p>{t('hearth.welcome.body')}</p>
              </div>
            </Panel>
          </Slot>
          {goals && (
            <Panel title={goals.data.title} aside={goals.data.progress} flush className={s.below}>
              <Slot id="hearth.goals">
                {goals.data.rows.map((row) => (
                  <Goal key={row.id} row={row} />
                ))}
              </Slot>
            </Panel>
          )}
        </section>
        {next.length > 0 && (
          <section data-section>
            <Panel title={t('hearth.next.title')} flush>
              <Slot id="hearth.nextUp" className={s.rows}>
                {next.map(({ feature, data }) => (
                  <a
                    key={feature}
                    href={`/skills/${data.skill}`}
                    data-ui="RowLink"
                    className={s.row}
                    onClick={(e) => (e.preventDefault(), navigate(`/skills/${data.skill}`))}
                  >
                    <span className={s.rowHead}>
                      <span className={s.rowName}>{t(`skill.${data.skill}`)}</span>
                      <span className={s.muted}>{data.away}</span>
                    </span>
                    <span>{data.text}</span>
                  </a>
                ))}
              </Slot>
            </Panel>
          </section>
        )}
      </div>
      <section data-section className={s.phoneOnly} style={{ marginTop: 'var(--s-4)' }}>
        <Slot id="hearth.lanes">
          <Panel title={t('hearth.lanes.title')} flush>
            <LaneList lanes={laneViews(state, now)} />
          </Panel>
        </Slot>
      </section>
    </>
  );
}

function Goal({ row }: { row: GoalRow }) {
  const b = row.button;
  return (
    <ActionRow
      name={row.name}
      facts={[row.reward]}
      status={
        row.state === 'claimed' ? (
          <Pill tone="moss">{row.note}</Pill>
        ) : row.state === 'working' ? (
          <Pill tone="woad">{row.note}</Pill>
        ) : row.note ? (
          <Pill>{row.note}</Pill>
        ) : undefined
      }
      progress={row.state !== 'claimed' && <ProgressBar value={row.progress} label={row.name} />}
      actions={
        b && (
          <Button
            variant="primary"
            onClick={() => ('claim' in b ? game.act('goals', 'claim', { goal: b.claim }) : game.command(b.command))}
          >
            {b.label}
          </Button>
        )
      }
    />
  );
}
