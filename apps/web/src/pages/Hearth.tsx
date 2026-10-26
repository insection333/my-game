// The Hearth: what is happening, what happened while you were away, and what to aim for next.
import { t } from '@idle-clash/content';
import { useEffect } from 'react';
import type { GoalRow, GoalsView, NextUpRow, StandingView } from '@idle-clash/features';
import { ActionRow, Button, hasIcon, ItemIcon, MarchScene, Panel, Pill, ProgressBar } from '@idle-clash/ui';
import { useGame } from '../game/hooks.ts';
import { game } from '../game/store.ts';
import { navigate } from '../router.ts';
import { LaneList, laneViews } from '../shell/Lanes.tsx';
import { fills, Slot } from '../slots.tsx';
import s from './pages.module.css';
import { Tour } from '../shell/Tour.tsx';
import { Today } from './Today.tsx';

export function Hearth() {
  const { state, now, features } = useGame();
  // The three nearest unlocks across every skill (IA.md).
  const next = fills<NextUpRow>(features, 'hearth.nextUp', state, now)
    .sort((a, b) => a.data.xpAway - b.data.xpAway)
    .slice(0, 3);
  const [goals] = fills<GoalsView>(features, 'hearth.goals', state, now);
  const [standing] = fills<StandingView>(features, 'hearth.standing', state, now);
  // The ladder lacks a goal (a short goal was claimed, or a new day began): the server makes it.
  const wants = goals?.data.refresh ?? false;
  useEffect(() => {
    if (wants) game.act('goals', 'refresh', {});
  }, [wants]);
  return (
    <>
      <h1 className="visually-hidden">{t('hearth.title')}</h1>
      {/* The region's banner, with your standing on it: rank, total level, the way to the next rank. */}
      <div className={s.bannerBox}>
        <MarchScene className={s.banner} keep="middle" />
        {standing && (
          <Slot id="hearth.standing" className={s.standing}>
            <span className={s.rank}>{standing.data.rank}</span>
            <span className={s.total}>{standing.data.total}</span>
            {standing.data.next && (
              <ProgressBar value={standing.data.progress} label={standing.data.next} tone="woad" />
            )}
          </Slot>
        )}
      </div>
      {/* Phones: today, goals, then next up. Wide: today and next up on the left, the goals beside them. */}
      <div className={s.hearth}>
        <section data-section className={s.todayArea}>
          <Today />
        </section>
        {goals && (
          <section data-section className={s.goalsArea}>
            <Panel title={goals.data.title} aside={goals.data.progress ?? undefined} flush>
              <Slot id="hearth.goals">
                {goals.data.rows.map((row) => (
                  <Goal key={row.id} row={row} />
                ))}
              </Slot>
            </Panel>
          </section>
        )}
        {next.length > 0 && (
          <section data-section className={s.nextArea}>
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
                      <span className={s.rowName}>
                        {hasIcon(data.skill) && <ItemIcon name={data.skill} size={24} />}
                        {t(`skill.${data.skill}`)}
                      </span>
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
            <LaneList lanes={laneViews(state, now, features)} />
          </Panel>
        </Slot>
      </section>
      <Tour />
    </>
  );
}

function Goal({ row }: { row: GoalRow }) {
  const b = row.button;
  return (
    <ActionRow
      name={row.name}
      facts={[row.reward, ...(row.count ? [row.count] : [])]}
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
            onClick={() =>
              'claim' in b
                ? game.act('goals', 'claim', { goal: b.claim })
                : 'route' in b
                  ? game.act(b.route.feature, b.route.route, b.route.input)
                  : game.command(b.command)
            }
          >
            {b.label}
          </Button>
        )
      }
    />
  );
}
