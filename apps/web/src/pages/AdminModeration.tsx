// Bad actors on the admin page (session 39), under the player search: the players reported, those reported
// by players who have played a while first, each with Open (to rename or ban them, which settles their
// reports) and Dismiss; and sieges between lords summed by pair over 30 days, most gold first, so gold
// flowing one way between two accounts shows. Each list scrolls in its own box.
import type { AdminReportsResponse, AdminSiegeFlowsResponse } from '@idle-clash/contracts';
import { fmt, t } from '@idle-clash/content';
import { ActionRow, Button, Panel, Pill } from '@idle-clash/ui';
import { useEffect, useState } from 'react';
import { api } from '../api.ts';
import { handled } from '../game/session.ts';
import { Slot } from '../slots.tsx';
import s from './admin.module.css';

/** `open`: opens a player in the panel beside; `version` changes when an action there may settle reports. */
export function AdminModeration({ open, version }: { open: (id: string) => void; version: number }) {
  const [reports, setReports] = useState<AdminReportsResponse | null>(null);
  const [flows, setFlows] = useState<AdminSiegeFlowsResponse | null>(null);
  const load = () => {
    api.admin.reports().then(setReports, (err: unknown) => void handled(err));
    api.admin.siegeFlows().then(setFlows, (err: unknown) => void handled(err));
  };
  useEffect(load, [version]);
  const dismiss = (id: string) => api.admin.settleReports(id).then(load, (err: unknown) => void handled(err));
  return (
    <Slot id="admin.moderation" className={s.test}>
      <Panel
        title={t('admin.reports')}
        aside={
          reports && reports.reported.length > 0 ? (
            <Pill tone="ember">{fmt.int(reports.reported.length)}</Pill>
          ) : undefined
        }
        flush
      >
        {reports && reports.reported.length === 0 ? (
          <p className={s.note}>{t('admin.reports.none')}</p>
        ) : (
          <div className={s.testers} data-scrollbox tabIndex={0} aria-label={t('admin.reports')}>
            {reports?.reported.map((r) => (
              <ActionRow
                key={r.playerId}
                name={r.name}
                status={r.bannedAt ? <Pill tone="ember">{t('admin.banned')}</Pill> : undefined}
                facts={[
                  ...(r.reasons.name ? [t('admin.reports.forName', { count: fmt.int(r.reasons.name) })] : []),
                  ...(r.reasons.cheating
                    ? [t('admin.reports.forCheating', { count: fmt.int(r.reasons.cheating) })]
                    : []),
                  t('admin.reports.by', { count: fmt.int(r.reporters), listed: fmt.int(r.listedReporters) }),
                  t('admin.reports.when', { date: fmt.date(r.last) }),
                ]}
                actions={
                  <>
                    <Button variant="quiet" onClick={() => void dismiss(r.playerId)}>
                      {t('admin.reports.dismiss')}
                    </Button>
                    <Button onClick={() => open(r.playerId)}>{t('admin.open')}</Button>
                  </>
                }
              />
            ))}
          </div>
        )}
      </Panel>
      <Panel title={t('admin.flows')} flush>
        <p className={s.note}>{t('admin.flows.lead')}</p>
        {flows && flows.flows.length === 0 ? (
          <p className={s.note}>{t('admin.flows.none')}</p>
        ) : (
          <div className={s.testers} data-scrollbox tabIndex={0} aria-label={t('admin.flows')}>
            {flows?.flows.map((f) => (
              <ActionRow
                key={`${f.attacker.id}>${f.defender.id}`}
                name={t('admin.flows.pair', { attacker: f.attacker.name, defender: f.defender.name })}
                facts={[
                  t('admin.flows.facts', {
                    sieges: fmt.int(f.sieges),
                    breaches: fmt.int(f.breaches),
                    gold: fmt.short(f.gold),
                    back: fmt.int(f.back),
                  }),
                ]}
                actions={<Button onClick={() => open(f.attacker.id)}>{t('admin.open')}</Button>}
              />
            ))}
          </div>
        )}
      </Panel>
    </Slot>
  );
}
