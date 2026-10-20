// A skill's page: its level, everything it can do (with what each pays), and every level's unlock.
import { fmt, levelFor, t } from '@idle-clash/content';
import type { Feature, FindEntry, LadderRow, SkillActionRow, SkillSummary } from '@idle-clash/features';
import { actionKey, laneFor, laneKind, LANE_IDS, xpOf, type LaneId, type State } from '@idle-clash/kernel';
import { ActionRow, Button, hasIcon, ItemIcon, Panel, Pill, ProgressBar, Tabs } from '@idle-clash/ui';
import { memo, useEffect, useRef } from 'react';
import { useGame } from '../game/hooks.ts';
import { game } from '../game/store.ts';
import { navigate } from '../router.ts';
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
  const { features } = useGame();
  const feature = features.find((f) => f.content.skill?.id === id);
  return feature ? <SkillPage feature={feature} /> : <NotFound />;
}

function SkillPage({ feature }: { feature: Feature }) {
  const { state, now } = useGame();
  const id = feature.content.skill!.id;
  const head = fillFor<SkillSummary>(feature, 'skill.header', state, now);
  const all = fillFor<SkillActionRow[]>(feature, 'skill.actions', state, now) ?? [];
  // One tier at a time, so the list stays short: the tier asked for in the address, or the newest
  // tier with something open.
  const tiers = [...new Set(all.map((a) => a.tier))].sort((a, b) => a - b);
  const current = Math.max(tiers[0] ?? 1, ...all.filter((a) => !a.locked).map((a) => a.tier));
  const asked = Number(new URLSearchParams(location.search).get('tier'));
  const tier = tiers.includes(asked) ? asked : current;
  const actions = all.filter((a) => a.tier === tier);
  // A lane already running this skill keeps it; otherwise the kernel's choice (the fire's second
  // Gathering lane when the first runs another skill).
  const lane = (a: SkillActionRow): LaneId => {
    const kind = feature.rules[a.action.id]?.lane ?? 'gathering';
    const own = LANE_IDS.find((l) => laneKind(l) === kind && state.lanes[l].current?.action.feature === feature.id);
    return own ?? laneFor(state, now, a.action, kind);
  };
  const running = (a: SkillActionRow) =>
    LANE_IDS.some((l) => {
      const cur = state.lanes[l].current;
      return cur ? actionKey(cur.action) === actionKey(a.action) : false;
    });
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
            {tiers.length > 1 && (
              <div className={s.tierTabs}>
                <Tabs
                  label={t('skill.tiers')}
                  onNavigate={navigate}
                  tabs={tiers.map((n) => ({
                    href: `/skills/${id}?tier=${n}`,
                    label: t('skill.tier', { tier: fmt.int(n) }),
                    current: n === tier,
                  }))}
                />
              </div>
            )}
            <Slot id="skill.actions">
              {actions.map((a) => (
                <ActionRow
                  key={a.action.id}
                  icon={actionIcon(feature, a.action.id)}
                  name={a.name}
                  locked={a.locked}
                  facts={a.locked ? [a.gives] : [a.time, a.xpPerHour, a.gives, ...(a.takes ? [a.takes] : [])]}
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
          <Finds feature={feature} state={state} found={Object.keys(state.found).length} />
        </section>
        <section data-section>
          <Ladder feature={feature} state={state} xp={xpOf(state, id)} />
        </section>
      </div>
    </>
  );
}

/** The six finds; drawn again only when something new is found, not on every tick of the clock. */
const Finds = memo(
  function Finds({ feature, state }: { feature: Feature; state: State; found: number }) {
    const finds = fillFor<FindEntry[]>(feature, 'skill.finds', state, state.clock) ?? [];
    if (!finds.length) return null;
    return (
      <Panel title={t('skill.finds.title')} flush className={s.below}>
        <Slot id="skill.finds">
          <FindGrid finds={finds} />
        </Slot>
      </Panel>
    );
  },
  (a, b) => a.feature === b.feature && a.found === b.found,
);

/** Every level's unlock, opened a row above the current level; drawn again only when XP changes. */
const Ladder = memo(
  function Ladder({ feature, state }: { feature: Feature; state: State; xp: number }) {
    const ladder = fillFor<LadderRow[]>(feature, 'skill.ladder', state, state.clock) ?? [];
    const reached = ladder.filter((l) => l.reached).length;
    const ref = useRef<HTMLOListElement>(null);
    const opened = useRef(-1);
    useEffect(() => {
      const list = ref.current;
      if (!list || opened.current === reached) return;
      opened.current = reached;
      const row = list.children[Math.max(0, reached - 2)] as HTMLElement | undefined;
      if (row) list.scrollTop = row.offsetTop - list.offsetTop;
    }, [reached]);
    return (
      <Panel title={t('skill.ladder.title')} flush>
        <Slot id="skill.ladder">
          <ol className={s.ladder} ref={ref} tabIndex={0} aria-label={t('skill.ladder.title')}>
            {ladder.map((l) => (
              <li key={l.level} data-reached={l.reached || undefined}>
                <span className={s.lv}>{l.level}</span>
                <span>{l.unlocks.join('; ')}</span>
              </li>
            ))}
          </ol>
        </Slot>
      </Panel>
    );
  },
  (a, b) => a.feature === b.feature && levelFor(a.xp) === levelFor(b.xp),
);
