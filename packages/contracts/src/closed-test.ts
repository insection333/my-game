// The closed test's routes (step 18): a tester's feedback from Settings, and the admin page's panel of
// invites, testers and feedback. Sign-up takes an invite code while invites are required (routes.ts).
import { z } from 'zod';
import { CONTROL_CHARS, INVITE_PATTERN } from './limits.ts';
import { PATHS } from './paths.ts';
import type { RouteContract } from './routes.ts';

export const FEEDBACK_MAX = 2000;
export const INVITE_LENGTH = 12;

/** Feedback is free text over several lines: line breaks and tabs, but no other control characters. */
export const FeedbackText = z
  .string()
  .trim()
  .min(1)
  .max(FEEDBACK_MAX)
  .refine((s) => !CONTROL_CHARS.test(s.replace(/[\n\t]/g, ' ')), 'no control characters');
export const Feedback = z
  .object({
    text: FeedbackText,
    page: z
      .string()
      .max(200)
      .regex(/^\/[\w\-/?=&.%]*$/),
  })
  .strict();
export const InviteCode = z.string().regex(INVITE_PATTERN, 'twelve letters and digits');

const route = (r: RouteContract) => r;
export const CLOSED_TEST_ROUTES = {
  feedback: route({
    id: 'feedback',
    method: 'POST',
    path: PATHS.feedback,
    auth: 'player',
    input: Feedback,
    example: { text: 'The forge tab took me a while to find.', page: '/skills/smithing' },
  }),
  adminTest: route({
    id: 'adminTest',
    method: 'POST',
    path: PATHS.adminTest,
    auth: 'admin',
    input: null,
    example: null,
  }),
  adminInvite: route({
    id: 'adminInvite',
    method: 'POST',
    path: PATHS.adminInvite,
    auth: 'admin',
    input: null,
    example: null,
  }),
} satisfies Record<string, RouteContract>;

/** An invite as the admin page lists it: its code, when it was made, and who signed up with it. */
export interface InviteView {
  code: string;
  createdAt: number;
  usedBy: string | null;
  usedAt: number | null;
}
/** A tester as the closed test's panel shows them. */
export interface TesterView {
  name: string;
  joinedAt: number;
  /** Days on which they came to the game, and whether those include their second and third (null
   *  while that day has not come yet). */
  daysPlayed: number;
  day2: boolean | null;
  day3: boolean | null;
  lastSeen: number | null;
  totalLevel: number;
  /** What the Hearth asks of them now: their goals, in the game's own words. */
  aims: string[];
}
export interface FeedbackView {
  name: string | null;
  at: number;
  page: string;
  text: string;
}
export interface AdminTestResponse {
  invitesRequired: boolean;
  invites: InviteView[];
  testers: TesterView[];
  feedback: FeedbackView[];
}
export interface AdminInviteResponse {
  code: string;
}
