// The Citadel (IA.md, Castle Clash): the edict and what it gives the rest of the game, the treasury that
// powers it (deposit, withdraw, and whether costs come from the purse or the treasury), the four buildings,
// the walls' repair, and the deep foundations.
import { BUILDINGS, EDICTS, ECONOMY, fmt, t } from '@idle-clash/content';
import { castleEngine as E } from '@idle-clash/features';
import { ActionRow, Button, Field, ItemIcon, Panel, Pill } from '@idle-clash/ui';
import { useState } from 'react';
import { buildingDoes, buildingName, decreeDoes, edictGives, edictName } from './labels.ts';
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

/** The treasury the Top up button fills to: half again what the edict needs. */
const TOP_UP = 1.5;
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

function Treasury() {
  const { castle, now, purse, totalLevel, busy } = useSyncedCastle();
  const [amount, setAmount] = useState('');
  if (!castle) return null;
  // Whole gold, with any spaces or thousands commas a player types; anything else is not an amount.
  const digits = amount.replace(/[\s,_]/g, '');
  const gold = /^\d{1,15}$/.test(digits) ? Number(digits) : 0;
  const valid = gold > 0;
  const locked = castle.withdrawLockdownUntil !== null && castle.withdrawLockdownUntil > now;
  const required = E.requiredTreasury(castle, totalLevel);
  const target = Math.ceil(required * TOP_UP);
  const topUp = Math.max(0, target - castle.treasury);
  const move = async (type: 'deposit' | 'withdraw') => {
    if (await castleAct({ type, gold })) setAmount('');
  };
  return (
    <section data-section>
      <Panel title={t('castle.treasury.title')}>
        <div data-slot="castle.treasury" className={s.treasury}>
          <p className={s.held}>
            {t('castle.treasuryHeld', {
              gold: fmt.short(castle.treasury),
              raidable: fmt.short(E.raidableGold(castle, now)),
            })}
          </p>
          <p>{t('castle.treasury.required', { gold: fmt.short(required) })}</p>
          <p className={s.muted}>{t('castle.treasury.upkeep')}</p>
          <p className={s.muted}>{t('castle.decree.does', { does: decreeDoes(E.decreeOf(now).id) })}</p>
          {topUp > 0 && (
            <div className={s.save}>
              <Button
                variant="primary"
                disabled={busy || purse < 1}
                onClick={() => void castleAct({ type: 'deposit', gold: Math.min(topUp, Math.floor(purse)) })}
              >
                {t('castle.topUp', { target: fmt.short(target) })}
              </Button>
              <span className={s.muted}>{t('castle.topUp.hint')}</span>
            </div>
          )}
          <div className={s.move}>
            <Field
              label={t('castle.treasury.amount')}
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Button disabled={busy || !valid || gold > purse} onClick={() => void move('deposit')}>
              {t('castle.deposit')}
            </Button>
            <Button disabled={busy || !valid || locked || gold > castle.treasury} onClick={() => void move('withdraw')}>
              {t('castle.withdraw')}
            </Button>
          </div>
          <p className={s.hint}>
            {locked
              ? t('castle.withdraw.locked', { time: fmt.duration(castle.withdrawLockdownUntil! - now) })
              : t('castle.withdraw.hint')}
          </p>
          <div className={s.payFrom}>
            <span>{castle.payFromTreasury ? t('castle.payFrom.treasury') : t('castle.payFrom.purse')}</span>
            <Button
              variant="quiet"
              disabled={busy}
              onClick={() => void castleAct({ type: 'payFrom', treasury: !castle.payFromTreasury })}
            >
              {castle.payFromTreasury ? t('castle.payFrom.usePurse') : t('castle.payFrom.useTreasury')}
            </Button>
          </div>
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
  const { castle, now, purse, busy } = useSyncedCastle();
  if (!castle) return null;
  const mending = 100 - castle.wallIntegrity > 0.01;
  const repair = E.instantCost(castle, 100 - castle.wallIntegrity, now);
  return (
    <section data-section>
      <Panel title={t('castle.buildings.title')} flush>
        <div data-slot="castle.buildings">
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
                actions={
                  top ? (
                    <Pill tone="moss">{t('castle.highest')}</Pill>
                  ) : (
                    <Button
                      disabled={busy || !affords(castle, purse, cost)}
                      onClick={() => void castleAct({ type: 'upgrade', id: b.id })}
                    >
                      {t('castle.raiseFor', { gold: fmt.short(cost) })}
                    </Button>
                  )
                }
              />
            );
          })}
        </div>
        {mending && (
          <div className={s.note}>
            <div className={s.save}>
              <span>{t('castle.walls.integrity', { pct: fmt.pct(Math.floor(castle.wallIntegrity)) })}</span>
              <Button
                variant="quiet"
                disabled={busy || !hasAp(castle, repair.ap) || !affords(castle, purse, repair.gold)}
                onClick={() => void castleAct({ type: 'mend', what: 'walls' })}
              >
                {t('castle.repair', { gold: fmt.short(repair.gold), ap: fmt.int(repair.ap) })}
              </Button>
            </div>
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
