// A day as the game says it on every page ("9 Nov" this year, "9 Nov 2025" before: session 79), for the
// pages that say only days (the inbox's mute, and the admin's players, testers, reports and repairs).
import { fmt } from '@idle-clash/content';
import { serverNow } from '../game/clock.ts';

/** Reckoned by the server's clock, so a device whose own clock is wrong says the same (session 158). */
export const dayOf = (at: number, now: number = serverNow()): string => fmt.day(at, now);

/** A moment, as a letter or a report says it ("14:22" today, "9 Nov, 13:02" this year). */
export const whenOf = (at: number, now: number = serverNow()): string => fmt.when(at, now);
