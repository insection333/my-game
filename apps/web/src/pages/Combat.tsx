// Combat: the loadout (gear worn, health, food), every foe with Your odds, and the triangle's key.
// A gear slot opens a sheet of the matching gear in the Storehouse (`?panel=gear&slot=weapon`).
import { t } from '@idle-clash/content';
import type { Feature, FoeRow, LoadoutSlot, LoadoutView } from '@idle-clash/features';
import { actionKey, LANE_IDS } from '@idle-clash/kernel';
import { ActionRow, Button, hasIcon, ItemIcon, Panel, Pill, ProgressBar, Sheet } from '@idle-clash/ui';
import { useGame } from '../game/hooks.ts';
import { game } from '../game/store.ts';
import { navigate, useLocation, withPanel } from '../router.ts';
import { fillFor, Slot } from '../slots.tsx';
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
  const foes = fillFor<FoeRow[]>(combat, 'combat.foes', state, now) ?? [];
  const triangle = fillFor<string[]>(combat, 'combat.triangle', state, now) ?? [];
  const fighting = (f: FoeRow) =>
    LANE_IDS.some((l) => state.lanes[l].current && actionKey(state.lanes[l].current.action) === actionKey(f.foe));
  const sheetSlot = panel === 'gear' ? new URLSearchParams(location.search).get('slot') : null;
  const open = loadout.slots.find((x) => x.slot === sheetSlot);
  return (
    <>
      <PageHead title={t('combat.title')} />
      <div className={s.layout}>
        <section data-section className={s.side}>
          <Panel title={t('combat.loadout')} aside={loadout.style ?? undefined} flush>
            <Slot id="combat.loadout" className={s.loadout}>
              <div className={s.gear}>
                {loadout.slots.map((g) => (
                  <GearButton key={g.slot} gear={g} />
                ))}
              </div>
              <div className={s.health}>
                <ProgressBar value={loadout.health} label={loadout.healthText} />
                <div className={s.healthLine}>
                  <span>{loadout.healthText}</span>
                  <span>{loadout.food}</span>
                </div>
              </div>
            </Slot>
          </Panel>
          <Panel title={t('combat.triangle')} className={s.key}>
            <Slot id="combat.triangle">
              <ul className={s.triangle}>
                {triangle.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </Slot>
          </Panel>
        </section>
        <section data-section>
          <Panel title={t('combat.foes')} flush>
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
      </div>
      {open && (
        <Sheet title={open.label} closeLabel={t('shell.close')} onClose={() => navigate(withPanel(null))}>
          <GearChoices gear={open} />
        </Sheet>
      )}
    </>
  );
}

function GearButton({ gear }: { gear: LoadoutSlot }) {
  // With no weapon to wear, the weapon slot leads to Smithing, where one is forged.
  const forge = gear.slot === 'weapon' && !gear.item && !gear.choices.length;
  const href = forge ? '/skills/smithing' : `${location.pathname}?panel=gear&slot=${gear.slot}`;
  return (
    <a
      href={href}
      data-ui="GearSlot"
      className={s.slot}
      data-empty={gear.item ? undefined : true}
      data-slot-name={gear.slot}
      onClick={(e) => (e.preventDefault(), navigate(href))}
    >
      {gear.item ? <ItemIcon name={gear.item} size={32} /> : <span className={s.emptyIcon} />}
      <span className={s.slotText}>
        <span className={s.slotLabel}>{gear.label}</span>
        <span className={s.slotName}>{gear.name}</span>
      </span>
    </a>
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
