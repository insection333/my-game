// Skills: every skill, grouped by lane, with its level and what its next level opens.
import { t } from '@idle-clash/content';
import type { SkillSummary } from '@idle-clash/features';
import { LANE_IDS } from '@idle-clash/kernel';
import { Panel, ProgressBar } from '@idle-clash/ui';
import { useGame } from '../game/hooks.ts';
import { navigate } from '../router.ts';
import { fills, Slot } from '../slots.tsx';
import { PageHead } from './PageHead.tsx';
import s from './pages.module.css';

export function Skills() {
  const { state, now, features } = useGame();
  const rows = fills<SkillSummary>(features, 'skills.list', state, now);
  const laneOf = (feature: string) => {
    // A skill with no actions of its own (Melee, Hitpoints) is trained in the Combat lane.
    const rules = Object.values(features.find((f) => f.id === feature)?.rules ?? {});
    return rules[0]?.lane ?? 'combat';
  };
  const groups = LANE_IDS.filter((l) => l !== 'gathering2')
    .map((lane) => ({ lane, rows: rows.filter((r) => laneOf(r.feature) === lane) }))
    .filter((g) => g.rows.length);
  return (
    <>
      <PageHead title={t('skills.title')} />
      {rows.length > 0 && (
        <section data-section>
          <Slot id="skills.list" className={s.stack}>
            {groups.map((g) => (
              <Panel key={g.lane} title={t(`lane.${g.lane}`)} flush>
                <div className={s.rows}>
                  {g.rows.map(({ feature, data }) => (
                    <a
                      key={feature}
                      href={`/skills/${data.skill}`}
                      data-ui="RowLink"
                      className={s.row}
                      onClick={(e) => (e.preventDefault(), navigate(`/skills/${data.skill}`))}
                    >
                      <span className={s.rowHead}>
                        <span className={s.rowName}>{data.name}</span>
                        <span>{data.level}</span>
                      </span>
                      <ProgressBar value={data.progress} label={data.toNext} />
                      <span className={s.muted}>{data.toNext}</span>
                      {data.nextUnlock && <span>{data.nextUnlock}</span>}
                    </a>
                  ))}
                </div>
              </Panel>
            ))}
          </Slot>
        </section>
      )}
    </>
  );
}
