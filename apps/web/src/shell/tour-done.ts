// Whether this player ended the tour (the cross, or its last step): it does not come back. Kept for each
// player (session 204); where this browser keeps nothing it may show again next visit, as it is short.
import { keep, kept } from '../kept.ts';

const DONE_KEY = 'tourDone';
export const tourDone = (): boolean => kept(DONE_KEY) === '1';
export const finishTour = (): void => void keep(DONE_KEY, '1');
