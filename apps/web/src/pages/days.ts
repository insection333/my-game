// A day as the game says it on every page ("9 Nov" this year, "9 Nov 2025" before: session 79), for the
// pages that say only days (the inbox's mute, and the admin's players, testers, reports and repairs).
import { fmt } from '@idle-clash/content';

export const dayOf = (at: number, now: number = Date.now()): string => fmt.day(at, now);
