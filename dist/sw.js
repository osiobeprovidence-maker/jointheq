/*
  Workbox-enabled service worker.
  This file is the SW source used by Workbox's injectManifest.
  During the build step workbox-build will inject the precache manifest.
*/

/* eslint-disable no-undef */
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

self.skipWaiting();

if (self.workbox) {
  self.workbox.core.clientsClaim();
  self.workbox.precaching.cleanupOutdatedCaches();

  // Precaching placeholder populated by workbox-build during injectManifest
  self.workbox.precaching.precacheAndRoute([{"revision":"37a74c394fa8d97544bde0fd20a25c9c","url":"assets/activity-CFLMB-JC.js"},{"revision":"3b85c6376b74b12e287e47bdcec9bd4b","url":"assets/AdminAcceptPage-CG1E77qM.js"},{"revision":"4ecbe97ceb6893a4a12d543e06c0dcbb","url":"assets/AdminEnhancedPage-BD_JCv4T.js"},{"revision":"469526108d39fca84aba59a1faf4f891","url":"assets/AdminListingsPage-DQmbpPYx.js"},{"revision":"53afc271e0fa2848a263daf1a6d97f01","url":"assets/AdminMigrationPage-DARo4IEg.js"},{"revision":"09eae293ae7da9c2a588042334b2a1cb","url":"assets/AdminPanel-CFNzLMyI.js"},{"revision":"03bbd123e8e7c0c6a9e93c54eca7d862","url":"assets/AdminPaymentsPage-BXN_0b7L.js"},{"revision":"26e06fdbbef83a94c8bd841fb2715011","url":"assets/AdminRafflePage-BqM7LgcB.js"},{"revision":"7079ec03091e589b0a835ec75ae1ce37","url":"assets/AdminShell-CMT4Xcai.js"},{"revision":"01960db815aad686d4070a452d08ce11","url":"assets/api-BWIXdmSq.js"},{"revision":"79e2fdc7d2a076346b7f4c58c423f396","url":"assets/arrow-left-Dt6JzFXW.js"},{"revision":"6d93be4b162be8eafd8e66449a16e804","url":"assets/arrow-right-nTmi9S2J.js"},{"revision":"646a147080a9c0dc23264266cba059fa","url":"assets/award-UUt9-kKN.js"},{"revision":"8d5844cd909521dc03636c2c6137e80c","url":"assets/badge-dollar-sign-B0Z-WUVw.js"},{"revision":"3afe21a0814f5ae0d7c6a8a47517a17a","url":"assets/book-open-C-cl9btO.js"},{"revision":"bd5ac00f09ea70aa2eb3230bb008caa9","url":"assets/calendar-B1mlfBwF.js"},{"revision":"02e41d4e2e89bd7485e2258f2234bee2","url":"assets/CampaignPage-DEakrE0C.js"},{"revision":"c49cbdd00fc720934b4a34ef67b01aae","url":"assets/CampusDashboardPage-iGZhznDP.js"},{"revision":"d30a66b2338b1daf57b6eac952b0c152","url":"assets/check-BVm7-Zhi.js"},{"revision":"b7f44bdfc66e1947e0c6f2fcb0943da4","url":"assets/chevron-left-BRNqIilP.js"},{"revision":"e8d424b653c04400780e99026be21d85","url":"assets/chevron-right-C76V15HD.js"},{"revision":"14ecdcc8182e0f439d6f36fa80157669","url":"assets/circle-alert-BPM3SRPi.js"},{"revision":"cb6cd3aa1752e75f194e7d03d2587d4b","url":"assets/circle-check-big-BxHqaDL7.js"},{"revision":"3f826a5b05fc5fe8c5027e5da85d32b7","url":"assets/circle-check-CM9acnz0.js"},{"revision":"b0b8a51e11f24fa0152887d4abdba0ee","url":"assets/circle-x-vNwCbvIq.js"},{"revision":"520c238ba24891db32877c808e2e88b6","url":"assets/clock-Cmnlbf05.js"},{"revision":"2dbe8273f83a77d5c0daca640ed44b60","url":"assets/Console-ClbV1_QS.js"},{"revision":"408386776922b566180ee68457375a2b","url":"assets/copy-nFltcHmX.js"},{"revision":"3117b50194ad3c362ddbef876689b6ae","url":"assets/credit-card-BVtOzmTw.js"},{"revision":"bbf0c851e1cbe3ae746fe79c0c154f16","url":"assets/crown-CyTAKeLu.js"},{"revision":"3db72591117e198121bc90d7d8be511f","url":"assets/DashboardPage-C-WeoAgj.js"},{"revision":"a576626ef496fc34c5aefca85cd6db1e","url":"assets/external-link-C8U6PUSZ.js"},{"revision":"e67f6b00f6a7f1497903f5a9e02a9190","url":"assets/eye-BnKWmbmz.js"},{"revision":"34cde0265290b6f8ac952468b067e599","url":"assets/eye-off-xH6XsxU2.js"},{"revision":"f2bd321dd3cc887d62dbe2f24e840849","url":"assets/file-text-BPOsADmr.js"},{"revision":"b0db3e32c21e0a4d98736174c2db2f16","url":"assets/funnel-Qgyy5_YB.js"},{"revision":"12082097fbd9bbd86a3787f4840b3224","url":"assets/gift-7A0Ms0hj.js"},{"revision":"199b8e0c797ff6f5eacde9621962e5de","url":"assets/graduation-cap-MDnzL2vi.js"},{"revision":"9206147b10d7e29510e93180f8d46101","url":"assets/GuestOnboardingPage-BMfWBkhw.js"},{"revision":"9f66f957951edf0cc1baaa4666add20f","url":"assets/handshake-Dr1t-hXV.js"},{"revision":"a3f85d021006d5cc1e4b3d7d3ba15432","url":"assets/image-BC71QqfZ.js"},{"revision":"7542b4697fcae42df49d89e63b92e8d3","url":"assets/index-C2IzPhVw.css"},{"revision":"e546ea5f453a5e363179fe74ac771eb5","url":"assets/index-jIJ9pMjf.js"},{"revision":"d13a428f72c91a65c4d5eeb12eee6e43","url":"assets/info-CaFk-nn1.js"},{"revision":"9456ee1d21e1d5bade0ade306ed51eb9","url":"assets/LandingPage-DlXx9B1J.js"},{"revision":"1c5c622d80be514eb22f85f0407b1132","url":"assets/layout-dashboard-S7lyBjJd.js"},{"revision":"6ba07c4180d428a61e9344f8c3c93966","url":"assets/link-2-CYb5Z_d6.js"},{"revision":"c40df522fcc220a873e79c7936155be2","url":"assets/ListSubscriptionPage-coIaev-U.js"},{"revision":"6b18742937f6d4f81c337075e9ad3132","url":"assets/loader-circle-DJyUVVse.js"},{"revision":"64ee53afd1206e53430f2489bd1ac2c8","url":"assets/lock-Azf7ksIh.js"},{"revision":"6ddb17e4d5515e83b6f7d49b5de947b1","url":"assets/log-out-SM47RgGZ.js"},{"revision":"98efa02515a3c472d11a64b7fbcf4ca9","url":"assets/Logo-BlZwotAm.js"},{"revision":"976767c8f213443789d68601fa34fc8c","url":"assets/mail-DG51Z6Va.js"},{"revision":"5f6cbd07550c9c70b9b0e116220f4be2","url":"assets/MainLayout-BPx1XAth.js"},{"revision":"bf876da70c65e6c7c703f3f2535e7019","url":"assets/medal-5VhBKSOF.js"},{"revision":"30d1e5b6b6273d95f8e89254fb601acc","url":"assets/OwnerEarningsPage-Jdc9xx3f.js"},{"revision":"1f5f483e75590e327d117f9a862f0564","url":"assets/PartnerLoginPage-Dvc07lTT.js"},{"revision":"e28700976267e5512beb78a73339f2f7","url":"assets/phone-DUdqIlQ7.js"},{"revision":"0deb3a48a16699583900efc3ef91fd75","url":"assets/QHubPage-_iBV_NqI.js"},{"revision":"e3f8eb21348a8571d1e113eb471530b8","url":"assets/RafflePage-BjtyLl_p.js"},{"revision":"7a2461a89de9c5980efa6175fb5b6082","url":"assets/ReferralsPage-BRYiAxPT.js"},{"revision":"b5ef01560b3bc3c926b9229d39e6c7c4","url":"assets/RegisterPage-BuVFIT1t.js"},{"revision":"ba847a7bcbeae696578c1f5a9ed31ac1","url":"assets/RewardsPage-WmrivENV.js"},{"revision":"56935fcfcf87ed7772ffbf7941a61910","url":"assets/search-DU25M8X5.js"},{"revision":"fa2ff01f7724fe003dbd78467fd21763","url":"assets/send-DIpdbU9j.js"},{"revision":"91b72b5c801f9d0be37c89a77a1b5187","url":"assets/settings-Cq4AQiys.js"},{"revision":"47aaf67da85259c8fd3511404386cdb7","url":"assets/share-2-BEtfmqUv.js"},{"revision":"aef135b343df63bc0c1286b14fced506","url":"assets/shield-check-DjO0ljcs.js"},{"revision":"d9704006146d474617a177015e616a15","url":"assets/shield-skBNA5uQ.js"},{"revision":"90c47fd9b241a9e435094c2bfc72720c","url":"assets/shopping-bag-_VwrAmCK.js"},{"revision":"2753c0e412e8bb1dd8ff3170f77b37e8","url":"assets/smartphone-Cb0jF0dB.js"},{"revision":"06acc6a8e3757a6689714d76a6a68a70","url":"assets/sparkles-CXwlup-w.js"},{"revision":"308cfff2c53e416c21143e0633a8c5b6","url":"assets/star-DWLAYQmC.js"},{"revision":"6c6f8c8a542ae5d29b543d3b7c561d7b","url":"assets/storage-DiUtmqcz.js"},{"revision":"0db86ce93f223b759ed4fa701523ca66","url":"assets/tag-Ce9i-xx6.js"},{"revision":"cb2eb9f2c269e278438193122f0b236c","url":"assets/target-BHyWuqpe.js"},{"revision":"e47281011952eae5fb6110615d3e2235","url":"assets/ticket-B3dFzKs0.js"},{"revision":"80457229799003120235a4213438c8e5","url":"assets/trash-2-BSbGzM2j.js"},{"revision":"d16b1f76e9e825de0c406b6c378a7c6b","url":"assets/trending-down-DWM0IY5V.js"},{"revision":"da7d07636f4ab08f11df6fe37529443b","url":"assets/trending-up-BE3CONDU.js"},{"revision":"5d74daa1a861d993b8d45140e0920bd6","url":"assets/triangle-alert-B_L2ONwG.js"},{"revision":"75c7997f69ad8770c49be6824604e86e","url":"assets/trophy-DKYvm-Pd.js"},{"revision":"6ef95976f00acaf4e90e865ff0ec36b5","url":"assets/twitter-Vf65shwu.js"},{"revision":"22a4508cec415a68f2404ae83810886f","url":"assets/user-C-985lao.js"},{"revision":"5014c3d569d4b8509fb84ee65002234e","url":"assets/user-plus-B_lXwIn9.js"},{"revision":"08318ad0a5cd3a7538b6c11fff2e3c46","url":"assets/users-C9WX4e99.js"},{"revision":"4f1750fa02d0cd15d9aa8f1fe679f2fc","url":"assets/utils-BnwoSZnd.js"},{"revision":"fd6dc4be7a3a41a45d63a959b37ca0c4","url":"assets/wallet-GlgfqSBF.js"},{"revision":"d467e63c4871142ed5fa9437846eeaa4","url":"assets/WalletFundingPage-CuowHT4M.js"},{"revision":"0d6cb2258c545e951ec211a9f58f5418","url":"assets/youtube-vWdhIvl5.js"},{"revision":"60b3eed3a4e052ce3c068e2aa501df89","url":"assets/zap-CFt8ZJVr.js"},{"revision":"59bef1569f1e9b776c32c78ab46a6b02","url":"favicon.ico"},{"revision":"c6267fff6cccc0696ff14ff5201dc4ec","url":"index.html"},{"revision":"20502e8b9b9c03333c5ea7513a484f98","url":"q-3d.png"},{"revision":"5790fe600299aff0f9ca71bf261cce56","url":"qquest-dashboard-concept.png"},{"revision":"f78fcdcc118dcbfe3b446ec423890b64","url":"qquest-hero-bg.png"}] || []);

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
