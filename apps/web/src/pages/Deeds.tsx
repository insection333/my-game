// The Deeds tab of Hiscores (IA.md): your honours (points, deeds by tier, the next title, what you
// show), then the deeds by category: the nearest to done and the last done, or each family as rows of
// medallions. A medallion opens its deed's sheet; "Choose honours" opens the choice of title, banner
// and frame.
import { t } from '@idle-clash/content';
import type { DeedFamily, DeedStep, DeedsView, HonoursView } from '@idle-clash/features';
import { ActionRow, Button, hasIcon, ItemIcon, Medal, Panel, Pill, ProgressBar, Tabs } from '@idle-clash/ui';
import { useGame } from '../game/hooks.ts';
import { navigate, useLocation, withPanel } from '../router.ts';
import { fills, Slot } from '../slots.tsx';
import { HiscoresHead } from './Hiscores.tsx';
import { honourStyle } from './honours-style.ts';
import s from './deeds.module.css';

export const DEEDS_PATH = '/hiscores/deeds';

/** A deed's medallion, opening its sheet. */
export function DeedMedal({ step }: { step: DeedStep }) {
  const state = step.done ?? step.count ?? '';
  const label = [step.name, step.text, step.worth, state].filter(Boolean).join('. ');
  const open = () => {
    const url = new URL(location.href);
    url.searchParams.set('panel', 'deed');
    url.searchParams.set('deed', step.id);
    navigate(url.pathname + url.search);
  };
  return (
    <Medal
      tier={step.tier}
      done={step.done !== null}
      progress={step.progress}
      label={label}
      onClick={open}
      mark={step.icon && hasIcon(step.icon) ? <ItemIcon name={step.icon} size={24} /> : step.mark}
    />
  );
}

export function Deeds() {
  const { state, now, features } = useGame();
  useLocation();
  const [honours] = fills<HonoursView>(features, 'hiscores.honours', state, now);
  const [deeds] = fills<DeedsView>(features, 'hiscores.deeds', state, now);
  const asked = new URLSearchParams(location.search).get('view') ?? 'next';
  const category = deeds?.data.categories.find((c) => c.id === asked) ?? null;
  const tabs = [
    { href: DEEDS_PATH, label: t('deeds.category.next'), short: t('deeds.category.next.short'), current: !category },
    ...(deeds?.data.categories ?? []).map((c) => ({
      href: `${DEEDS_PATH}?view=${c.id}`,
      label: c.name,
      short: c.short,
      current: c.id === category?.id,
    })),
  ];
  return (
    <>
      <HiscoresHead deeds />
      <div className={s.layout}>
        {honours && (
          <section data-section>
            <Honours view={honours.data} />
          </section>
        )}
        {deeds && (
          <section data-section className={s.list}>
            <Tabs tabs={tabs} label={t('deeds.title')} onNavigate={navigate} />
            <Slot id="hiscores.deeds" className={s.stack}>
              {category ? (
                category.families.map((f) => <Family key={f.id} family={f} />)
              ) : (
                <Next nearest={deeds.data.nearest} recent={deeds.data.recent} />
              )}
            </Slot>
          </section>
        )}
      </div>
    </>
  );
}

/** Your honours: points, deeds done by tier, the next title, and what you show. */
function Honours({ view }: { view: HonoursView }) {
  return (
    <Panel title={t('deeds.honours')} aside={view.done}>
      <Slot id="hiscores.honours" className={s.honours}>
        <div
          className={s.plaque}
          data-frame={view.shown.frame ? true : undefined}
          style={honourStyle(view.shown.banner, view.shown.frame)}
        >
          <span className={s.points}>{view.points}</span>
          <span className={s.shown}>{view.shown.title ?? t('deeds.noTitle')}</span>
        </div>
        <ul className={s.tiers}>
          {view.tiers.map((tier) => (
            <li key={tier.tier} data-tier={tier.tier}>
              <span className={s.tierName}>{tier.name}</span>
              <span className={s.tierCount}>{tier.count}</span>
            </li>
          ))}
        </ul>
        {view.next && (
          <div className={s.next}>
            <span>{view.next.text}</span>
            <ProgressBar value={view.next.progress} label={view.next.text} tone="woad" decorative />
          </div>
        )}
        <div>
          <Button onClick={() => navigate(withPanel('honours'))}>{t('deeds.choose')}</Button>
        </div>
      </Slot>
    </Panel>
  );
}

/** One family: a row of medallions for each skill or foe (or one row), under what the family counts. */
function Family({ family }: { family: DeedFamily }) {
  return (
    <Panel title={family.name} aside={family.done}>
      <p className={s.about}>{family.about}</p>
      <div className={s.rows}>
        {family.rows.map((row) => (
          <div key={row.id} className={s.row} data-labelled={row.label ? true : undefined}>
            {row.label && (
              <span className={s.rowHead}>
                {row.icon && hasIcon(row.icon) && <ItemIcon name={row.icon} size={24} />}
                <span>{row.label}</span>
              </span>
            )}
            <span className={s.medals}>
              {row.steps.map((step) => (
                <DeedMedal key={step.id} step={step} />
              ))}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/** The deeds nearest to done, and those done last. */
function Next({ nearest, recent }: { nearest: DeedStep[]; recent: DeedStep[] }) {
  if (!nearest.length && !recent.length) return <p className={s.empty}>{t('deeds.noneYet')}</p>;
  return (
    <div className={s.pair}>
      {nearest.length > 0 && (
        <Panel title={t('deeds.nearest')} flush>
          {nearest.map((step) => (
            <DeedLine key={step.id} step={step} />
          ))}
        </Panel>
      )}
      {recent.length > 0 && (
        <Panel title={t('deeds.recent')} flush>
          {recent.map((step) => (
            <DeedLine key={step.id} step={step} />
          ))}
        </Panel>
      )}
    </div>
  );
}

function DeedLine({ step }: { step: DeedStep }) {
  return (
    <ActionRow
      icon={<DeedMedal step={step} />}
      name={step.name}
      facts={[step.text]}
      status={step.done ? <Pill tone="moss">{step.done}</Pill> : step.count ? <Pill>{step.count}</Pill> : undefined}
      progress={!step.done && <ProgressBar value={step.progress} label={step.name} />}
    />
  );
}
