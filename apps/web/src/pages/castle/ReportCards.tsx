// Battle reports as cards (session 42, the owner: easy to take in, good to look at). Each card: the two
// sides' arms with the attacker on the left (a spy's errand shows its mission), the outcome in a word, in
// moss when it went your way and in red when not, what happened in a line, attack against defence on one
// bar, and what it moved with its icons. A card opens the battle's account.
import { t } from '@idle-clash/content';
import { ItemIcon } from '@idle-clash/ui';
import type { CSSProperties } from 'react';
import { navigate } from '../../router.ts';
import { reportSheet, when, type ReportCard } from './report-model.ts';
import s from './reports.module.css';

const SPOIL_ICON = { gold: 'castle-gold', marks: 'castle-marks', lost: 'castle-gold-lost' } as const;
const MISSION_ICON: Record<string, string> = {
  scout: 'spy-scout',
  poison: 'spy-poison',
  sabotage: 'spy-sabotage',
  forge: 'spy-forge',
};

/** The two sides face to face: arms, crossed blades between, arms. */
export function Faceoff({ card, size }: { card: ReportCard; size: 32 | 48 }) {
  const mission = card.mission && Object.hasOwn(MISSION_ICON, card.mission) ? MISSION_ICON[card.mission] : null;
  return (
    <span className={s.faceoff} aria-hidden="true">
      <ItemIcon name="crest" crest={card.left.seed} size={size} />
      {mission ? (
        <ItemIcon name={mission} size={size === 48 ? 32 : 24} />
      ) : (
        <svg className={s.blades} viewBox="0 0 24 24" width={size / 2} height={size / 2} focusable="false">
          <path
            d="M4 4 L20 20 M20 4 L4 20 M2 7 L7 2 M17 2 L22 7"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
          />
        </svg>
      )}
      <ItemIcon name="crest" crest={card.right.seed} size={size} />
    </span>
  );
}

/** Attack (woad, from the left) against defence (ink, from the right), meeting where the battle stood. */
export function ClashBar({ attack, defense }: { attack: number; defense: number }) {
  return (
    <span
      className={s.clash}
      style={{ '--attack': `${(attack / Math.max(1, attack + defense)) * 100}%` } as CSSProperties}
      aria-hidden="true"
    >
      <span className={s.clashAttack} />
    </span>
  );
}

export function Spoils({ card }: { card: ReportCard }) {
  if (!card.spoils.length) return null;
  return (
    <span className={s.spoils}>
      {card.spoils.map((x) => (
        <span key={x.text} className={s.spoil} data-lost={x.icon === 'lost' || undefined}>
          {x.icon && <ItemIcon name={SPOIL_ICON[x.icon]} size={24} />}
          {x.text}
        </span>
      ))}
    </span>
  );
}

export function ReportCardLink({ card, now }: { card: ReportCard; now: number }) {
  const href = reportSheet(card.id);
  return (
    <li>
      <a
        href={href}
        data-ui="RowLink"
        className={s.card}
        onClick={(e) => (e.preventDefault(), navigate(href))}
        aria-label={`${card.word}: ${card.title}`}
      >
        <Faceoff card={card} size={32} />
        <span className={s.cardMain}>
          <span className={s.cardHead}>
            <span className={s.word} data-good={card.good || undefined}>
              {card.word}
            </span>
            {card.rout && <span className={s.rout}>{t('castle.strongholds.routed')}</span>}
            <span className={s.when}>{when(card.at, now)}</span>
          </span>
          <span className={s.title}>{card.title}</span>
          {card.attack !== null && card.defense !== null && <ClashBar attack={card.attack} defense={card.defense} />}
          <Spoils card={card} />
        </span>
      </a>
    </li>
  );
}
