// Hiscores (IA.md): its Ladders tab, with how many are playing now and a ladder for Total and each
// skill with your own entry pinned, each player's title and banner beside their name; the Deeds tab is
// Deeds.tsx. The ladders come from the server; the page asks again each minute while it is open.
import type { HiscoreRow, HiscoresResponse } from '@idle-clash/contracts';
import { fmt, hasString, t } from '@idle-clash/content';
import { FireSeal, hasIcon, ItemIcon, Panel, Pill, Tabs } from '@idle-clash/ui';
import { useEffect, useState, type ReactNode } from 'react';
import { api } from '../api.ts';
import { handled } from '../game/session.ts';
import { untilLoaded } from '../Ready.tsx';
import { navigate, useLocation } from '../router.ts';
import { Slot } from '../slots.tsx';
import { bannerStyle } from './honours-style.ts';
import { PageHead } from './PageHead.tsx';
import s from './hiscores.module.css';

const PHONE_ROWS = 10;

/** The page's title and its two tabs, Ladders and Deeds. */
export function HiscoresHead({ deeds, children }: { deeds?: boolean; children?: ReactNode }) {
  const tabs = [
    { href: '/hiscores', label: t('deeds.tab.ladders'), current: !deeds },
    { href: '/hiscores/deeds', label: t('deeds.tab.deeds'), current: !!deeds },
  ];
  return (
    <PageHead title={t('hiscores.title')}>
      <div className={s.head}>
        <Tabs tabs={tabs} label={t('hiscores.title')} onNavigate={navigate} />
        {children}
      </div>
    </PageHead>
  );
}

export function Hiscores() {
  const [data, setData] = useState<HiscoresResponse | null>(null);
  useLocation();
  useEffect(() => {
    let live = true;
    const load = (first = false) =>
      (first ? untilLoaded(api.hiscores()) : api.hiscores()).then(
        (r) => live && setData(r),
        (err: unknown) => void handled(err),
      );
    void load(true);
    const every = setInterval(() => void load(), 60_000);
    return () => {
      live = false;
      clearInterval(every);
    };
  }, []);
  const asked = new URLSearchParams(location.search).get('skill') ?? 'total';
  const ladder = data?.ladders.find((l) => l.skill === asked) ?? data?.ladders[0];
  const name = (skill: string) => (skill === 'total' ? t('hiscores.total') : t(`skill.${skill}`));
  const you = ladder?.you ?? null;
  const shown = ladder?.rows ?? [];
  const pinned = you && !shown.slice(0, PHONE_ROWS).some((r) => r.rank === you.rank) ? you : null;
  return (
    <>
      <HiscoresHead>
        <Slot id="hiscores.online" className={s.online}>
          {data && <Pill tone="moss">{t('hiscores.online', { count: fmt.int(data.online) })}</Pill>}
        </Slot>
      </HiscoresHead>
      <div className={s.layout}>
        <div className={s.tabs}>
          <Tabs
            label={t('hiscores.ladders')}
            onNavigate={navigate}
            tabs={(data?.ladders ?? []).map((l) => ({
              href: l.skill === 'total' ? '/hiscores' : `/hiscores?skill=${l.skill}`,
              label: name(l.skill),
              current: l.skill === ladder?.skill,
              icon: <LadderIcon skill={l.skill} />,
            }))}
          />
        </div>
        <section data-section>
          <Panel flush>
            <Slot id="hiscores.ladder" className={s.ladder}>
              {ladder && ladder.rows.length === 0 && <p className={s.note}>{t('hiscores.empty')}</p>}
              {ladder && ladder.rows.length > 0 && (
                <table className={s.table}>
                  <caption className="visually-hidden">{name(ladder.skill)}</caption>
                  <thead>
                    <tr>
                      <th scope="col">{t('hiscores.rank')}</th>
                      <th scope="col">{t('hiscores.name')}</th>
                      <th scope="col" data-num>
                        {t('hiscores.level')}
                      </th>
                      <th scope="col" data-num>
                        {t('hiscores.xp')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((r) => (
                      <Row key={r.rank} row={r} you={you?.rank === r.rank} total={ladder.skill === 'total'} />
                    ))}
                  </tbody>
                  {pinned && (
                    <tbody className={s.pinned}>
                      <Row row={pinned} you total={ladder.skill === 'total'} />
                    </tbody>
                  )}
                </table>
              )}
              {data && !you && <p className={s.note}>{t('hiscores.unranked')}</p>}
            </Slot>
          </Panel>
        </section>
      </div>
    </>
  );
}

/** A ladder's icon: the skill's seal, or the game's own mark for Total. */
function LadderIcon({ skill }: { skill: string }) {
  if (hasIcon(skill)) return <ItemIcon name={skill} size={24} />;
  return (
    <svg width={24} height={24} viewBox="0 0 48 48" aria-hidden="true">
      <FireSeal />
    </svg>
  );
}

/** The first three places wear a medal: gold, silver, bronze. */
function Place({ rank }: { rank: number }) {
  return rank <= 3 ? (
    <span className={s.medal} data-place={rank}>
      {fmt.int(rank)}
    </span>
  ) : (
    <>{fmt.int(rank)}</>
  );
}

/** One place on a ladder: the player's banner down its edge, their name with their title under it,
 *  and on Total the milestones claimed. */
function Row({ row, you, total }: { row: HiscoreRow; you: boolean; total: boolean }) {
  const title = row.title && hasString(`honour.title.${row.title}`) ? t(`honour.title.${row.title}`) : null;
  const milestones =
    total && row.milestones > 0
      ? row.milestones === 1
        ? t('hiscores.milestonesOne')
        : t('hiscores.milestones', { count: fmt.int(row.milestones) })
      : null;
  return (
    <tr data-you={you || undefined} style={bannerStyle(row.banner)}>
      <td className={s.place}>
        <Place rank={row.rank} />
      </td>
      <td>
        <span className={s.player}>{row.name}</span>
        {(title || milestones) && (
          <span className={s.honours}>
            {title && <span className={s.title}>{title}</span>}
            {milestones && <span className={s.milestones}>{milestones}</span>}
          </span>
        )}
      </td>
      <td data-num>{fmt.int(row.level)}</td>
      <td data-num>{fmt.int(row.xp)}</td>
    </tr>
  );
}
