// The treasury (IA.md, castle.treasury): what it holds and what of it a raid could take, what an edict
// needs and costs, Top up, gold moved in or out, and whether costs come from the purse or the treasury.
// Gold is moved as the castle's other presses go (session 135, the owner): Deposit or Withdraw, the amount
// typed or set by a slider beside it (each moves the other), and before the press what it leaves, or on a
// withdrawal what arrives and the fifth lost on the way, where the typed box said nothing of what would
// come of it.
import { ECONOMY, fmt, t } from '@idle-clash/content';
import { castleEngine as E } from '@idle-clash/features';
import { Button, Field, Panel } from '@idle-clash/ui';
import { useId, useState } from 'react';
import { decreeDoes } from './labels.ts';
import { castleAct } from './store.ts';
import { useSyncedCastle } from './synced.ts';
import s from './castle.module.css';

/** The treasury the Top up button fills to: half again what the edict needs. */
const TOP_UP = 1.5;

export function Treasury() {
  const { castle, now, purse, totalLevel, busy } = useSyncedCastle();
  if (!castle) return null;
  const required = E.requiredTreasury(castle, totalLevel);
  const target = Math.ceil(required * TOP_UP);
  const topUp = Math.max(0, target - castle.treasury);
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
          <MoveGold />
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

type Way = 'deposit' | 'withdraw';
/** The amount when the slider stands at its end: all there is, as the press lands. */
const ALL = Symbol('all');

/** Deposit or Withdraw; the amount typed or set by the slider (each moves the other: the slider a share of
 *  the purse or the treasury, 0% to all of it, in whole gold rounded down); before the press, what it leaves
 *  or what arrives and what is lost on the way, or why it cannot go; and the press, named by its amount. */
function MoveGold() {
  const { castle, now, purse, busy } = useSyncedCastle();
  const id = useId();
  const [way, setWay] = useState<Way>('deposit');
  // What is typed, or ALL: the slider at its end moves all there is when the press lands (the treasury's
  // upkeep takes a coin or so a second, so a number read now would be more than it holds by then).
  const [amount, setAmount] = useState<string | typeof ALL>('');
  if (!castle) return null;
  const locked = castle.withdrawLockdownUntil !== null && castle.withdrawLockdownUntil > now;
  const from = way === 'deposit' ? Math.floor(purse) : Math.floor(castle.treasury);
  // Whole gold, with any spaces or thousands commas a player types; anything else is not an amount.
  const all = amount === ALL;
  const digits = all ? String(from) : amount.replace(/[\s,_]/g, '');
  const typed = digits !== '';
  const whole = /^\d{1,15}$/.test(digits);
  const gold = whole ? Number(digits) : 0;
  const share = from > 0 ? Math.min(1, gold / from) : 0;
  const lost = way === 'withdraw' ? Math.ceil(gold * ECONOMY.WITHDRAW_TAX) : 0;
  const shut = way === 'withdraw' && locked;
  const over = gold > from;
  const line = shut
    ? t('castle.withdraw.locked', { time: fmt.duration(castle.withdrawLockdownUntil! - now) })
    : from < 1
      ? t(way === 'deposit' ? 'castle.move.nonePurse' : 'castle.move.noneTreasury')
      : typed && !whole
        ? t('castle.move.wholeGold')
        : over
          ? t(way === 'deposit' ? 'castle.move.tooMuchPurse' : 'castle.move.tooMuchTreasury')
          : gold < 1
            ? way === 'withdraw'
              ? t('castle.withdraw.hint')
              : null
            : way === 'deposit'
              ? t('castle.move.leaves', { gold: fmt.short(from - gold) })
              : t('castle.move.arrives', { gold: fmt.short(gold - lost), lost: fmt.short(lost) });
  const slide = (pct: number) => setAmount(pct <= 0 ? '' : pct >= 100 ? ALL : fmt.int(Math.floor((from * pct) / 100)));
  const move = async () => {
    if (await castleAct(all ? { type: way, all: true } : { type: way, gold })) setAmount('');
  };
  return (
    <div className={s.moveGold} role="group" aria-label={t('castle.move.label')}>
      <div className={s.ways}>
        {(['deposit', 'withdraw'] as const).map((w) => (
          <Button
            key={w}
            aria-pressed={way === w}
            data-state={way === w ? 'on' : undefined}
            className={s.wayButton}
            onClick={() => setWay(w)}
          >
            {t(w === 'deposit' ? 'castle.deposit' : 'castle.withdraw')}
          </Button>
        ))}
      </div>
      <div className={s.amount}>
        <Field
          label={t('castle.treasury.amount')}
          inputMode="numeric"
          autoComplete="off"
          value={all ? fmt.int(from) : amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <label className={s.mendBy} htmlFor={id}>
        <span>
          {t(way === 'deposit' ? 'castle.move.ofPurse' : 'castle.move.ofTreasury', { pct: fmt.chance(share) })}
        </span>
        <input
          id={id}
          type="range"
          data-ui="Slider"
          className={s.slider}
          min={0}
          max={100}
          step={1}
          value={Math.round(share * 100)}
          disabled={shut || from < 1}
          onChange={(e) => slide(Number(e.target.value))}
        />
      </label>
      {line && <p className={s.hint}>{line}</p>}
      <Button variant="primary" disabled={busy || shut || gold < 1 || over} onClick={() => void move()}>
        {gold >= 1 && !over
          ? t(way === 'deposit' ? 'castle.move.deposit' : 'castle.move.withdraw', { gold: fmt.short(gold) })
          : t(way === 'deposit' ? 'castle.deposit' : 'castle.withdraw')}
      </Button>
    </div>
  );
}
