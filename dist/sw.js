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
  self.workbox.precaching.precacheAndRoute([{"revision":"cc89f28b802b168fc14f519a0c84dbe7","url":"assets/activity-ekZjjqCj.js"},{"revision":"b4782eb29e407eb9d420cecb7990550d","url":"assets/AdminAcceptPage-DMExgmco.js"},{"revision":"79f1b54e5a64141e7c05c91d962aa5fc","url":"assets/AdminEnhancedPage-C8xNosRc.js"},{"revision":"1b119a42bb55fb80b51bbbb024855c5d","url":"assets/AdminListingsPage-B2m_ZZbV.js"},{"revision":"69852072369bd9a2ef1d26adf34462f3","url":"assets/AdminMigrationPage-COilotex.js"},{"revision":"02e829ced8b9c857922469bc1ad84514","url":"assets/AdminPanel-BtvSjSQU.js"},{"revision":"f0a73dc14485e358b09b59489ea5a3b6","url":"assets/AdminPaymentsPage-tE5SzwA3.js"},{"revision":"1d79e186e7faf901d256efc989397624","url":"assets/AdminRafflePage-C8MMYNFK.js"},{"revision":"441c0587427f2494b6b2f1ed17986bb7","url":"assets/AdminShell-DD9x-pqF.js"},{"revision":"8732a9afd2c326795ef12d3f215692cc","url":"assets/api-c0qkTB0U.js"},{"revision":"a16ead27369e558ed9eab36a627c342f","url":"assets/arrow-left-nIyrRAz4.js"},{"revision":"b53a5d3862de8b2641aca2cf39d17b75","url":"assets/arrow-right-f7lhS-3l.js"},{"revision":"ee909734e1488cba5a36846dd62ae8b3","url":"assets/award-l8TfCIRr.js"},{"revision":"9fdf4f2d99a3bc0a91150a7065ce6dde","url":"assets/badge-dollar-sign-4Ha0azzA.js"},{"revision":"bb1141fb0254b049b06d1c8fefbe215a","url":"assets/book-open-mqLiTil-.js"},{"revision":"276ee05a26e4b880dac60e34b2bdcb7e","url":"assets/calendar-D4EL5KHW.js"},{"revision":"d3b968c25c388e721422b8acedb1958a","url":"assets/CampaignPage-BdlJXeNI.js"},{"revision":"0418c9b90a3bbec1fe3c9ba963e5000e","url":"assets/CampusDashboardPage-BBBkpaya.js"},{"revision":"86e5ab5419049bb6858b9b6499938c2a","url":"assets/check-Dze1YoyF.js"},{"revision":"1eb916d9a3e016d009346f5310f18911","url":"assets/chevron-left-0ZVXq7hG.js"},{"revision":"bfb433dd3b388596f7e0fb4c2e534da7","url":"assets/chevron-right-CI173hND.js"},{"revision":"c34edef7e99d30d671da4a2d6821fb12","url":"assets/circle-alert-BceaYU-d.js"},{"revision":"bd5f2a095805a0f6661f6846f07ed4aa","url":"assets/circle-check-big-ClNHVbXk.js"},{"revision":"4de21e76fc59c3169b9983add390dbf6","url":"assets/circle-check-DLVouEhA.js"},{"revision":"360c81fe3584f02dd80eb73a481b5f2a","url":"assets/circle-x-BTUzvYVy.js"},{"revision":"99850c97750c4d18b0ae3256e972b9ae","url":"assets/clock-UchZpP15.js"},{"revision":"cc6a61ae81e8da7eb4cd093a4d238d2f","url":"assets/Console-Cp291OmC.js"},{"revision":"6c866bd8e4db58687d0092e67c3be41e","url":"assets/copy-C7zj9lbN.js"},{"revision":"86fe90626fa12382890149df183275ae","url":"assets/credit-card-CfWB_5D2.js"},{"revision":"331782cb69dcfd22832add215a9a7340","url":"assets/crown-B4CM7fnm.js"},{"revision":"19c2f73c4a659ca278e2527f0cd1cd9a","url":"assets/DashboardPage-V8icXb1r.js"},{"revision":"a6d45c6a55c1002fff0654bce39199bc","url":"assets/external-link-B4GPSnHa.js"},{"revision":"41758d9f98247073810cfba610eba830","url":"assets/eye-DmzLlqku.js"},{"revision":"cfb621009c101d18d31622673366e6b9","url":"assets/eye-off-CmClcZce.js"},{"revision":"e3132f0fd60abe57a79edb3c3f16dbbb","url":"assets/file-text-DhwO2X8T.js"},{"revision":"f3675aeeda26b939f992432bb97b1cbf","url":"assets/funnel-CQOjqfG1.js"},{"revision":"c05ccfed87ec4ea7888c1acad4e0a532","url":"assets/gift-CT9my_sa.js"},{"revision":"f8d6885eac7b915523dc5e566c2ae92c","url":"assets/graduation-cap-CGxPAG25.js"},{"revision":"e8b877a968e494d910d090b215edcd27","url":"assets/GuestOnboardingPage-CUx0UPqk.js"},{"revision":"65f1904c49d3b8a7ac34119bf757e9e8","url":"assets/handshake-BSlRWMTP.js"},{"revision":"36241f1a92da3f3baca5f7c0cb8cdcd3","url":"assets/image-PCyTRvyI.js"},{"revision":"68e228d1ab552d25f053ca94a3f4d772","url":"assets/index-BBQ6gOTp.css"},{"revision":"f0c2c02c6cbb1f08ae2dba799cdc18af","url":"assets/index-CWyL3g8i.js"},{"revision":"f7b1dc60437f5dc1b065330a05544d08","url":"assets/LandingPage-BXj68aQ3.js"},{"revision":"03c995c914f8edc34a39c56a1f7c2e4f","url":"assets/layout-dashboard-C9--juGl.js"},{"revision":"436cd1b894ebf29c5f2045037f9a3a54","url":"assets/link-2-DCV-u79u.js"},{"revision":"2f6ce1e2dfd26e672820090b98a19981","url":"assets/ListSubscriptionPage-Cq1DtG0y.js"},{"revision":"2fbd24ff27017455ec334a41091bd2f6","url":"assets/loader-circle-BHYMh5s9.js"},{"revision":"f184ed5e2b995529b1fb48c12423e69b","url":"assets/lock-CN2M3Fbb.js"},{"revision":"9727d1170fe55602533e91b0e163c6a7","url":"assets/log-out-Cdx1SPra.js"},{"revision":"57bba9e84170da1254a63a84bc0f9ffb","url":"assets/Logo-CuxnGFYP.js"},{"revision":"9466f6dd5b41883034fbdeb1304b32fc","url":"assets/mail-DOAwucaJ.js"},{"revision":"4d310cf0e43d9c39829f38422ad4be4f","url":"assets/MainLayout-NMrSm3ck.js"},{"revision":"251c6cb2dc387eb5c6a6eb1cb81711a2","url":"assets/medal-CIFVmJk6.js"},{"revision":"1e24726c1372e36bbe7519195e29447d","url":"assets/OwnerEarningsPage-BUU-t10I.js"},{"revision":"d87b39399ff022c4c0ccb7d06c6a131c","url":"assets/PartnerLoginPage-Di-CHC69.js"},{"revision":"f2dad615e30730da190285e3597f9e52","url":"assets/phone-PuxPtw4Y.js"},{"revision":"6873e17e207abdb50009ddccd2fa89cf","url":"assets/QHubPage-NAVpmzKC.js"},{"revision":"fe6b1f7956087f74235cb270acfdd153","url":"assets/qr-code-CAQZTeKx.js"},{"revision":"27d05b72e9d290950335fe437b90f8da","url":"assets/RafflePage-Dr4n85ij.js"},{"revision":"57650fa035b218f40657292d9cb25c33","url":"assets/ReferralsPage-BO35Bzf-.js"},{"revision":"065f68c6a2982d6de232df8a97d74b2a","url":"assets/RegisterPage-d3NU7TAW.js"},{"revision":"67135aa20178fda1d8f6468fe499c084","url":"assets/RewardsPage-4ZY5EIfO.js"},{"revision":"8f66d91ffd2e911c341e8c8cbc028dc6","url":"assets/search-Duxn8_Gf.js"},{"revision":"671b378e4290249447217d633d2aa598","url":"assets/send-D8khuUah.js"},{"revision":"bde52af945cb271dba88037c9859038d","url":"assets/settings-D6w73j4B.js"},{"revision":"5615185c530998beb05f6d5062e195d4","url":"assets/share-2-Duqq1RFk.js"},{"revision":"ff46205bf0a182f30a521fda8d0b0465","url":"assets/shield-check-3X4f1LsD.js"},{"revision":"9e4062a8103aad721257a6cbdaacaf84","url":"assets/shield-nAL7uG71.js"},{"revision":"89f63ee8c084857ee92ea2c97ca98198","url":"assets/shopping-bag-76j5Ue5-.js"},{"revision":"31022f67456711f40132b19cff8fd51f","url":"assets/smartphone-BCgeQaRR.js"},{"revision":"c0244f6879e9aa4b49202be12c9c3f07","url":"assets/sparkles-DrZh6rOA.js"},{"revision":"4403bfc8435a050e0421250e605e6bfd","url":"assets/star-BVko5dcB.js"},{"revision":"5138dab236b87e2028ec8791308b4ef9","url":"assets/storage-DYrhPl14.js"},{"revision":"2b73a41c8fceccdaf7cbe9097f93e0fa","url":"assets/tag-BwXwxzQw.js"},{"revision":"c5d4c78744f6a9b9f8264b83893bc6bf","url":"assets/target-rkV3O8-y.js"},{"revision":"4fcaf43fa84860cdade4983e52a055ea","url":"assets/ticket-CY-G7hht.js"},{"revision":"9be8459aedb75d52a87a3b509591e068","url":"assets/trash-2-CeZ1som8.js"},{"revision":"d9a8cc8bb8e8588cbd03122730fb09e4","url":"assets/trending-down-E8uZR97Z.js"},{"revision":"df5199a5703f96ea0cc1ce8dc203bd6b","url":"assets/trending-up-72cErK_y.js"},{"revision":"69c5d19bcfa057621b11a0a8489fb4c6","url":"assets/triangle-alert-C4q200tP.js"},{"revision":"c156d8aa7b9f681b28273673ed49b49a","url":"assets/trophy-F0zz76ld.js"},{"revision":"e46b47f104f523c3cf93adefe6bcefe1","url":"assets/twitter-C4VTEyDA.js"},{"revision":"32bb686d73a0500d1736ef53d5d039bf","url":"assets/user-Ci_5IMyV.js"},{"revision":"e0391e636f3cdf808817f4b4604e13e9","url":"assets/user-plus-Ccg-r7jZ.js"},{"revision":"aac9dbbb1f33981eb01d251ef4f79e3c","url":"assets/users-DuWjCxUu.js"},{"revision":"4bae175ba66cb919aece5c98eae05b22","url":"assets/utils-D9CVpt8D.js"},{"revision":"7a04b6c34caa90b8215a37ac66c1b932","url":"assets/wallet-DxN0GU_f.js"},{"revision":"6e6db88a28d88f940374bc93f9cb9335","url":"assets/WalletFundingPage-CfBRbM8C.js"},{"revision":"a9a99a2ca427525a59eabfb65a4d501b","url":"assets/youtube-6DKdERWu.js"},{"revision":"d8e71dcda5f0aee43c1b0f450e5575ea","url":"assets/zap-Cp-aGi8M.js"},{"revision":"59bef1569f1e9b776c32c78ab46a6b02","url":"favicon.ico"},{"revision":"c138737bf277179eb38bfc8624ef13ef","url":"index.html"},{"revision":"20502e8b9b9c03333c5ea7513a484f98","url":"q-3d.png"},{"revision":"5790fe600299aff0f9ca71bf261cce56","url":"qquest-dashboard-concept.png"},{"revision":"f78fcdcc118dcbfe3b446ec423890b64","url":"qquest-hero-bg.png"}] || []);

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
