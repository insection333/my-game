// The steading on the Hearth (session 25): the six works as tiles, each with how far it is raised and
// what it gives, a work ready to raise marked; and a work's sheet (`?panel=work&work=woodyard`) with
// its next raising, what it costs against what is held, and the button that raises it.
import { t } from '@idle-clash/content';
import type { SteadingView, WorkRow } from '@idle-clash/features';
import { Button, Panel, Pill, ProgressBar, Sheet } from '@idle-clash/ui';
import { useGame } from '../game/hooks.ts';
import { game } from '../game/store.ts';
import { navigate } from '../router.ts';
import { fills, Slot } from '../slots.tsx';
import s from './steading.module.css';

const sheetOf = (id: string) => `${location.pathname}?panel=work&work=${id}`;

export function Steading({ view }: { view: SteadingView }) {
  return (
    <Panel title={t('steading.title')} flush>
      <Slot id="hearth.steading" className={s.works}>
        {view.rows.map((row) => (
          <a
            key={row.id}
            href={sheetOf(row.id)}
            data-ui="RowLink"
            data-variant={row.ready ? 'ready' : undefined}
            className={s.work}
            onClick={(e) => (e.preventDefault(), navigate(sheetOf(row.id)))}
          >
            <span className={s.head}>
              <span className={s.name}>{row.name}</span>
              {row.short && <span className={s.short}>{row.short}</span>}
            </span>
            <ProgressBar value={row.stage / row.stages} segments={row.stages} label={row.standing} decorative />
            <span className={s.below}>
              {row.ready ? t('steading.ready') : row.next ? row.standing : t('steading.top')}
            </span>
          </a>
        ))}
      </Slot>
    </Panel>
  );
}

export function WorkSheet({ onClose }: { onClose: () => void }) {
  const { state, now, features } = useGame();
  const [view] = fills<SteadingView>(features, 'hearth.work', state, now);
  const id = new URLSearchParams(location.search).get('work') ?? '';
  const row = view?.data.rows.find((r) => r.id === id);
  return (
    <Sheet title={row?.name ?? t('steading.title')} closeLabel={t('shell.close')} onClose={onClose} slot="hearth.work">
      {row && <Work row={row} />}
    </Sheet>
  );
}

function Work({ row }: { row: WorkRow }) {
  const next = row.next;
  return (
    <div className={s.sheet}>
      <Pill tone={next ? (row.stage ? 'woad' : undefined) : 'moss'}>{next ? row.standing : t('steading.top')}</Pill>
      <ProgressBar value={row.stage / row.stages} segments={row.stages} label={row.standing} />
      {row.stage > 0 && <p className={s.now}>{t('steading.now', { gives: row.gives })}</p>}
      {next && (
        <>
          <p className={s.now}>{t('steading.next', { gives: next.gives })}</p>
          <ul className={s.costs}>
            {next.cost.map((c) => (
              <li key={c.label} className={s.cost} data-short={c.enough ? undefined : true}>
                <span>{c.label}</span>
                <span className={s.held}>{c.held}</span>
              </li>
            ))}
          </ul>
          <Button
            variant={next.affordable ? 'primary' : 'secondary'}
            disabled={!next.affordable}
            onClick={() => game.act('steading', 'raise', { work: row.id })}
          >
            {row.stage ? t('steading.raise') : t('steading.build')}
          </Button>
        </>
      )}
    </div>
  );
}
