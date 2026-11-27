// After a deploy, a page opened before it may ask for a script the server no longer has (each build
// names its files by their contents). The page then loads the new build instead of breaking, at most
// once a minute, so a file that is truly missing cannot reload it forever; never while words are typed in a box
// (session 280: a fetch that failed offline, or as the server restarted, reloaded the welcome page under the
// name and password being typed), when the failure is left to the press that asked, which says it.
const KEY = 'reloadedForDeploy';

export function reloadOnStaleFiles() {
  window.addEventListener('vite:preloadError', (event) => {
    if (typing()) return;
    try {
      if (Date.now() - Number(sessionStorage.getItem(KEY) ?? 0) < 60_000) return;
      sessionStorage.setItem(KEY, String(Date.now()));
    } catch {
      return;
    }
    event.preventDefault();
    location.reload();
  });
}

// A page left open across a deploy (session 202): an idle game's tab stays open for days while main deploys
// itself, and the page went on running the old build's engine every second over the new server's saves,
// contracts and words. The server names its build on every answer from the API (its page's entry script);
// a page of another build loads the new one when it is next hidden, or as it next moves to another page,
// never while words are being typed in a box.
let own: string | null = null;
let stale = false;

/** Called once by the page's entry with its own script's address; a page in development has none. */
export function watchBuild(entry: string): void {
  own = entry.startsWith('/assets/') ? entry : null;
  stale = false;
  document.addEventListener('visibilitychange', () => {
    if (stale && document.hidden) reloadIfFree();
  });
}

/** Heard on every answer from the API: the build the server serves now. */
export function heardBuild(build: string | null): void {
  if (!own || !build || build === own || stale) return;
  stale = true;
  if (document.hidden) reloadIfFree();
}

/** Whether this page is of an older build than the server's: the router then loads the next page afresh. */
export const staleBuild = (): boolean => stale;

const typing = (): boolean =>
  Array.from(
    document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
      'textarea, input:not([type=radio]):not([type=checkbox]):not([type=range]):not([type=hidden])',
    ),
  ).some((el) => el.value !== '');

function reloadIfFree(): void {
  if (!typing()) location.reload();
}
