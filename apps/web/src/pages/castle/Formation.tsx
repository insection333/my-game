// The Garrison tab's right column: the attack formation (free to change) and the garrison (1% of the
// required treasury, then two hours' rest, pinned after a scouting), each unit's share stepped by five with
// the flank warning past 60%; then the trap and the castellan, which share the garrison's rest.
import { COMBAT, DOCTRINES, TRAPS, UNIT_IDS, fmt, t } from '@idle-clash/content';
import { castleEngine as E } from '@idle-clash/features';
import { ActionRow, Button, Panel, Pill } from '@idle-clash/ui';
import { useState } from 'react';
import { castellanDoes, castellanName, presetName, trapName, unitName } from './labels.ts';
import { castleAct } from './store.ts';
import { step, type Three } from './shares.ts';
import { affords, useSyncedCastle } from './synced.ts';
import s from './castle.module.css';

/** Formations at a press: even, or one troop at 60% (the most before it is flanked). */
const PRESETS: readonly (readonly [string, Three])[] = [
  ['even', [34, 33, 33]],
  ['vanguard', [60, 20, 20]],
  ['outriders', [20, 60, 20]],
  ['siege', [20, 20, 60]],
];

/** Why the garrison, trap and castellan cannot change now, or null. */
export function defenceWait(c: E.Castle, now: number): string | null {
  if (c.reconLockdownUntil !== null && c.reconLockdownUntil > now)
    return t('castle.defence.pinned', { time: fmt.duration(c.reconLockdownUntil - now) });
  if (c.defenseChangedAt !== null && now - c.defenseChangedAt < COMBAT.DEFENSE_COOLDOWN_MS)
    return t('castle.defence.cooling', { time: fmt.duration(c.defenseChangedAt + COMBAT.DEFENSE_COOLDOWN_MS - now) });
  return null;
}

export function Formations() {
  const { castle, now, purse, totalLevel, busy } = useSyncedCastle();
  if (!castle) return null;
  const wait = defenceWait(castle, now);
  const cost = E.defenseChangeCost(castle, totalLevel);
  return (
    <>
      <section data-section>
        <Panel title={t('castle.formation.attack')}>
          <Formation
            key={castle.offense.join()}
            slot="castle.offense"
            saved={castle.offense}
            label={t('castle.formation.save')}
            disabled={busy}
            onSave={(shares) => castleAct({ type: 'offense', shares })}
          />
          <p className={s.hint}>{t('castle.formation.attack.note')}</p>
        </Panel>
      </section>
      <section data-section>
        <Panel title={t('castle.formation.garrison')}>
          <Formation
            key={castle.defense.join()}
            slot="castle.defense"
            saved={castle.defense}
            label={t('castle.formation.saveFor', { gold: fmt.short(cost) })}
            disabled={busy || wait !== null || !affords(castle, purse, cost)}
            wait={wait}
            onSave={(defense) => castleAct({ type: 'defense', defense })}
          />
        </Panel>
      </section>
    </>
  );
}

function Formation(props: {
  slot: string;
  saved: readonly number[];
  label: string;
  disabled: boolean;
  wait?: string | null;
  onSave: (shares: Three) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState<Three>([...props.saved] as Three);
  const changed = draft.some((x, i) => x !== props.saved[i]);
  return (
    <div data-slot={props.slot} className={s.formation}>
      <div className={s.presets}>
        {PRESETS.map(([key, shares]) => (
          <Button
            key={key}
            variant="quiet"
            aria-pressed={draft.every((x, i) => x === shares[i])}
            onClick={() => setDraft([...shares])}
          >
            {presetName(key)}
          </Button>
        ))}
      </div>
      {UNIT_IDS.map((u, i) => {
        const name = unitName(u);
        return (
          <div key={u} className={s.share}>
            <span className={s.shareName}>{name}</span>
            <Button
              aria-label={t('castle.formation.less', { unit: name })}
              disabled={draft[i] === 0}
              onClick={() => setDraft(step(draft, i, false))}
            >
              −
            </Button>
            <span className={s.sharePct}>{fmt.pct(draft[i])}</span>
            <Button
              aria-label={t('castle.formation.more', { unit: name })}
              disabled={draft[i] === 100}
              onClick={() => setDraft(step(draft, i, true))}
            >
              +
            </Button>
          </div>
        );
      })}
      {UNIT_IDS.map((u, i) =>
        draft[i] / 100 > COMBAT.FLANK_THRESHOLD ? (
          <p key={u} className={s.flanked}>
            {t('castle.formation.flanked', {
              unit: unitName(u),
              pct: fmt.pct(Math.round(E.flankMult(draft[i] / 100) * 100)),
            })}
          </p>
        ) : null,
      )}
      <div className={s.save}>
        {changed ? (
          <Button variant="primary" disabled={props.disabled} onClick={() => void props.onSave(draft)}>
            {props.label}
          </Button>
        ) : (
          <Pill>{t('castle.formation.saved')}</Pill>
        )}
        {props.wait && <span className={s.muted}>{props.wait}</span>}
      </div>
    </div>
  );
}

export function Defences() {
  const { castle, now, purse, totalLevel, busy } = useSyncedCastle();
  if (!castle) return null;
  const wait = defenceWait(castle, now);
  const cost = E.defenseChangeCost(castle, totalLevel);
  const can = !busy && wait === null && affords(castle, purse, cost);
  const choose = (chosen: boolean, onChoose: () => void) =>
    chosen ? (
      <Pill tone="moss">{t('castle.chosen')}</Pill>
    ) : (
      <Button disabled={!can} onClick={onChoose}>
        {t('castle.choose', { gold: fmt.short(cost) })}
      </Button>
    );
  return (
    <>
      <section data-section>
        <Panel title={t('castle.trap.title')} flush>
          <div data-slot="castle.trap">
            {TRAPS.map((x) => (
              <ActionRow
                key={x.id}
                name={trapName(x.id)}
                facts={[t('castle.trap.against', { unit: unitName(x.against) })]}
                actions={choose(castle.activeTrap === x.id, () => void castleAct({ type: 'defense', trap: x.id }))}
              />
            ))}
          </div>
        </Panel>
      </section>
      <section data-section>
        <Panel title={t('castle.castellan.title')} flush>
          <div data-slot="castle.castellan">
            {DOCTRINES.map((x) => (
              <ActionRow
                key={x.id}
                name={castellanName(x.id)}
                facts={[castellanDoes(x.id)]}
                actions={choose(castle.castellan === x.id, () => void castleAct({ type: 'defense', castellan: x.id }))}
              />
            ))}
          </div>
          {wait && <p className={s.note}>{wait}</p>}
        </Panel>
      </section>
    </>
  );
}
