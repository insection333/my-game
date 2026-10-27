// The Combat page's Expeditions tab (IA.md): the next run's route in the region and length chosen, with
// its twists, and the fork's two roads to set out by (or the run under way, stage by stage); beside
// them the bosses and the relics (ExpeditionSide.tsx).
import { t } from '@idle-clash/content';
import {
  routeView,
  type BossRow,
  type ExpeditionView,
  type RelicsView,
  type RouteView,
  type RunView,
  type TwistView,
} from '@idle-clash/features';
import { actionKey, LANE_IDS } from '@idle-clash/kernel';
import { ActionRow, Button, hasIcon, ItemIcon, Panel, Pill, ProgressBar, Tabs } from '@idle-clash/ui';
import { useState } from 'react';
import { useGame } from '../game/hooks.ts';
import { game } from '../game/store.ts';
import { navigate, useLocation } from '../router.ts';
import { fills, Slot } from '../slots.tsx';
import { CombatHead } from './CombatHead.tsx';
import { Legend, Ribbon, Twists } from './ExpeditionRoute.tsx';
import { Bosses, Relics } from './ExpeditionSide.tsx';
import s from './expeditions.module.css';

export const EXPEDITIONS_PATH = '/combat/expeditions';

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
          <section data-section>
            <Slot id="combat.expedition" className={s.runArea}>
              {view.data.run ? <Run view={view.data} run={view.data.run} /> : <Plan view={view.data} />}
            </Slot>
          </section>
        )}
        <div className={s.side}>
          {bosses && (
            <section data-section>
              <Bosses bosses={bosses.data} />
            </section>
          )}
          {relics && (
            <section data-section>
              <Relics relics={relics.data} />
            </section>
          )}
        </div>
      </div>
    </>
  );
}

/** Choosing a run: the region and length, the route they make with its twists, then the fork's roads. */
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
      <Panel title={t('expedition.title')} aside={<Pill tone="gold">{view.marks}</Pill>}>
        <div className={s.stack}>
          <Tabs
            label={t('combat.regions')}
            onNavigate={navigate}
            tabs={view.regions.map((r) => ({
              href: href(r.id, hours),
              label: r.name,
              short: r.short,
              current: r.id === region.id,
            }))}
          />
          <Tabs
            label={t('expedition.lengths')}
            onNavigate={navigate}
            tabs={view.lengths.map((l) => ({
              href: href(region.id, l.hours),
              label: l.label,
              current: l.hours === hours,
            }))}
          />
          {region.locked && <p className={s.note}>{region.locked}</p>}
          {route && (
            <>
              <p className={s.summary}>{route.summary}</p>
              <Twists twists={route.twists} />
              <Ribbon stages={route.stages} boss={route.boss.id} />
            </>
          )}
        </div>
      </Panel>
      {route && <Roads route={route} legend={view.legend} />}
    </>
  );
}

/** The fork's two roads, each setting out by it; and every twist and road there is, folded away. */
function Roads({ route, legend }: { route: RouteView; legend: TwistView[] }) {
  const setOut = (road: string) => {
    const set = game.act('expeditions', 'setOut', { region: route.region, hours: route.hours, road });
    if (set && typeof set === 'object' && 'ok' in set && set.ok)
      game.command({ type: 'start', lane: 'combat', action: { feature: 'expeditions', id: route.region } });
  };
  return (
    <Panel title={t('expedition.fork')} flush>
      {route.roads.map((r) => (
        <ActionRow
          key={r.id}
          icon={<ItemIcon name="fork" size={32} />}
          name={r.name}
          facts={[r.text]}
          actions={
            <Button variant="primary" onClick={() => setOut(r.id)}>
              {r.label}
            </Button>
          }
        />
      ))}
      <div className={s.legendBox}>
        <Legend twists={legend} />
      </div>
    </Panel>
  );
}

/** The run under way: its road and twists, how far it has come, the route with the stages done faded
 *  and the one under way ringed, what it has brought, and Carry on or Give up. */
function Run({ view, run }: { view: ExpeditionView; run: RunView }) {
  const [sure, setSure] = useState(false);
  const { state } = useGame();
  const fighting = LANE_IDS.some((l) => {
    const c = state.lanes[l].current;
    return c !== null && actionKey(c.action) === `expeditions:${run.region}`;
  });
  return (
    <Panel title={t('expedition.title')} aside={<Pill tone="gold">{view.marks}</Pill>}>
      <div className={s.stack}>
        <div>
          <p className={s.summary}>{run.title}</p>
          <p className={s.note}>{run.road}</p>
        </div>
        <Twists twists={run.twists} />
        <ProgressBar value={run.progress} label={run.stage} tone="woad" />
        <p className={s.note}>
          <span>{run.stage}</span> <span>{run.marks}</span>
        </p>
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
        <Legend twists={view.legend} />
      </div>
    </Panel>
  );
}
