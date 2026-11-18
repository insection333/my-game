// The Citadel (IA.md, Castle Clash): the edict and what it gives the rest of the game, the treasury that
// powers it (deposit, withdraw, and whether costs come from the purse or the treasury), the four buildings,
// the walls' repair, and the deep foundations.
import { BUILDINGS, EDICTS, ECONOMY, fmt, t } from '@idle-clash/content';
import { castleEngine as E } from '@idle-clash/features';
import { ActionRow, Button, ItemIcon, Panel, Pill } from '@idle-clash/ui';
import { buildingDoes, buildingName, edictGives, edictName } from './labels.ts';
import { LevelUp, Mend } from './Steps.tsx';
import { Treasury } from './Treasury.tsx';
import { castleAct } from './store.ts';
import { affords, hasAp, shortText, useSyncedCastle } from './synced.ts';
import s from './castle.module.css';

/** Each building's icon (the castle's family of icons, ART.md). */
const BUILDING_ICON: Record<(typeof BUILDINGS)[number]['id'], string> = {
  walls: 'castle-walls',
  deepVault: 'castle-deep-vault',
  watchtower: 'castle-watchtower',
  spyGuild: 'castle-spy-guild',
};

const pct = (n: number) => fmt.pct(Math.round(n * 10) / 10);

export function Citadel() {
  return (
    <div className={s.grid}>
      <div className={s.column}>
        <Edicts />
        <Treasury />
      </div>
      <div className={s.column}>
        <Buildings />
        <Foundations />
      </div>
    </div>
  );
}

function Edicts() {
  const { castle, totalLevel, busy } = useSyncedCastle();
  if (!castle) return null;
  const required = E.requiredTreasury(castle, totalLevel);
  const paid = castle.treasury >= required;
  return (
    <section data-section>
      <Panel title={t('castle.edict.title')} flush>
        <div data-slot="castle.edict">
          {EDICTS.map((e) => {
            const chosen = castle.edict === e.id;
            const gives = E.edictBonusPct({ ...castle, edict: e.id }, totalLevel);
            return (
              <ActionRow
                key={e.id}
                iconYields
                icon={<ItemIcon name={`edict-${e.id}`} size={32} />}
                name={edictName(e.id)}
                facts={[edictGives(e.lifts, { pct: pct(paid ? gives : ECONOMY.EDICT_BASE_PCT) })]}
                status={
                  chosen ? (
                    <Pill tone={paid ? 'moss' : 'gold'}>
                      {paid ? t('castle.edict.inForce') : t('castle.edict.unpaid', { gold: fmt.short(required) })}
                    </Pill>
                  ) : undefined
                }
                actions={
                  <Button
                    variant={chosen ? 'quiet' : 'secondary'}
                    disabled={busy}
                    onClick={() => void castleAct({ type: 'edict', edict: chosen ? null : e.id })}
                  >
                    {chosen ? t('castle.edict.revoke') : t('castle.edict.choose')}
                  </Button>
                }
              />
            );
          })}
        </div>
      </Panel>
    </section>
  );
}

function does(c: E.Castle, id: string, now: number): string {
  if (id === 'walls') return buildingDoes(id, { pct: pct(E.wallBonus(c.levels.walls, c.wallIntegrity) * 100) });
  if (id === 'deepVault') return buildingDoes(id, { gold: fmt.short(E.protectedGold(c, now)) });
  // Spying against a castle of the same level: the guild's chance against the tower, as the War room shows.
  const vs = (guild: number, tower: number) =>
    E.spyChance(
      { ...c, userId: 'spy', levels: { ...c.levels, spyGuild: guild } },
      { ...c, userId: 'held', levels: { ...c.levels, watchtower: tower } },
      now,
    );
  if (id === 'watchtower')
    return buildingDoes(id, { pct: fmt.pct(Math.round((1 - vs(c.levels.watchtower, c.levels.watchtower)) * 100)) });
  return buildingDoes(id, { pct: fmt.pct(Math.round(vs(c.levels.spyGuild, c.levels.spyGuild) * 100)) });
}

function Buildings() {
  const { castle, now, purse } = useSyncedCastle();
  if (!castle) return null;
  const mending = 100 - castle.wallIntegrity > 0.01;
  return (
    <section data-section>
      <Panel title={t('castle.buildings.title')} flush>
        {/* Four rows, each with its Level up: on a short screen they scroll inside the panel (session 134). */}
        <div
          data-slot="castle.buildings"
          className={s.relics}
          data-scrollbox
          tabIndex={0}
          role="group"
          aria-label={t('castle.buildings.title')}
        >
          {BUILDINGS.map((b) => {
            const level = castle.levels[b.id];
            const top = level >= ECONOMY.MAX_LEVEL;
            const cost = E.levelCost(castle, b.cost, level, now);
            return (
              <ActionRow
                key={b.id}
                iconYields
                icon={<ItemIcon name={BUILDING_ICON[b.id]} size={32} />}
                name={buildingName(b.id)}
                status={<Pill>{t('castle.level', { level: fmt.int(level) })}</Pill>}
                facts={[
                  does(castle, b.id, now),
                  ...(top ? [] : [shortText(castle, purse, cost)].filter((x) => x !== null)),
                ]}
                foot={<LevelUp id={b.id} />}
              />
            );
          })}
        </div>
        {mending && (
          <div className={s.note}>
            <span>
              {t('castle.walls.integrity', {
                pct: fmt.pct(Math.floor(castle.wallIntegrity)),
                rate: fmt.pct(E.recoveryPerHour(castle, now)),
              })}
            </span>
            <Mend what="walls" points={100 - castle.wallIntegrity} />
          </div>
        )}
      </Panel>
    </section>
  );
}

function Foundations() {
  const { castle, now, purse, busy } = useSyncedCastle();
  if (!castle) return null;
  const cost = E.excavationCost(castle, now);
  return (
    <section data-section>
      <Panel flush>
        <div data-slot="castle.dig">
          <ActionRow
            name={t('castle.dig.title')}
            facts={[
              t('castle.dig.depth', {
                depth: fmt.int(castle.excavationDepth),
                mult: fmt.num(Math.round(E.idleMultiplier(castle) * 1000) / 1000),
              }),
            ]}
            actions={
              <Button
                disabled={busy || !hasAp(castle, cost.ap) || !affords(castle, purse, cost.gold)}
                onClick={() => void castleAct({ type: 'excavate' })}
              >
                {t('castle.dig', { gold: fmt.short(cost.gold), ap: fmt.int(cost.ap) })}
              </Button>
            }
          />
        </div>
      </Panel>
    </section>
  );
}
