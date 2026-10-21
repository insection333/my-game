// The Hearth's first section (IA.md, `hearth.today`): on return, the away recap, best thing first,
// then Collect; otherwise today's notable moments as a short timeline; a newcomer's welcome before any.
import { fmt, t } from '@idle-clash/content';
import { recap } from '@idle-clash/features';
import { Button, ItemIcon, Panel } from '@idle-clash/ui';
import { useGame } from '../game/hooks.ts';
import { game } from '../game/store.ts';
import { navigate } from '../router.ts';
import { Slot } from '../slots.tsx';
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
            {l.icon ? <ItemIcon name={l.icon} size={24} /> : <span className={s.lineDot} aria-hidden="true" />}
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
    // The best five good things, then any lane that stopped (it needs the player); the rest wait in the
    // notices tray, where the recap goes once collected.
    const all = recap.recapLines(view.away);
    const good = recap.goodThings(all);
    const lines = [...good.slice(0, 5), ...all.filter((l) => l.kind === 'stopped')];
    const more = good.length - 5;
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
