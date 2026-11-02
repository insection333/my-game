// Bad actors (session 39): a player reports another by name, for an offensive name or for cheating and
// abuse, with no words of their own; the admin page holds the reports to settle, and the sieges that move
// gold one way between two lords (an account feeding another).
import { z } from 'zod';
import { PlayerName } from './fields.ts';
import { PATHS } from './paths.ts';
import type { RouteContract } from './routes.ts';

export const REPORT_REASONS = ['name', 'cheating'] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const ReportPlayer = z.object({ name: PlayerName, reason: z.enum(REPORT_REASONS) }).strict();
const PlayerId = z.string().uuid();
export const SettleReports = z.object({ playerId: PlayerId }).strict();

const route = (r: RouteContract) => r;
export const MODERATION_ROUTES = {
  reportPlayer: route({
    id: 'reportPlayer',
    method: 'POST',
    path: PATHS.reportPlayer,
    auth: 'player',
    input: ReportPlayer,
    example: { name: 'Rowan', reason: 'name' },
  }),
  adminReports: route({
    id: 'adminReports',
    method: 'POST',
    path: PATHS.adminReports,
    auth: 'admin',
    input: null,
    example: null,
  }),
  adminSettleReports: route({
    id: 'adminSettleReports',
    method: 'POST',
    path: PATHS.adminSettleReports,
    auth: 'admin',
    input: SettleReports,
    example: { playerId: '00000000-0000-4000-8000-000000000000' },
  }),
  adminSiegeFlows: route({
    id: 'adminSiegeFlows',
    method: 'POST',
    path: PATHS.adminSiegeFlows,
    auth: 'admin',
    input: null,
    example: null,
  }),
} satisfies Record<string, RouteContract>;

/** A player with open reports, as the admin's queue shows them. */
export interface ReportedView {
  playerId: string;
  name: string;
  bannedAt: number | null;
  /** Open reports by reason, and how many came from players already listed (played a while). */
  reasons: Record<ReportReason, number>;
  reporters: number;
  listedReporters: number;
  first: number;
  last: number;
}
export interface AdminReportsResponse {
  reported: ReportedView[];
}

/** Sieges from one lord on another over the last 30 days. */
export interface SiegeFlowView {
  attacker: { id: string; name: string };
  defender: { id: string; name: string };
  sieges: number;
  breaches: number;
  /** Gold the attacker took in all. */
  gold: number;
  /** Sieges the other way in the same days. */
  back: number;
}
export interface AdminSiegeFlowsResponse {
  flows: SiegeFlowView[];
}
