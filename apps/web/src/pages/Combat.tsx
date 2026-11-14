// Combat: the loadout (gear worn on a figure, your style and the triangle, health, food), the fight in
// the lane played out (the arena, session 42), every foe with Your odds, and the vendor's food.
// A gear slot opens a sheet of the matching gear in the Storehouse (`?panel=gear&slot=weapon`).
import { fmt, t } from '@idle-clash/content';
import type { Feature, FoeRow, LoadoutSlot, LoadoutView, TrianglePart } from '@idle-clash/features';
import { actionKey, LANE_IDS } from '@idle-clash/kernel';
import { ActionRow, Button, hasIcon, ItemIcon, Panel, Pill, Sheet, Tabs } from '@idle-clash/ui';
import { useEffect, useRef } from 'react';
import { useGame } from '../game/hooks.ts';
import { game } from '../game/store.ts';
import { navigate, useLocation, withPanel } from '../router.ts';
import { fillFor, Slot } from '../slots.tsx';
import { CombatArena, useFightClock } from './CombatArena.tsx';
import { CombatFood } from './CombatFood.tsx';
import { Loadout } from './Loadout.tsx';
import { CombatHead } from './CombatHead.tsx';
import { NotFound } from './Simple.tsx';
import s from './combat.module.css';

const VERDICT_TONE = { easy: 'moss', fair: 'woad', costly: 'gold', tooStrong: 'neutral' } as const;

export function Combat() {
  const { features } = useGame();
  const combat = features.find((f) => f.id === 'combat');
  return combat ? <CombatPage combat={combat} /> : <NotFound />;
}

function CombatPage({ combat }: { combat: Feature }) {
  const { state } = useGame();
  // Swing by swing while a fight lasts, so the arena and the health bar move together.
  const now = useFightClock();
  const { panel } = useLocation();
  const loadout = fillFor<LoadoutView>(combat, 'combat.loadout', state, now)!;
  const every = fillFor<FoeRow[]>(combat, 'combat.foes', state, now) ?? [];
  // One region at a time (the march, the Sunken Fen, the Ashen Peaks), and in it one tier at a time:
  // those asked for in the address, or the newest with a foe open.
  const query = new URLSearchParams(location.search);
  // Or, with none asked for, the region and tier of the foe being fought, so the arena opens over it.
  const regions = [...new Map(every.map((f) => [f.region, f])).entries()];
  const newestFoe = [...every].reverse().find((f) => !f.locked) ?? every[0];
  const run = state.lanes.combat.current;
  const fought = run?.action.feature === 'combat' ? every.find((f) => f.foe.id === run.action.id) : undefined;
  const askedTier = Number(query.get('tier'));
  const region =
    regions.find(([id]) => id === query.get('region'))?.[0] ??
    every.find((f) => f.tier === askedTier)?.region ??
    fought?.region ??
    newestFoe?.region;
  const all = every.filter((f) => f.region === region);
  const tiers = [...new Set(all.map((f) => f.tier))].sort((a, b) => a - b);
  const newest = Math.max(tiers[0] ?? 1, ...all.filter((f) => !f.locked).map((f) => f.tier));
  const tier = tiers.includes(askedTier) ? askedTier : fought?.region === region ? fought.tier : newest;
  const foes = all.filter((f) => f.tier === tier);
  const triangle = fillFor<TrianglePart[]>(combat, 'combat.triangle', state, now) ?? [];
  const fighting = (f: FoeRow) =>
    LANE_IDS.some((l) => state.lanes[l].current && actionKey(state.lanes[l].current.action) === actionKey(f.foe));
  // Next does nothing for the foe the lane fights (it repeats) or already has next (session 81).
  const queued = (f: FoeRow) => {
    const next = state.lanes.combat.next;
    return next ? actionKey(next) === actionKey(f.foe) : false;
  };
  // A region chosen brings its foes into view (session 99): on a phone the loadout fills the screen under
  // the region tabs, and a press changed only the tab's underline. The first showing never moves.
  const foesRef = useRef<HTMLElement>(null);
  const shownRegion = useRef(region);
  useEffect(() => {
    if (shownRegion.current === region) return;
    shownRegion.current = region;
    const el = foesRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top;
    if (top < 0 || top > innerHeight / 2) el.scrollIntoView({ block: 'start' });
  }, [region]);
  const sheetSlot = panel === 'gear' ? new URLSearchParams(location.search).get('slot') : null;
  const open = loadout.slots.find((x) => x.slot === sheetSlot);
  return (
    <>
      <CombatHead>
        {regions.length > 1 && (
          <Tabs
            label={t('combat.regions')}
            onNavigate={navigate}
            tabs={regions.map(([id, f]) => ({
              href: `/combat?region=${id}`,
              label: f.regionName,
              short: f.regionShort,
              current: id === region,
            }))}
          />
        )}
      </CombatHead>
      <div className={s.layout}>
        <section data-section className={s.loadoutArea}>
          <Loadout loadout={loadout} triangle={triangle} />
        </section>
        <section data-section className={s.foesArea} ref={foesRef}>
          <Panel title={t('combat.foes')} flush>
            {tiers.length > 1 && (
              <div className={s.tierTabs}>
                <Tabs
                  label={t('skill.tiers')}
                  onNavigate={navigate}
                  tabs={tiers.map((n) => {
                    const first = all.find((f) => f.tier === n)!.foe.id;
                    return {
                      href: `/combat?region=${region}&tier=${n}`,
                      label: t('skill.tier', { tier: fmt.int(n) }),
                      short: fmt.int(n),
                      current: n === tier,
                      icon: hasIcon(first) ? <ItemIcon name={first} size={24} /> : undefined,
                    };
                  })}
                />
              </div>
            )}
            <Slot id="combat.foes">
              {/* The fight the lane is in, over the foes to choose from (or where it is, if elsewhere). */}
              <CombatArena now={now} place={{ region: region ?? '', tier }} />
              {foes.map((f) => (
                <ActionRow
                  key={f.foe.id}
                  icon={hasIcon(f.foe.id) ? <ItemIcon name={f.foe.id} size={32} /> : undefined}
                  name={f.name}
                  locked={f.locked}
                  facts={[f.style, f.level, ...(f.matchup ? [f.matchup] : []), ...f.facts]}
                  status={
                    f.locked ? (
                      <Pill>{f.opensAt}</Pill>
                    ) : !loadout.style ? (
                      <Pill>{t('stop.noWeapon')}</Pill>
                    ) : fighting(f) ? (
                      <Pill tone="woad">{t('action.working')}</Pill>
                    ) : f.verdict ? (
                      <Pill tone={VERDICT_TONE[f.verdictId as keyof typeof VERDICT_TONE]}>{f.verdict}</Pill>
                    ) : undefined
                  }
                  actions={
                    !f.locked &&
                    loadout.style && (
                      <>
                        <Button
                          variant="primary"
                          disabled={fighting(f)}
                          onClick={() => game.command({ type: 'start', lane: 'combat', action: f.foe })}
                        >
                          {t('combat.fight')}
                        </Button>
                        <Button
                          variant="secondary"
                          disabled={fighting(f) || queued(f)}
                          onClick={() => game.command({ type: 'queueNext', lane: 'combat', action: f.foe })}
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
        </section>
        <section data-section className={s.foodArea}>
          <CombatFood />
        </section>
      </div>
      {open && (
        <Sheet title={open.label} closeLabel={t('shell.close')} onClose={() => navigate(withPanel(null))}>
          <GearChoices gear={open} />
        </Sheet>
      )}
    </>
  );
}

function GearChoices({ gear }: { gear: LoadoutSlot }) {
  if (!gear.choices.length) return <p className={s.note}>{t('gear.nothingToWear')}</p>;
  return (
    <div>
      {gear.choices.map((c) => (
        <ActionRow
          key={c.item}
          icon={<ItemIcon name={c.item} size={32} />}
          name={c.name}
          facts={[c.does, ...(c.needs ? [c.needs] : [])]}
          status={c.worn ? <Pill tone="moss">{t('gear.worn')}</Pill> : undefined}
          actions={
            c.worn ? (
              <Button variant="secondary" onClick={() => game.act('combat', 'remove', { slot: gear.slot })}>
                {t('gear.remove')}
              </Button>
            ) : (
              <Button
                variant="primary"
                disabled={!!c.needs}
                onClick={() => game.act('combat', 'wear', { item: c.item })}
              >
                {t('gear.wear')}
              </Button>
            )
          }
        />
      ))}
    </div>
  );
}
