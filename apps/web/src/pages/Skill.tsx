// A skill's page: its level, everything it can do (with what each pays), and every level's unlock.
import { t } from '@idle-clash/content';
import type { Feature, FindEntry, LadderRow, SkillActionRow, SkillSummary } from '@idle-clash/features';
import { actionKey, laneKind, LANE_IDS, type LaneId } from '@idle-clash/kernel';
import { ActionRow, Button, hasIcon, ItemIcon, Panel, Pill, ProgressBar } from '@idle-clash/ui';
import { useGame } from '../game/hooks.ts';
import { game } from '../game/store.ts';
import { fillFor, Slot } from '../slots.tsx';
import { FindGrid } from './Finds.tsx';
import { NotFound } from './Simple.tsx';
import s from './pages.module.css';

/** The icon an action shows: its first output's, when that icon has been drawn. */
function actionIcon(feature: Feature, id: string) {
  const out = feature.content.actions?.find((a) => a.id === id)?.gives?.[0]?.item;
  return out && hasIcon(out) ? <ItemIcon name={out} size={32} /> : <span className={s.iconCell} />;
}

export function Skill({ id }: { id: string }) {
  const { state, now, features } = useGame();
  const feature = features.find((f) => f.content.skill?.id === id);
  if (!feature) return <NotFound />;
  const head = fillFor<SkillSummary>(feature, 'skill.header', state, now);
  const actions = fillFor<SkillActionRow[]>(feature, 'skill.actions', state, now) ?? [];
  const ladder = fillFor<LadderRow[]>(feature, 'skill.ladder', state, now) ?? [];
  const finds = fillFor<FindEntry[]>(feature, 'skill.finds', state, now) ?? [];
  const lane = (a: SkillActionRow): LaneId => {
    const kind = feature.rules[a.action.id]?.lane ?? 'gathering';
    return LANE_IDS.find((l) => laneKind(l) === kind) ?? 'gathering';
  };
  const running = (a: SkillActionRow) => {
    const cur = state.lanes[lane(a)].current;
    return cur ? actionKey(cur.action) === actionKey(a.action) : false;
  };
  return (
    <>
      {head && (
        <Slot id="skill.header" className={s.skillHead}>
          <div className={s.skillTitle}>
            {hasIcon(id) && <ItemIcon name={id} size={48} />}
            <h1>{head.name}</h1>
            <Pill tone="moss">{head.level}</Pill>
          </div>
          <div className={s.skillBar}>
            <ProgressBar value={head.progress} label={head.toNext} />
          </div>
          <div className={s.muted}>{head.toNext}</div>
          {head.nextUnlock && <div>{head.nextUnlock}</div>}
        </Slot>
      )}
      <div className={s.pair}>
        <section data-section>
          <Panel title={t('skill.actions.title')} flush>
            <Slot id="skill.actions">
              {actions.map((a) => (
                <ActionRow
                  key={a.action.id}
                  icon={actionIcon(feature, a.action.id)}
                  name={a.name}
                  locked={a.locked}
                  facts={a.locked ? [a.gives] : [a.time, a.xpPerHour, a.gives]}
                  status={
                    a.locked ? (
                      <Pill>{a.opensAt}</Pill>
                    ) : running(a) ? (
                      <Pill tone="woad">{t('action.working')}</Pill>
                    ) : (
                      <Pill tone="moss">{a.mastery}</Pill>
                    )
                  }
                  progress={!a.locked && <ProgressBar value={a.masteryProgress} label={`${a.name}: ${a.mastery}`} />}
                  actions={
                    !a.locked && (
                      <>
                        <Button
                          variant="primary"
                          disabled={running(a)}
                          onClick={() => game.command({ type: 'start', lane: lane(a), action: a.action })}
                        >
                          {t('action.start')}
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => game.command({ type: 'queueNext', lane: lane(a), action: a.action })}
                        >
                          {t('action.queue')}
                        </Button>
                      </>
                    )
                  }
                />
              ))}
            </Slot>
          </Panel>
          {finds.length > 0 && (
            <Panel title={t('skill.finds.title')} flush className={s.below}>
              <Slot id="skill.finds">
                <FindGrid finds={finds} />
              </Slot>
            </Panel>
          )}
        </section>
        <section data-section>
          <Panel title={t('skill.ladder.title')} flush>
            <Slot id="skill.ladder">
              <ol className={s.ladder}>
                {ladder.map((l) => (
                  <li key={l.level} data-reached={l.reached || undefined}>
                    <span className={s.lv}>{l.level}</span>
                    <span>{l.unlocks.join('; ')}</span>
                  </li>
                ))}
              </ol>
            </Slot>
          </Panel>
        </section>
      </div>
    </>
  );
}
