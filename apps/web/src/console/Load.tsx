// The server's load on the console's System (session 233): the last full minute as figures (the processor,
// requests a minute, the time 95 answers in 100 took, the event loop's longest waits, the console's own
// share of the answering, the pages open, memory in use), and the last hour a minute at a time as bars.
import type { PulseMinute, SystemResponse } from '@idle-clash/contracts';
import { fmt, t } from '@idle-clash/content';
import { Panel } from '@idle-clash/ui';
import { whenOf } from '../pages/days.ts';
import { Bars, type Point } from './Bars.tsx';
import { Tiles } from './Tiles.tsx';
import s from './pages.module.css';

const minutes = (hour: PulseMinute[], at: number, value: (m: PulseMinute) => number, said: (n: number) => string) =>
  hour.map((m): Point => ({ key: String(m.at), label: whenOf(m.at, at), value: value(m), said: said(value(m)) }));

export function Load({ sys }: { sys: SystemResponse }) {
  const { hour, pagesOpen, heapMb } = sys.pulse;
  const last = hour.at(-1);
  const pct = (n: number) => t('console.load.cpuOf', { pct: fmt.num(n) });
  const ms = (n: number) => t('console.load.ms', { ms: fmt.num(n) });
  return (
    <Panel title={t('console.load')}>
      <div className={s.stack}>
        <p className={s.note}>{t('console.load.lead')}</p>
        <Tiles
          tiles={[
            { label: t('console.load.cpu'), value: last ? pct(last.cpuPct) : '–' },
            { label: t('console.load.requests'), value: last ? fmt.int(last.requests) : '–' },
            { label: t('console.load.p95'), value: last ? ms(last.p95Ms) : '–' },
            { label: t('console.load.loop'), value: last ? ms(last.loopP99Ms) : '–' },
            {
              label: t('console.load.console'),
              value: last ? `${fmt.num(last.consolePct)}%` : '–',
              note: t('console.load.consoleNote'),
            },
            { label: t('console.load.pages'), value: fmt.int(pagesOpen) },
            { label: t('console.load.heap'), value: t('console.server.mb', { mb: fmt.int(heapMb) }) },
          ]}
        />
        {hour.length ? (
          <div className={s.charts}>
            <Bars
              title={t('console.load.hourRequests')}
              heading={t('console.chart.minuteHeading')}
              points={minutes(hour, sys.at, (m) => m.requests, fmt.int)}
            />
            <Bars
              title={t('console.load.hourCpu')}
              heading={t('console.chart.minuteHeading')}
              points={minutes(hour, sys.at, (m) => m.cpuPct, pct)}
            />
          </div>
        ) : (
          <p className={s.note}>{t('console.load.none')}</p>
        )}
      </div>
    </Panel>
  );
}
