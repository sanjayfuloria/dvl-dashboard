// KILL SWITCH — 2026-09-03
//
// The previous version of this Service Worker intercepted every same-origin
// GET navigation (including the page a browser lands on right after
// POST /api/login redirects it to the dashboard) and re-issued it via
// fetch(event.request). Chrome disallows using a redirected Response to
// satisfy a navigation request from inside a Service Worker, which surfaced
// in DevTools as a CORS-labeled failure on that post-login navigation —
// breaking login for every browser that had ever previously registered
// this worker, site-wide, with no visible error on the login page itself.
//
// Fix: replace the SW's content entirely. Any browser with the old worker
// registered will detect this new byte-for-byte-different script on next
// load, install it, and — because it calls skipWaiting()/clients.claim() —
// activate it immediately. Activation deletes all caches, unregisters the
// worker so no SW intercepts requests going forward, and reloads any open
// tabs so the person doesn't have to know to clear site data manually.
//
// Once this has been live for a while and everyone's old worker has been
// replaced, this file (and the registration call in app/layout.tsx) can be
// deleted outright rather than kept as a permanent no-op kill switch.

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
      await self.registration.unregister()
      const clients = await self.clients.matchAll({ type: 'window' })
      clients.forEach((client) => client.navigate(client.url))
    })()
  )
})
