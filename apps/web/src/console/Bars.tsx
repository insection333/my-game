// A series as bars (the console's overview, session 228; any series since session 233: the fortnight's
// players by day, the server's last hour by minute): one series, one hue, so its title names it and no
// legend is needed. Bars rise from a baseline with rounded tops and a gap between; the most is said in
// words, each bar names its point and value on hover, and a table holds the same for screen readers.
import { t } from '@idle-clash/content';
import { useId } from 'react';
import s from './pages.module.css';

/** One bar: what it stands for (a day, a minute), its value, and the value as words. */
export interface Point {
  key: string;
  label: string;
  value: number;
  said: string;
}

const W = 280;
const H = 96;
const GAP = 4;

export function Bars({ title, points, heading }: { title: string; points: Point[]; heading: string }) {
  const values = points.map((p) => p.value);
  const most = Math.max(1, ...values);
  const n = Math.max(points.length, 1);
  // The gap a quarter of a bar at most, so an hour's sixty minutes stand as bars, not as gaps.
  const gap = Math.min(GAP, W / n / 4);
  const bar = (W - gap * (n - 1)) / n;
  // Each chart its own gradient: the bar lit at its top and fading to the baseline (session 232).
  const fade = `bars-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`;
  const top = points.reduce<Point | null>((a, p) => (!a || p.value > a.value ? p : a), null);
  return (
    <figure className={s.chart}>
      <figcaption className={s.chartHead}>
        <span className={s.chartTitle}>{title}</span>
        <span className={s.chartMost}>{t('console.chart.most', { count: top?.said ?? '0' })}</span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H + 2}`} className={s.chartSvg} aria-hidden="true" preserveAspectRatio="none">
        <defs>
          <linearGradient id={fade} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="currentColor" stopOpacity="0.85" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0.18" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((q) => (
          <line key={q} x1={0} x2={W} y1={H * q} y2={H * q} className={s.chartGrid} />
        ))}
        {values.map((v, i) => {
          const h = v ? Math.max(3, (v / most) * H) : 0;
          return (
            <g key={points[i].key}>
              <rect x={i * (bar + gap)} y={0} width={bar} height={H} className={s.chartHit}>
                <title>{t('console.chart.day', { day: points[i].label, count: points[i].said })}</title>
              </rect>
              {h > 0 && (
                <>
                  <rect
                    x={i * (bar + gap)}
                    y={H - h}
                    width={bar}
                    height={h}
                    rx={2}
                    className={s.chartBar}
                    style={{ fill: `url(#${fade})` }}
                  />
                  <rect x={i * (bar + gap)} y={H - h} width={bar} height={2} rx={1} className={s.chartTop} />
                </>
              )}
            </g>
          );
        })}
        <line x1={0} x2={W} y1={H + 1} y2={H + 1} className={s.chartBase} />
      </svg>
      <div className={s.chartAxis} aria-hidden="true">
        <span>{points[0]?.label}</span>
        <span>{points.at(-1)?.label}</span>
      </div>
      <table className="visually-hidden">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">{heading}</th>
            <th scope="col">{t('console.chart.countHeading')}</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.key}>
              <td>{p.label}</td>
              <td>{p.said}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
