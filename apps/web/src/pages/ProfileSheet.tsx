// A player's profile card (`?panel=player&name=…`, session 44), over any page: opened from their name on
// the ladders and in Castle Clash. The scene they show with their picture in its frame and glow over its
// foot; their name, badge and title, and how long they have played; their career at a glance; their
// castle and its war record, wins against losses on one bar each; and for someone else, Send a message
// (session 45) and Report this player.
import type { Profile } from '@idle-clash/contracts';
import { fmt, hasString, t } from '@idle-clash/content';
import { Button, CastleScene, ItemIcon, MarchScene, Picture, Sheet, TextLink, type CastleLook } from '@idle-clash/ui';
import { useEffect, useState, type CSSProperties } from 'react';
import { api } from '../api.ts';
import { navigate, trayHref } from '../router.ts';
import { badgeName, bannerStyle } from './honours-style.ts';
import { ReportPlayer } from './ReportPlayer.tsx';
import s from './profile.module.css';

/** The address of a player's card, over the page shown. */
export function profileHref(name: string): string {
  const url = new URL(location.href);
  url.searchParams.set('panel', 'player');
  url.searchParams.set('name', name);
  return url.pathname + url.search;
}

/** Another lord's castle, drawn from its level alone (all of it others may know). */
const castleLook = (level: number): CastleLook => ({
  walls: level,
  keep: level,
  towers: level,
  banner: null,
  integrity: 100,
  besieged: false,
});

/** Wins against losses: the count of each, and a bar of moss against red. */
function Record({ label, won, lost }: { label: string; won: number; lost: number }) {
  const all = won + lost;
  return (
    <div className={s.record}>
      <span className={s.recordName}>{label}</span>
      <span className={s.recordCounts}>{t('profile.wonLost', { won: fmt.int(won), lost: fmt.int(lost) })}</span>
      <span
        className={s.recordBar}
        data-none={all ? undefined : ''}
        style={{ '--won': all ? `${(won / all) * 100}%` : '0%' } as CSSProperties}
        aria-hidden="true"
      >
        <span />
      </span>
    </div>
  );
}

/** One figure; the career's later figures (titles, Kindlings, foes, bosses, expeditions) show once above
 *  nought, so a newcomer's card is not a wall of zeros. */
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className={s.stat}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function Card({ p }: { p: Profile }) {
  const c = p.career;
  const title = p.title && hasString(`honour.title.${p.title}`) ? t(`honour.title.${p.title}`) : null;
  return (
    <div className={s.card} style={bannerStyle(p.banner)}>
      <div className={s.head}>
        {p.look.scene === 'castle' && p.castle ? (
          <CastleScene className={s.scene} look={castleLook(p.castle.level)} />
        ) : (
          <MarchScene className={s.scene} keep="middle" night={p.look.scene === 'night'} />
        )}
        <span className={s.picture}>
          <Picture picture={p.look.picture} frame={p.look.frame} glow={p.look.glow} size={96} />
        </span>
      </div>
      <div className={s.who}>
        <p className={s.name}>
          {p.name}
          {p.look.badge && <ItemIcon name={`badge-${p.look.badge}`} size={24} label={badgeName(p.look.badge)} />}
        </p>
        <p className={s.titleLine} data-none={title ? undefined : ''}>
          {title ?? t('profile.noTitle')}
        </p>
        <p className={s.since}>
          {p.since === 0 ? t('profile.sinceToday') : t('profile.since', { days: fmt.int(p.since) })}
        </p>
        {!p.you && (
          <p className={s.message}>
            <Button variant="secondary" onClick={() => navigate(trayHref('mail', p.name))}>
              {t('profile.message')}
            </Button>
          </p>
        )}
      </div>
      <section className={s.section} aria-label={t('profile.career')}>
        <h3>{t('profile.career')}</h3>
        <dl className={s.stats}>
          <Stat label={t('profile.totalLevel')} value={fmt.int(c.totalLevel)} />
          <Stat label={t('profile.deedPoints')} value={fmt.int(c.deedPoints)} />
          <Stat
            label={t('profile.deeds')}
            value={t('profile.of', { n: fmt.int(c.deedsDone), all: fmt.int(c.deedsAll) })}
          />
          {c.titles > 0 && <Stat label={t('profile.titles')} value={fmt.int(c.titles)} />}
          {c.kindlings > 0 && <Stat label={t('profile.kindlings')} value={fmt.int(c.kindlings)} />}
          {c.defeats > 0 && <Stat label={t('profile.defeats')} value={fmt.int(c.defeats)} />}
          {c.bossWins > 0 && <Stat label={t('profile.bossWins')} value={fmt.int(c.bossWins)} />}
          {c.runs > 0 && <Stat label={t('profile.runs')} value={fmt.int(c.runs)} />}
        </dl>
      </section>
      {p.castle && (
        <section className={s.section} aria-label={t('profile.castle')}>
          <h3>{t('profile.castle')}</h3>
          <dl className={s.stats}>
            <Stat label={t('profile.castleLevel')} value={fmt.int(p.castle.level)} />
            <Stat label={t('profile.rating')} value={fmt.int(p.castle.rating)} />
            <Stat label={t('profile.fortresses')} value={fmt.int(p.castle.fortresses)} />
            <Stat label={t('profile.routs')} value={fmt.int(p.castle.routs)} />
          </dl>
          <div className={s.records}>
            <Record label={t('profile.sieges')} won={p.castle.siegesWon} lost={p.castle.siegesLost} />
            <Record label={t('profile.defences')} won={p.castle.defencesHeld} lost={p.castle.defencesLost} />
            <Record label={t('profile.strongholds')} won={p.castle.strongholdsTaken} lost={p.castle.strongholdsHeld} />
            <Record label={t('profile.spies')} won={p.castle.spiesDone} lost={p.castle.spiesCaught} />
          </div>
          <p className={s.note}>{t('profile.spiesStopped', { count: fmt.int(p.castle.spiesStopped) })}</p>
        </section>
      )}
      {!p.you && <ReportPlayer name={p.name} />}
    </div>
  );
}

export function ProfileSheet({ onClose }: { onClose: () => void }) {
  const name = new URLSearchParams(location.search).get('name') ?? '';
  const [card, setCard] = useState<{ name: string; p: Profile | null } | null>(null);
  useEffect(() => {
    let live = true;
    if (name)
      api.profile(name).then(
        (p) => live && setCard({ name, p }),
        () => live && setCard({ name, p: null }),
      );
    return () => {
      live = false;
    };
  }, [name]);
  const p = card && card.name === name ? card.p : undefined;
  return (
    <Sheet title={p?.name ?? name} closeLabel={t('shell.close')} onClose={onClose} slot="player.profile">
      {p === undefined ? (
        <p className={`${s.card} ${s.note}`}>{t('profile.reading')}</p>
      ) : p === null ? (
        <p className={`${s.card} ${s.note}`}>{t('profile.none')}</p>
      ) : (
        <Card p={p} />
      )}
    </Sheet>
  );
}

/** A name that opens its player's card. */
export const NameLink = ({ name }: { name: string }) => (
  <TextLink href={profileHref(name)} onNavigate={navigate}>
    {name}
  </TextLink>
);
