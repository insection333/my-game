// Time in the kernel is milliseconds since the Unix epoch, always passed in, never read.

export type Millis = number;

export const SECOND: Millis = 1000;
export const MINUTE: Millis = 60 * SECOND;
export const HOUR: Millis = 60 * MINUTE;

export interface KernelConfig {
  /** Lanes keep working for this long after the player's last input (24 hours in version 1). */
  awayCap: Millis;
  /** The fire burns for this long after the last input (5 minutes). */
  fireBurns: Millis;
  /** The shortest action the kernel accepts; guards the loop against a rule returning zero. */
  minAction: Millis;
}

export const DEFAULT_CONFIG: KernelConfig = { awayCap: 24 * HOUR, fireBurns: 5 * MINUTE, minAction: 100 };
