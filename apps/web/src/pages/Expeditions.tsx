// The Combat page's Expeditions tab (IA.md): the next run's route in the region and length chosen, with
// its twists and the fork's two roads to set out by (or the run under way, stage by stage); the bosses,
// each fought alone once a day; and the relics marks buy.
import { t } from '@idle-clash/content';
import {
  routeView,
  type BossRow,
  type ExpeditionView,
  type RelicsView,
  type RouteView,
  type RunView,
} from '@idle-clash/features';
import { ActionRow, Button, hasIcon, ItemIcon, Panel, Pill, ProgressBar, Tabs } from '@idle-clash/ui';
import { actionKey, LANE_IDS } from '@idle-clash/kernel';
import { useState } from 'react';
import { useGame } from '../game/hooks.ts';
import { game } from '../game/store.ts';
import { navigate, useLocation } from '../router.ts';
import { fills, Slot } from '../slots.tsx';
import { CombatHead } from './CombatHead.tsx';
import { Legend, Ribbon, Twists } from './ExpeditionRoute.tsx';
import s from './expeditions.module.css';

export const EXPEDITIONS_PATH = '/combat/expeditions';
const VERDICT_TONE = { easy: 'moss', fair: 'woad', costly: 'gold', tooStrong: 'neutral' } as const;

export function Expeditions() {
  const { state, now, features } = useGame();
  useLocation();
  const [view] = fills<ExpeditionView>(features, 'combat.expedition', state, now);
  const [bosses] = fills<BossRow[]>(features, 'combat.bosses', state, now);
  const [relics] = fills<RelicsView>(features, 'combat.relics', state, now);
  return (
    <>
      <CombatHead expeditions />
      <div className={s.layout}>
        {view && (
          <section data-section className={s.runArea}>
            <Panel title={t('expedition.title')} aside={<Pill tone="gold">{view.data.marks}</Pill>}>
              <Slot id="combat.expedition" className={s.stack}>
                {view.data.run ? <Run run={view.data.run} /> : <Plan view={view.data} />}
                <Legend twists={view.data.legend} />
              </Slot>
            </Panel>
          </section>
        )}
        <div className={s.side}>
          {bosses && (
            <section data-section>
              <Panel title={t('expeditions.title')} flush>
                <Slot id="combat.bosses">
                  {bosses.data.map((b) => (
                    <Boss key={b.id} boss={b} />
                  ))}
                </Slot>
              </Panel>
            </section>
          )}
          {relics && (
            <section data-section>
              <Panel title={t('relic.title')} aside={relics.data.marks} flush>
                <Slot id="combat.relics" className={s.relics}>
                  {relics.data.relics.map((r) => (
                    <ActionRow
                      key={r.id}
                      icon={hasIcon(r.id) ? <ItemIcon name={r.id} size={32} /> : undefined}
                      name={r.name}
                      facts={[r.effect, r.rank]}
                      status={r.raise ? undefined : <Pill tone="moss">{t('relic.full')}</Pill>}
                      actions={
                        r.raise && (
                          <Button
                            disabled={!r.affordable}
                            onClick={() => game.act('expeditions', 'relic', { relic: r.id })}
                          >
                            {r.raise}
                          </Button>
                        )
                      }
                    />
                  ))}
                </Slot>
              </Panel>
            </section>
          )}
        </div>
      </div>
    </>
  );
}

/** Choosing a run: the region and length, then the route they make, its twists, and the fork's roads. */
function Plan({ view }: { view: ExpeditionView }) {
  const { state } = useGame();
  const query = new URLSearchParams(location.search);
  const region =
    view.regions.find((r) => r.id === query.get('region')) ??
    view.regions.filter((r) => !r.locked).at(-1) ??
    view.regions[0];
  const asked = Number(query.get('hours'));
  const hours = view.lengths.find((l) => l.hours === asked)?.hours ?? 1;
  const href = (r: string, h: number) => `${EXPEDITIONS_PATH}?region=${r}&hours=${h}`;
  const route = region.locked ? null : routeView(state, region.id, hours);
  return (
    <>
      <Tabs
        label={t('combat.regions')}
        onNavigate={navigate}
        tabs={view.regions.map((r) => ({
          href: href(r.id, hours),
          label: r.name,
          short: r.short,
          current: r.id === region.id,
          icon: <ItemIcon name={r.id} size={24} />,
        }))}
      />
      <Tabs
        label={t('expedition.lengths')}
        onNavigate={navigate}
        tabs={view.lengths.map((l) => ({ href: href(region.id, l.hours), label: l.label, current: l.hours === hours }))}
      />
      {region.locked && <p className={s.note}>{region.locked}</p>}
      {route && <RouteParts route={route} />}
    </>
  );
}

function RouteParts({ route }: { route: RouteView }) {
  return (
    <>
      <p className={s.summary}>{route.summary}</p>
      <Twists twists={route.twists} />
      <Ribbon stages={route.stages} boss={route.boss.id} />
      <div className={s.fork}>
        <h3 className={s.subhead}>{t('expedition.fork')}</h3>
        {route.roads.map((r) => (
          <ActionRow
            key={r.id}
            icon={<ItemIcon name="fork" size={32} />}
            name={r.name}
            facts={[r.text]}
            actions={
              <Button
                variant="primary"
                onClick={() => {
                  const set = game.act('expeditions', 'setOut', {
                    region: route.region,
                    hours: route.hours,
                    road: r.id,
                  });
                  if (set && typeof set === 'object' && 'ok' in set && set.ok)
                    game.command({
                      type: 'start',
                      lane: 'combat',
                      action: { feature: 'expeditions', id: route.region },
                    });
                }}
              >
                {r.label}
              </Button>
            }
          />
        ))}
      </div>
    </>
  );
}

function Run({ run }: { run: RunView }) {
  const [sure, setSure] = useState(false);
  const { state } = useGame();
  const fighting = LANE_IDS.some((l) => {
    const c = state.lanes[l].current;
    return c !== null && actionKey(c.action) === `expeditions:${run.region}`;
  });
  return (
    <>
      <p className={s.summary}>
        <span>{run.title}</span>
        <span>{run.road}</span>
      </p>
      <Twists twists={run.twists} />
      <ProgressBar value={run.progress} label={run.stage} tone="woad" />
      <p className={s.note}>{run.marks}</p>
      <Ribbon stages={run.stages} boss={run.boss.id} />
      {run.finds.length > 0 && (
        <p className={s.finds}>
          {run.finds.map((f, i) =>
            hasIcon(f) ? <ItemIcon key={i} name={f} size={24} label={t(`item.${f}`)} /> : null,
          )}
        </p>
      )}
      <div className={s.buttons}>
        {!fighting && (
          <Button
            variant="primary"
            onClick={() =>
              game.command({ type: 'start', lane: 'combat', action: { feature: 'expeditions', id: run.region } })
            }
          >
            {run.stages[0]?.state === 'now' ? t('expedition.setOut') : t('expedition.carryOn')}
          </Button>
        )}
        {sure ? (
          <>
            <span className={s.note}>{t('expedition.giveUpSure')}</span>
            <Button onClick={() => (game.act('expeditions', 'abandon', {}), setSure(false))}>
              {t('expedition.giveUp')}
            </Button>
            <Button variant="quiet" onClick={() => setSure(false)}>
              {t('expedition.keepGoing')}
            </Button>
          </>
        ) : (
          <Button variant="quiet" onClick={() => setSure(true)}>
            {t('expedition.giveUp')}
          </Button>
        )}
      </div>
    </>
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
