// Idle Clash's service worker (session 171): it only shows the notices sent while a player is away, and
// opens the page a notice leads to. It caches nothing, so the game is always the one the server serves.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  const title = typeof data.title === 'string' ? data.title : 'Idle Clash';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: typeof data.body === 'string' ? data.body : '',
      tag: typeof data.tag === 'string' ? data.tag : 'idle-clash',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      // A path on this site only: "//elsewhere" also starts with a slash (session 275).
      data: { url: typeof data.url === 'string' && /^\/(?![/\\])/.test(data.url) ? data.url : '/' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url ?? '/', self.location.origin).href;
  event.waitUntil(
    (async () => {
      const open = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const c of open) {
        if (new URL(c.url).origin === self.location.origin && 'focus' in c) {
          await c.focus();
          // The tab goes there in place (session 302): navigated, it loaded afresh and lost a letter half written
          // and the presses still waiting to be sent. A tab of a build that does not listen is only brought forward.
          const to = new URL(url);
          c.postMessage({ type: 'idle-clash:open', url: to.pathname + to.search });
          return;
        }
      }
      await self.clients.openWindow(url);
    })(),
  );
});
