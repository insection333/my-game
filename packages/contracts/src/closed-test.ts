// Feedback and the players' panel (step 18): a player's feedback from Settings, and the admin page's
// panels of the players (the days they came back, what they aim for) and their feedback.
import { z } from 'zod';
import { CONTROL_CHARS } from './limits.ts';
import { PATHS } from './paths.ts';
import type { RouteContract } from './routes.ts';

export const FEEDBACK_MAX = 2000;

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
} satisfies Record<string, RouteContract>;

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
  /** The player's name (null once their account is deleted, though their feedback goes with it). */
  name: string | null;
  at: number;
  page: string;
  text: string;
  /** Where the player stood when the admin looked: context for whoever reads it. */
  totalLevel: number;
  daysPlayed: number;
}
export interface AdminTestResponse {
  testers: TesterView[];
  feedback: FeedbackView[];
}
