// Where a page not signed in is sent: the welcome page, which returns to the page asked for afterwards.
// A device a player has signed in on before opens on Sign in (session 157), where every lapsed session
// opened on Create account and a returning player's own name was refused there as taken.

const PLAYED = 'played';

/** Whether a player has signed in on this device before (nothing kept by the browser reads as no). */
export function playedHere(): boolean {
  try {
    return localStorage.getItem(PLAYED) === '1';
  } catch {
    return false;
  }
}

/** Kept as a player enters the game; forgotten when their account is deleted. */
export function notePlayed(played: boolean): void {
  try {
    if (played) localStorage.setItem(PLAYED, '1');
    else localStorage.removeItem(PLAYED);
  } catch {
    // A browser that keeps nothing opens on Create account, as before.
  }
}

export const welcomeFor = (path: string, search: string, played: boolean): string =>
  `/welcome${played ? '/sign-in' : ''}${path === '/' ? '' : `?next=${encodeURIComponent(path + search)}`}`;
