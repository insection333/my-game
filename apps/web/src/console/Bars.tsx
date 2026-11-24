// A fortnight's counts as bars (the console's overview, session 228): one series, one hue, so its title
// names it and no legend is needed. Bars rise from a baseline with rounded tops and a gap between; the
// most is said in words, each bar names its day and count on hover, and a table holds the same for screen
// readers. Drawn in the page's own colours, so it reads in either theme.
import type { DayCount } from '@idle-clash/contracts';
import { fmt, t } from '@idle-clash/content';
import { dayOf } from '../pages/days.ts';
import s from './pages.module.css';

const W = 280;
const H = 96;
const GAP = 4;

export function Bars({ title, days, of }: { title: string; days: DayCount[]; of: 'signUps' | 'active' }) {
  const values = days.map((d) => d[of]);
  const most = Math.max(1, ...values);
  const bar = (W - GAP * (days.length - 1)) / days.length;
  const said = days.map((d) => ({ day: dayOf(Date.parse(`${d.day}T12:00:00Z`)), count: d[of] }));
  return (
    <figure className={s.chart}>
      <figcaption className={s.chartHead}>
        <span className={s.chartTitle}>{title}</span>
        <span className={s.chartMost}>{t('console.chart.most', { count: fmt.int(Math.max(...values, 0)) })}</span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H + 2}`} className={s.chartSvg} aria-hidden="true" preserveAspectRatio="none">
        {values.map((v, i) => {
          const h = v ? Math.max(3, (v / most) * H) : 0;
          return (
            <g key={days[i].day}>
              <rect x={i * (bar + GAP)} y={0} width={bar} height={H} className={s.chartHit}>
                <title>{t('console.chart.day', { day: said[i].day, count: fmt.int(v) })}</title>
              </rect>
              {h > 0 && <rect x={i * (bar + GAP)} y={H - h} width={bar} height={h} rx={2} className={s.chartBar} />}
            </g>
          );
        })}
        <line x1={0} x2={W} y1={H + 1} y2={H + 1} className={s.chartBase} />
      </svg>
      <div className={s.chartAxis} aria-hidden="true">
        <span>{said[0]?.day}</span>
        <span>{said.at(-1)?.day}</span>
      </div>
      <table className="visually-hidden">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">{t('console.chart.dayHeading')}</th>
            <th scope="col">{t('console.chart.countHeading')}</th>
          </tr>
        </thead>
        <tbody>
          {said.map((d) => (
            <tr key={d.day}>
              <td>{d.day}</td>
              <td>{fmt.int(d.count)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
