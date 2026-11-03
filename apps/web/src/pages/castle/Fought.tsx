// A battle just fought, on the row it was fought from (session 40): the two sides' arms at either end of
// one bar, your attack pushing in from the left against their defence from the right until they meet
// where the battle stood (session 41); then won or lost in a word and what it brought, and the battle's
// account a tap away. It stays until the next battle is fought.
import { fmt, t } from '@idle-clash/content';
import { castleEngine as E } from '@idle-clash/features';
import { ItemIcon, TextLink } from '@idle-clash/ui';
import type { CSSProperties } from 'react';
import { navigate } from '../../router.ts';
import { outcomeName } from './labels.ts';
import { reportSheet } from './Reports.tsx';
import { useSyncedCastle } from './synced.ts';
import s from './castle.module.css';

const num = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) ? x : 0);

export function Fought({ battle }: { battle: string }) {
  const { battle: last, castle } = useSyncedCastle();
  if (!last || last.key !== battle) return null;
  const r = last.result;
  const won = battle === 'incursion' ? r.won === true : r.outcome !== 'repelled';
  const word =
    battle === 'incursion'
      ? won
        ? t('castle.report.won')
        : t('castle.report.lostIncursion')
      : outcomeName(typeof r.outcome === 'string' ? r.outcome : '');
  const attack = num(r.attack);
  const defense = num(r.defense);
  const brought = [
    ...(num(r.gold) > 0 ? [t('castle.report.gold', { gold: fmt.short(num(r.gold)) })] : []),
    ...(num(r.marks) > 0 ? [t('castle.report.marks', { marks: fmt.int(num(r.marks)) })] : []),
  ];
  return (
    <div className={s.fought} data-slot="castle.fought" data-won={won || undefined} role="status">
      {attack > 0 && defense > 0 && (
        // Your arms, the line where attack met defence, their arms: the clash at a glance.
        <div className={s.clash} aria-hidden="true">
          {castle && <ItemIcon name="crest" crest={castle.userId} size={24} />}
          <div className={s.tug} style={{ '--attack': `${(attack / (attack + defense)) * 100}%` } as CSSProperties}>
            <span className={s.tugAttack} />
            <span className={s.tugDefence} />
          </div>
          <ItemIcon
            name="crest"
            crest={battle !== 'incursion' ? battle : typeof r.fortress === 'string' ? r.fortress : ''}
            size={24}
          />
        </div>
      )}
      <div className={s.foughtHead}>
        <strong>{E.sentence(word)}</strong>
        {brought.length > 0 && <span>{brought.join(', ')}</span>}
        {r.rout === true && <strong className={s.rout}>{t('castle.strongholds.routed')}</strong>}
      </div>
      {last.report !== null && (
        <TextLink href={reportSheet(last.report)} onNavigate={navigate}>
          {t('castle.fought.account')}
        </TextLink>
      )}
    </div>
  );
}
