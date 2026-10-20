// The Hearth: what is happening, what happened while you were away, and what to aim for next.
import { t } from '@idle-clash/content';
import type { NextUpRow } from '@idle-clash/features';
import { Button, Panel } from '@idle-clash/ui';
import { useGame } from '../game/hooks.ts';
import { navigate } from '../router.ts';
import { LaneList, laneViews } from '../shell/Lanes.tsx';
import { fills, Slot } from '../slots.tsx';
import s from './pages.module.css';

export function Hearth() {
  const { state, now, features } = useGame();
  const next = fills<NextUpRow>(features, 'hearth.nextUp', state, now);
  const firstSkill = features.find((f) => f.content.skill);
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
                {firstSkill && (
                  <Button variant="primary" onClick={() => navigate(`/skills/${firstSkill.content.skill!.id}`)}>
                    {t('hearth.welcome.start')}
                  </Button>
                )}
              </div>
            </Panel>
          </Slot>
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
