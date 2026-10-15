/*
 * SERVICE-WORKER KILL SWITCH — not part of this app.
 *
 * Another local project (personal/Calorie tracker, a PWA) once ran on
 * localhost:5173 and left a service worker registered for that origin. It
 * keeps serving the calorie tracker's cached pages to ANY project on 5173.
 *
 * The browser re-fetches `/sw.js` from the network to check for updates. When
 * it gets this file, it installs it, and this worker deletes that origin's
 * caches, unregisters itself and reloads open tabs — so the next load comes
 * from whatever dev server is really on the port.
 *
 * This app registers no service worker of its own, so the file does nothing
 * unless a stale one asks for it. Safe to delete once the browser is clean.
 */
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    await self.registration.unregister();
    const tabs = await self.clients.matchAll({ type: 'window' });
    tabs.forEach((tab) => tab.navigate(tab.url));
  })());
});
