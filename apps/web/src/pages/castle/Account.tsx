// A battle's account (`?panel=report&report=<id>`; session 38, drawn as a report in session 42): the two
// sides face to face over the outcome; then the battle: each side's strength meeting on one bar, the
// day's fortune, where attack over defence stood against the breach and the decisive line, the formation
// that went in; a spy's findings; then what came of it, with its icons. A lord's report offers the next
// siege.
import { SIEGE, UNIT_IDS, fmt, t } from '@idle-clash/content';
import { Button, Pill, Sheet } from '@idle-clash/ui';
import type { CSSProperties } from 'react';
import { navigate, withPanel } from '../../router.ts';
import { outcomeName, unitName } from './labels.ts';
import { cardOf, when } from './report-model.ts';
import { ClashBar, Faceoff, Spoils } from './ReportCards.tsx';
import { readReport } from './Reports.tsx';
import { useSyncedCastle } from './synced.ts';
import s from './castle.module.css';
import r from './reports.module.css';

const num = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) ? x : null);
const shares = (x: unknown): number[] | null =>
  Array.isArray(x) && x.length === 3 && x.every((v) => typeof v === 'number') ? x : null;
const signed = (f: number) => `${f >= 0 ? '+' : '−'}${fmt.pct(Math.round(Math.abs(f) * 100))}`;
/** The ratio's scale runs from nothing to twice the defence. */
const SCALE = 2;
const at = (x: number) => `${(Math.min(SCALE, Math.max(0, x)) / SCALE) * 100}%`;

/** Where attack over defence stood: the breach and the decisive line marked on the scale. */
function RatioScale({ ratio }: { ratio: number }) {
  return (
    <div>
      <div
        className={r.scale}
        style={{ '--graze': at(SIEGE.GRAZE_FROM), '--decisive': at(SIEGE.DECISIVE_FROM) } as CSSProperties}
        aria-hidden="true"
      >
        <span className={r.scaleTrack} />
        <span className={r.scaleMark} style={{ left: at(SIEGE.GRAZE_FROM) }} />
        <span className={r.scaleMark} style={{ left: at(SIEGE.DECISIVE_FROM) }} />
        <span className={r.scaleNeedle} style={{ left: at(ratio) }} />
      </div>
      {/* What each stretch of the scale means: under the breach it is repelled, then breached, then stormed. */}
      <div className={r.scaleWords} aria-hidden="true">
        <span style={{ left: at(SIEGE.GRAZE_FROM / 2) }}>{outcomeName('repelled')}</span>
        <span style={{ left: at((SIEGE.GRAZE_FROM + SIEGE.DECISIVE_FROM) / 2) }}>{outcomeName('graze')}</span>
        <span style={{ left: at((SIEGE.DECISIVE_FROM + SCALE) / 2) }}>{outcomeName('decisive')}</span>
      </div>
      <p className={s.muted}>
        {t('castle.account.ratio', {
          r: ratio.toFixed(2),
          breach: SIEGE.GRAZE_FROM.toFixed(2),
          decisive: SIEGE.DECISIVE_FROM.toFixed(2),
        })}
      </p>
    </div>
  );
}

function Formation({ shares: f, defending }: { shares: number[]; defending: boolean }) {
  return (
    <div className={r.formationBox}>
      <p className={s.muted}>{t(defending ? 'castle.account.theyCame' : 'castle.account.youCame')}</p>
      <div className={r.formation} aria-hidden="true">
        {f.map((x, i) => (
          <span key={i} style={{ width: `${x}%` }} />
        ))}
      </div>
      <p className={r.formationKey}>
        {UNIT_IDS.map((u, i) => (
          <span key={u}>{t('castle.account.share', { unit: unitName(u), pct: fmt.pct(f[i]) })}</span>
        ))}
      </p>
    </div>
  );
}

export function ReportSheet() {
  const { view, castle, now, targets } = useSyncedCastle();
  const id = Number(new URLSearchParams(location.search).get('report'));
  const report = view?.logs.find((l) => l.id === id);
  const card = report && castle ? cardOf(report, castle.userId) : null;
  if (!report || !card) return null;
  const close = () => navigate(withPanel(null).replace(/[?&]report=[^&]*/, ''));
  const d = report.data;
  const defending = report.kind === 'siegeIn';
  const fortune = num(d.fortune);
  const ratio = num(d.r);
  const fee = num(d.fee);
  const walls = num(d.walls);
  const formation = shares(d.formation);
  const foe = typeof d.foe === 'string' ? targets?.lords.find((l) => l.id === d.foe) : undefined;
  const sheetOf = (target: string) => `/castle?panel=target&target=${encodeURIComponent(target)}`;
  // A spy's findings (a scouting's garrison) are in the report's facts.
  const findings = card.kind === 'spy' ? readReport(report).facts.filter((f) => f !== card.word) : [];
  return (
    <Sheet title={card.title} closeLabel={t('shell.close')} onClose={close} slot="castle.account">
      <div className={s.sheet}>
        <div className={r.banner}>
          <Faceoff card={card} size={48} />
          <span className={r.word} data-good={card.good || undefined}>
            {card.word}
          </span>
          <span className={r.names}>
            <span>{card.left.name}</span>
            <span>{t('arena.versus')}</span>
            <span>{card.right.name}</span>
          </span>
          <span className={s.pills}>
            {card.rout && <Pill tone="gold">{t('castle.strongholds.routed')}</Pill>}
            <Pill>{when(report.at, now)}</Pill>
          </span>
        </div>
        {card.kind === 'battle' &&
          (card.attack !== null && card.defense !== null ? (
            <div className={s.sheetSection}>
              <h3>{t('castle.account.title')}</h3>
              <div className={r.strengths}>
                <span>{t('castle.account.attack', { n: fmt.int(card.attack) })}</span>
                <ClashBar attack={card.attack} defense={card.defense} />
                <span>{t('castle.account.defence', { n: fmt.int(card.defense) })}</span>
              </div>
              {fortune !== null && <p>{t('castle.account.fortune', { pct: signed(fortune) })}</p>}
              {ratio !== null && <RatioScale ratio={ratio} />}
              {formation && <Formation shares={formation} defending={defending} />}
            </div>
          ) : (
            <p className={s.muted}>{t('castle.account.none')}</p>
          ))}
        {findings.length > 0 && (
          <div className={s.sheetSection}>
            <h3>{t('castle.account.found')}</h3>
            {findings.map((f) => (
              <p key={f}>{f}</p>
            ))}
          </div>
        )}
        <div className={s.sheetSection}>
          <h3>{t('castle.account.moved')}</h3>
          {card.spoils.length ? <Spoils card={card} /> : <p>{t('castle.account.nothing')}</p>}
          {fee !== null && <p className={s.muted}>{t('castle.account.fee', { gold: fmt.short(fee) })}</p>}
          {defending && walls !== null && (
            <p className={s.muted}>{t('castle.account.walls', { pct: fmt.pct(Math.floor(walls)) })}</p>
          )}
        </div>
        {foe && (
          <div className={s.save}>
            <Button variant="primary" onClick={() => navigate(sheetOf(foe.id))}>
              {defending ? t('castle.target.strikeBack') : t('castle.account.again')}
            </Button>
          </div>
        )}
      </div>
    </Sheet>
  );
}
