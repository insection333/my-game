// The Hearth's first section (IA.md, `hearth.today`): on return, the away recap, best thing first,
// then Collect; otherwise today's notable moments as a short timeline; a newcomer's welcome before any.
import { fmt, t } from '@idle-clash/content';
import { recap } from '@idle-clash/features';
import { Button, Panel } from '@idle-clash/ui';
import { useGame } from '../game/hooks.ts';
import { game } from '../game/store.ts';
import { navigate } from '../router.ts';
import { Slot } from '../slots.tsx';
import { LineMark } from './LineMark.tsx';
import { noticesOf } from './notices.ts';
import s from './pages.module.css';

type Line = recap.RecapLine & { at?: number };

function Lines({ lines, time }: { lines: Line[]; time?: boolean }) {
  return (
    <ul className={s.lines}>
      {lines.map((l, i) => {
        const inner = (
          <>
            {time && l.at !== undefined && <span className={s.lineTime}>{fmt.time(l.at)}</span>}
            <LineMark line={l} />
            <span className={s.lineText}>{l.text}</span>
          </>
        );
        return (
          <li key={`${l.kind}-${i}`} data-kind={l.kind}>
            {l.href ? (
              <a
                href={l.href}
                data-ui="RowLink"
                className={s.line}
                onClick={(e) => (e.preventDefault(), navigate(l.href!))}
              >
                {inner}
              </a>
            ) : (
              <span className={s.line}>{inner}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function Today() {
  const view = useGame();
  if (view.away) {
    // The best five good things, then what the castle met (up to three: session 66) and any lane that
    // stopped, which need the player; the rest wait in the notices tray, where the recap goes once
    // collected.
    const all = recap.recapLines(view.away, view.notices);
    const good = recap.goodThings(all);
    const defences = all.filter((l) => l.kind === 'defence');
    const lines = [...good.slice(0, 5), ...defences.slice(0, 3), ...all.filter((l) => l.kind === 'stopped')];
    const more = Math.max(0, good.length - 5) + Math.max(0, defences.length - 3);
    return (
      <Slot id="hearth.today">
        <Panel
          title={t('recap.title')}
          aside={t('recap.away', { time: fmt.duration(view.away.to - view.away.from) })}
          flush
        >
          <div data-recap>
            <Lines lines={lines} />
            <div className={s.collect}>
              {more > 0 && <span className={s.muted}>{t('recap.more', { count: fmt.int(more) })}</span>}
              <Button variant="primary" onClick={() => game.collect()}>
                {t('recap.collect')}
              </Button>
            </div>
          </div>
        </Panel>
      </Slot>
    );
  }
  const midnight = new Date(view.now).setHours(0, 0, 0, 0);
  const today = noticesOf(view).filter((n) => n.at >= midnight && n.kind !== 'stopped');
  if (today.length)
    return (
      <Slot id="hearth.today">
        <Panel title={t('hearth.today.title')} flush>
          <Lines lines={today.slice(0, 5)} time />
        </Panel>
      </Slot>
    );
  return (
    <Slot id="hearth.today">
      <Panel>
        <div className={s.welcome}>
          <h2>{t('hearth.welcome.title')}</h2>
          <p>{t('hearth.welcome.body')}</p>
        </div>
      </Panel>
    </Slot>
  );
}
