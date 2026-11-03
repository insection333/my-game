// Hiscores (IA.md): its Ladders tab, with how many are playing now and a ladder for Total, each skill and
// Castles (session 38: castles by rating) with your own entry pinned, each player's title and banner beside their name; the Deeds tab is
// Deeds.tsx. The ladders come from the server; the page asks again each minute while it is open.
import type { HiscoreRow, HiscoresResponse } from '@idle-clash/contracts';
import { fmt, hasString, t } from '@idle-clash/content';
import { kindlingData } from '@idle-clash/features';
import { FireSeal, hasIcon, ItemIcon, Panel, Picture, Pill, Tabs } from '@idle-clash/ui';
import { useEffect, useState, type ReactNode } from 'react';
import { api } from '../api.ts';
import { handled } from '../game/session.ts';
import { untilLoaded } from '../Ready.tsx';
import { navigate, useLocation } from '../router.ts';
import { Slot } from '../slots.tsx';
import { badgeName, bannerStyle } from './honours-style.ts';
import { MenuGlyph } from '../shell/glyphs.tsx';
import { PageHead } from './PageHead.tsx';
import { PlayerSheet, playerSheet } from './HiscoresPlayer.tsx';
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
  const { panel } = useLocation();
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
  const name = (skill: string) =>
    skill === 'total' ? t('hiscores.total') : skill === 'castle' ? t('hiscores.castles') : t(`skill.${skill}`);
  const castles = ladder?.skill === 'castle';
  const you = ladder?.you ?? null;
  const shown = ladder?.rows ?? [];
  // A player not yet listed is in no one's rows, their own included: their place is pinned beneath,
  // where they would stand, as any player's below the top rows is. Nothing on the page says why.
  const listed = data?.listed ?? true;
  const mine = (r: HiscoreRow) => listed && you?.rank === r.rank;
  const pinned = you && !shown.slice(0, PHONE_ROWS).some(mine) ? you : null;
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
            variant="side"
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
              {ladder && ladder.rows.length === 0 && !you && <p className={s.note}>{t('hiscores.empty')}</p>}
              {ladder && (ladder.rows.length > 0 || you) && (
                <table className={s.table}>
                  <caption className="visually-hidden">{name(ladder.skill)}</caption>
                  <thead>
                    <tr>
                      <th scope="col">{t('hiscores.rank')}</th>
                      <th scope="col">{t('hiscores.name')}</th>
                      <th scope="col" data-num>
                        {castles ? t('hiscores.castleLevel') : t('hiscores.level')}
                      </th>
                      <th scope="col" data-num>
                        {castles ? t('hiscores.rating') : t('hiscores.xp')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((r) => (
                      <Row key={r.rank} row={r} you={mine(r)} ladder={ladder.skill} />
                    ))}
                  </tbody>
                  {pinned && (
                    <tbody className={s.pinned}>
                      <Row row={pinned} you ladder={ladder.skill} />
                    </tbody>
                  )}
                </table>
              )}
              {data && !you && <p className={s.note}>{t('hiscores.unranked')}</p>}
            </Slot>
          </Panel>
        </section>
      </div>
      {panel === 'player' && data && <PlayerSheet ladders={data.ladders} name={name} />}
    </>
  );
}

/** A ladder's icon: the skill's seal, Castle Clash's glyph for Castles, or the game's own mark for Total. */
function LadderIcon({ skill }: { skill: string }) {
  if (hasIcon(skill)) return <ItemIcon name={skill} size={24} />;
  if (skill === 'castle') return <MenuGlyph name="castle" />;
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
 *  and on Total the milestones claimed (on Castles, the castle's level and rating). */
function Row({ row, you, ladder }: { row: HiscoreRow; you: boolean; ladder: string }) {
  const total = ladder === 'total';
  const title = row.title && hasString(`honour.title.${row.title}`) ? t(`honour.title.${row.title}`) : null;
  const milestones =
    total && row.milestones > 0
      ? row.milestones === 1
        ? t('hiscores.milestonesOne')
        : t('hiscores.milestones', { count: fmt.int(row.milestones) })
      : null;
  // On a skill's ladder, its Kindlings past 99 (worked out from the XP, as the game does).
  const kindled = total || ladder === 'castle' ? 0 : kindlingData.kindlingsIn(row.xp);
  const kindling = kindled > 0 ? t('hiscores.kindled', { count: fmt.int(kindled) }) : null;
  return (
    <tr data-you={you || undefined} style={bannerStyle(row.banner)}>
      <td className={s.place}>
        <Place rank={row.rank} />
      </td>
      <td>
        <span className={s.player}>
          {row.look && (
            <span className={s.rowPicture}>
              <Picture picture={row.look.picture} frame={row.look.frame} glow={row.look.glow} size={24} />
            </span>
          )}
          {/* The name opens the player's sheet (their places, and Report this player). */}
          <a
            href={playerSheet(row.name)}
            data-ui="RowLink"
            className={s.nameLink}
            aria-current={you || undefined}
            onClick={(e) => (e.preventDefault(), navigate(playerSheet(row.name)))}
          >
            {row.name}
          </a>
        </span>
        {(title || milestones || kindling) && (
          <span className={s.honours}>
            {row.look?.badge && (
              <ItemIcon name={`badge-${row.look.badge}`} size={24} label={badgeName(row.look.badge)} />
            )}
            {title && <span className={s.title}>{title}</span>}
            {milestones && <span className={s.milestones}>{milestones}</span>}
            {kindling && <span className={s.kindled}>{kindling}</span>}
          </span>
        )}
      </td>
      <td data-num>{fmt.int(row.level)}</td>
      <td data-num>{fmt.int(row.xp)}</td>
    </tr>
  );
}
