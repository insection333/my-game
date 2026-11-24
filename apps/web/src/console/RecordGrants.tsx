// A player's record, Give and take (session 229): gold or any item given or taken (never below what they
// hold), and XP given in a skill, each with a reason kept in the Audit log. The item and the skill are
// chosen by typing their names, offered as the admin types.
import { GRANT_MOST, type RecordResponse } from '@idle-clash/contracts';
import { fmt, t } from '@idle-clash/content';
import { Button, Field, Panel } from '@idle-clash/ui';
import { useState } from 'react';
import { api } from '../api.ts';
import type { Run } from './Players.tsx';
import s from './admin.module.css';
import p from './pages.module.css';

/** The id a typed name stands for, case aside; null for none. */
export const idByName = (list: { id: string; name: string }[], typed: string): string | null =>
  list.find((x) => x.name.toLowerCase() === typed.trim().toLowerCase())?.id ?? null;

/** A whole number from 1 to the most given at once, or null. */
export const amountOf = (typed: string, most = GRANT_MOST): number | null => {
  const n = Number(typed.replace(/[,_\s]/g, ''));
  return Number.isSafeInteger(n) && n >= 1 && n <= most ? n : null;
};

const grantRefusal = (reason: 'notEnough' | 'unknown' | 'repeated') =>
  reason === 'notEnough'
    ? t('record.notEnough')
    : reason === 'repeated'
      ? t('record.repeated')
      : t('record.unknownItem');

export function RecordGrants({ record: r, reload, run }: { record: RecordResponse; reload: () => void; run: Run }) {
  const [item, setItem] = useState('');
  const [count, setCount] = useState('');
  const [reason, setReason] = useState('');
  const [skill, setSkill] = useState('');
  const [xp, setXp] = useState('');
  const [why, setWhy] = useState('');
  const [said, setSaid] = useState<{ text: string; bad: boolean } | null>(null);
  const [saidXp, setSaidXp] = useState<{ text: string; bad: boolean } | null>(null);
  const itemId = idByName(r.catalog, item);
  const amount = amountOf(count);
  const skillId = idByName(
    r.skills.map((x) => ({ id: x.skill, name: x.name })),
    skill,
  );
  const skillName = r.skills.find((x) => x.skill === skillId)?.name ?? skill;
  const held = r.catalog.find((x) => x.id === itemId)?.held;
  const xpAmount = amountOf(xp, 200_000_000);
  const okReason = (text: string) => text.trim().length >= 3;
  const grant = (sign: 1 | -1) =>
    void run(
      () => api.admin.grant(r.id, itemId!, sign * amount!, reason.trim()),
      (res) => {
        setSaid(
          res.ok
            ? { text: t('record.gave', { count: fmt.int(res.held) }), bad: false }
            : { text: grantRefusal(res.reason), bad: true },
        );
        if (res.ok) reload();
      },
    );
  const giveXp = () =>
    void run(
      () => api.admin.xp(r.id, skillId!, xpAmount!, why.trim()),
      (res) => {
        setSaidXp(
          res.ok
            ? { text: t('record.gaveXp', { skill: skillName, level: fmt.int(res.level) }), bad: false }
            : { text: res.reason === 'repeated' ? t('record.repeated') : t('record.unknownSkill'), bad: true },
        );
        if (res.ok) reload();
      },
    );
  const ready = !!itemId && amount !== null && okReason(reason);
  return (
    <div className={p.pair}>
      <Panel title={t('record.grants')}>
        <form className={p.form} onSubmit={(e) => e.preventDefault()}>
          <p className={p.note}>{t('record.grantLead')}</p>
          <Field
            label={t('record.item')}
            hint={t('record.itemHint')}
            value={item}
            onChange={(e) => setItem(e.target.value)}
            list="console-items"
            maxLength={64}
            autoComplete="off"
          />
          <datalist id="console-items">
            {r.catalog.map((x) => (
              <option key={x.id} value={x.name} />
            ))}
          </datalist>
          {held !== undefined && <p className={p.note}>{t('record.holds', { count: fmt.int(held) })}</p>}
          <Field
            label={t('record.count')}
            value={count}
            onChange={(e) => setCount(e.target.value)}
            inputMode="numeric"
            maxLength={14}
          />
          <Field
            label={t('record.reason')}
            hint={t('record.reasonHint')}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={200}
          />
          <div className={s.actions}>
            <Button variant="primary" disabled={!ready} onClick={() => grant(1)}>
              {t('record.give')}
            </Button>
            <Button disabled={!ready} onClick={() => grant(-1)}>
              {t('record.take')}
            </Button>
          </div>
          {said && (
            <p className={said.bad ? s.error : p.note} role="status">
              {said.text}
            </p>
          )}
        </form>
      </Panel>
      <Panel title={t('record.giveXp')}>
        <form className={p.form} onSubmit={(e) => e.preventDefault()}>
          <Field
            label={t('record.skillField')}
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            list="console-skills"
            maxLength={32}
            autoComplete="off"
          />
          <datalist id="console-skills">
            {r.skills.map((x) => (
              <option key={x.skill} value={x.name} />
            ))}
          </datalist>
          <Field
            label={t('record.xpAmount')}
            value={xp}
            onChange={(e) => setXp(e.target.value)}
            inputMode="numeric"
            maxLength={14}
          />
          <Field
            label={t('record.reason')}
            hint={t('record.reasonHint')}
            value={why}
            onChange={(e) => setWhy(e.target.value)}
            maxLength={200}
          />
          <div className={s.actions}>
            <Button variant="primary" disabled={!skillId || xpAmount === null || !okReason(why)} onClick={giveXp}>
              {t('record.giveXp')}
            </Button>
          </div>
          {saidXp && (
            <p className={saidXp.bad ? s.error : p.note} role="status">
              {saidXp.text}
            </p>
          )}
        </form>
      </Panel>
    </div>
  );
}
