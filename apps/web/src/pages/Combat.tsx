// Combat: the loadout (gear worn on a figure, your style and the triangle, health, food), every foe with
// Your odds, and the vendor's food.
// A gear slot opens a sheet of the matching gear in the Storehouse (`?panel=gear&slot=weapon`).
import { fmt, t } from '@idle-clash/content';
import type { Feature, FoeRow, LoadoutSlot, LoadoutView, TrianglePart } from '@idle-clash/features';
import { actionKey, LANE_IDS } from '@idle-clash/kernel';
import { ActionRow, Button, hasIcon, ItemIcon, Panel, Pill, Sheet, Tabs } from '@idle-clash/ui';
import { useGame } from '../game/hooks.ts';
import { game } from '../game/store.ts';
import { navigate, useLocation, withPanel } from '../router.ts';
import { fillFor, Slot } from '../slots.tsx';
import { CombatFood } from './CombatFood.tsx';
import { Loadout } from './Loadout.tsx';
import { PageHead } from './PageHead.tsx';
import { NotFound } from './Simple.tsx';
import s from './combat.module.css';

const VERDICT_TONE = { easy: 'moss', fair: 'woad', costly: 'gold', tooStrong: 'neutral' } as const;

export function Combat() {
  const { features } = useGame();
  const combat = features.find((f) => f.id === 'combat');
  return combat ? <CombatPage combat={combat} /> : <NotFound />;
}

function CombatPage({ combat }: { combat: Feature }) {
  const { state, now } = useGame();
  const { panel } = useLocation();
  const loadout = fillFor<LoadoutView>(combat, 'combat.loadout', state, now)!;
  const every = fillFor<FoeRow[]>(combat, 'combat.foes', state, now) ?? [];
  // One region at a time (the march, the Sunken Fen, the Ashen Peaks), and in it one tier at a time:
  // those asked for in the address, or the newest with a foe open.
  const query = new URLSearchParams(location.search);
  const regions = [...new Map(every.map((f) => [f.region, f])).entries()];
  const newestFoe = [...every].reverse().find((f) => !f.locked) ?? every[0];
  const askedTier = Number(query.get('tier'));
  const region =
    regions.find(([id]) => id === query.get('region'))?.[0] ??
    every.find((f) => f.tier === askedTier)?.region ??
    newestFoe?.region;
  const all = every.filter((f) => f.region === region);
  const tiers = [...new Set(all.map((f) => f.tier))].sort((a, b) => a - b);
  const newest = Math.max(tiers[0] ?? 1, ...all.filter((f) => !f.locked).map((f) => f.tier));
  const tier = tiers.includes(askedTier) ? askedTier : newest;
  const foes = all.filter((f) => f.tier === tier);
  const triangle = fillFor<TrianglePart[]>(combat, 'combat.triangle', state, now) ?? [];
  const fighting = (f: FoeRow) =>
    LANE_IDS.some((l) => state.lanes[l].current && actionKey(state.lanes[l].current.action) === actionKey(f.foe));
  const sheetSlot = panel === 'gear' ? new URLSearchParams(location.search).get('slot') : null;
  const open = loadout.slots.find((x) => x.slot === sheetSlot);
  return (
    <>
      <PageHead title={t('combat.title')}>
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
      </PageHead>
      <div className={s.layout}>
        <section data-section className={s.loadoutArea}>
          <Loadout loadout={loadout} triangle={triangle} />
        </section>
        <section data-section className={s.foesArea}>
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
          facts={c.needs ? [c.needs] : []}
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
