// The mail monitor's letters, read (session 78): who an action falls on, and when the letter was sent.
import { fmt } from '@idle-clash/content';

/** The player a letter's Warn and Mute fall on: its sender, or none for the realm's own warnings. */
export const letterSender = (m: { from: string }): string | null => m.from || null;

/** When a letter was sent, as the game says times ("14:22" today, "9 Nov, 13:02" this year). */
export const letterWhen = (at: number, now: number = Date.now()): string => fmt.when(at, now);
