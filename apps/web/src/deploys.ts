// After a deploy, a page opened before it may ask for a script the server no longer has (each build
// names its files by their contents). The page then loads the new build instead of breaking, at most
// once a minute, so a file that is truly missing cannot reload it forever.
const KEY = 'reloadedForDeploy';

export function reloadOnStaleFiles() {
  window.addEventListener('vite:preloadError', (event) => {
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
