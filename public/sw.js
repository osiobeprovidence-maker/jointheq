/*
  Workbox-enabled service worker.
  This file is the SW source used by Workbox's injectManifest.
  During the build step workbox-build will inject the precache manifest.
*/

/* eslint-disable no-undef */
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

if (self.workbox) {
  // Precaching placeholder populated by workbox-build during injectManifest
  self.workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);

  // Runtime caching for images (cache-first)
  self.workbox.routing.registerRoute(
    ({request}) => request.destination === 'image',
    new self.workbox.strategies.CacheFirst({
      cacheName: 'images-cache',
      plugins: [
        new self.workbox.expiration.ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 }),
      ],
    })
  );

  // Runtime caching for API (network-first)
  self.workbox.routing.registerRoute(
    ({url}) => url.pathname.startsWith('/api') || url.pathname.startsWith('/convex'),
    new self.workbox.strategies.NetworkFirst({
      cacheName: 'api-cache',
      networkTimeoutSeconds: 3,
    })
  );
}

// Keep existing push notification handlers
self.addEventListener('push', (event) => {
  let data = {};

  if (event.data) {
    try {
      data = event.data.json();
    } catch (error) {
      data = {
        title: 'JoinTheQ',
        body: event.data.text(),
      };
    }
  }

  const title = data.title || 'JoinTheQ';
  const options = {
    body: data.body || 'You have a new update.',
    icon: data.icon || '/favicon.ico',
    badge: data.badge || '/favicon.ico',
    tag: data.tag || 'jointheq-notification',
    data: data.data || { url: '/dashboard?tab=notifications' },
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = new URL(
    event.notification.data?.url || '/dashboard?tab=notifications',
    self.location.origin,
  ).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    }),
  );
});
