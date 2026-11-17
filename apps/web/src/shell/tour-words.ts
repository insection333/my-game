// The tour's words for each step (session 129): the fire's says what keeps it burning and for how long,
// from the kernel's own config, where "While you are here the fire burns" stood beside the header's Stoke.
import { fmt, t } from '@idle-clash/content';
import { DEFAULT_CONFIG } from '@idle-clash/kernel';

export const stepWords = (key: string): string =>
  key === 'tour.fire' ? t(key, { time: fmt.duration(DEFAULT_CONFIG.fireBurns) }) : t(key);
