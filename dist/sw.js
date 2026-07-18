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
  self.workbox.precaching.precacheAndRoute([{"revision":"4be8bb12b9f1629cfc389a23dab9a125","url":"assets/activity-DiuMLLeT.js"},{"revision":"4a15bb82de9bd6cb97f2e8cd35931b53","url":"assets/AdminAcceptPage-B8N8bZJV.js"},{"revision":"776042b505517b49f958e212ab7c1858","url":"assets/AdminEnhancedPage-JzGqwFGS.js"},{"revision":"99db5a508ebd2e6f8599dfc66f225d9d","url":"assets/AdminListingsPage-BQNx29p4.js"},{"revision":"3415ac681219ff82033f0a75dd286300","url":"assets/AdminMigrationPage-CMJqun6L.js"},{"revision":"e96bbcddb0381b28ac92f4873e649292","url":"assets/AdminPanel-DSK2JESB.js"},{"revision":"f3414bd186e34dc6f521f9a49d3c7ba2","url":"assets/AdminPaymentsPage-2M4dYJSX.js"},{"revision":"ac37b87edde4353fbb41adbaf950810f","url":"assets/AdminRafflePage-Bic14mFJ.js"},{"revision":"b524bb80171ffb517c0ee48e5fe8df26","url":"assets/AdminShell-ob6ke-tT.js"},{"revision":"02159da65eb90e003f1ae9867860ec3f","url":"assets/api-skof3pbq.js"},{"revision":"a5b1a88a84cfac07fc1d40947e4fcbc8","url":"assets/arrow-left-Qh6YLEZI.js"},{"revision":"bdb83558eab5f034f9888340186b4565","url":"assets/arrow-right-DfmZmQAZ.js"},{"revision":"1d057f3d93355a9fe5e8304e91dc22f8","url":"assets/award-BhSYTZfw.js"},{"revision":"225844d8df9c1d3ccb698c04b50b12f2","url":"assets/badge-dollar-sign-BgRRMKZ0.js"},{"revision":"a00d8c04e0edff5a23ee2b85f1b1e181","url":"assets/calendar-BF81dpdc.js"},{"revision":"46f583615c8bce2036f88d15e10adf7e","url":"assets/CampaignPage-BvpdNfV_.js"},{"revision":"1872258fcdaffbcded581330ee6a929d","url":"assets/CampusDashboardPage-CJ4Ugao3.js"},{"revision":"43725e12856ff5ed00b8db2593bd21fb","url":"assets/check-CyiYib4v.js"},{"revision":"4d6ec189f86509e814847300672c30fc","url":"assets/chevron-left-FSfpK152.js"},{"revision":"5f77289463fb00f792b464eea2e129a4","url":"assets/chevron-right-81z2W6Zt.js"},{"revision":"438c08d5bf48b153b0c8d94a0acc4997","url":"assets/circle-alert-DOw1HI7l.js"},{"revision":"cbe10aedb0284ffaf88fdc9d3114cb28","url":"assets/circle-check-big-xO0XndMC.js"},{"revision":"02c4135e7c6ad24051b513ac58253030","url":"assets/circle-check-CLpcB6KG.js"},{"revision":"16f26ec5673209c5e40a50c0e1ebe938","url":"assets/circle-x-D-E2h28S.js"},{"revision":"b51a551ca3a0da11ca64643668848fce","url":"assets/clock-CWYBFcid.js"},{"revision":"df19feca9204b74f9a9fe4cc9e73d4dd","url":"assets/Console-DncnFtsS.js"},{"revision":"30ef10a3f7c89576290fa74bab770fd4","url":"assets/copy-BHnQelWL.js"},{"revision":"b739f71b970730c71451a4590f0f5c96","url":"assets/credit-card-CRrGtncV.js"},{"revision":"dd1069141c9af1bf0fc7a793b3ccc3ef","url":"assets/crown-BaIJWoIP.js"},{"revision":"a82b440460a1eb6c73d33e88f71afd58","url":"assets/DashboardPage-B8DRH-Zp.js"},{"revision":"c4bd4f5350ce1e325a0a3b7dcdb39ebe","url":"assets/external-link-CH8GJ42x.js"},{"revision":"ce2cd8401b70d78a0ddbf2f87b086b33","url":"assets/eye-CwgwDJu9.js"},{"revision":"89b7a7ee15d04d47862e5d91b8372178","url":"assets/eye-off-jCuNgShh.js"},{"revision":"950407b30189a957e5c74310e842037e","url":"assets/file-text-DtEQC0wY.js"},{"revision":"70121924b45f39e1b9ad6672a1f63431","url":"assets/funnel-m3KpyWCv.js"},{"revision":"081c6ef36232d3a140a5dbbe146548cb","url":"assets/gift-CmxWMUST.js"},{"revision":"c148996fabd21a1ba556bee0943e0c74","url":"assets/graduation-cap-BeZi-jsr.js"},{"revision":"80ee8e9371b017e7e77a0d25e05274f8","url":"assets/GuestOnboardingPage-DvpclgDK.js"},{"revision":"36e96e673004cdb08e04f1edfe322c94","url":"assets/handshake-MCuKJHHQ.js"},{"revision":"abaae9e6531f1e6bec9af2cabdc84651","url":"assets/image-oZBfeewP.js"},{"revision":"f26e8b20833695356f6cf776a8ab5213","url":"assets/index-Bv8aJYFY.css"},{"revision":"79178f52c60416cb92293b941b291f88","url":"assets/index-BYVYRyFr.js"},{"revision":"fe6c664eeea3f29ad59188b62038bcaa","url":"assets/info-DQa0WIH_.js"},{"revision":"385f07160c3a1b6c0ec80f5f8148e720","url":"assets/LandingPage-CRi9Zekh.js"},{"revision":"4fbbf206eaad72b081535883a235b11a","url":"assets/layout-dashboard-DVTNxRHT.js"},{"revision":"ffdb0fbd6fcddb33c138672bf7a7cdbd","url":"assets/link-2-DLYC6Bt5.js"},{"revision":"fc6f47de57c942b13545478a1771420e","url":"assets/ListSubscriptionPage-BMMJy3RB.js"},{"revision":"ffffd452e321bb015b2003f9e465c32e","url":"assets/loader-circle-B9X6J1A3.js"},{"revision":"8bd4188f341828070ed60b1613b02b3c","url":"assets/lock-n9ZfK2Ly.js"},{"revision":"d23a69cc2fb8b26447351eaf6fae63ad","url":"assets/log-out-B0VhBAIM.js"},{"revision":"6cdfb61ff888d94182e414ff1758df64","url":"assets/Logo-uBJ8E6es.js"},{"revision":"7636efde1b5197acfcb73c2191cc7366","url":"assets/mail-CRLeu03M.js"},{"revision":"4d8167768b8bdc1774cd56db44e64873","url":"assets/MainLayout-pyXyUtTq.js"},{"revision":"93436427ae58de35fc58522065ed347f","url":"assets/medal-DqAcPPHR.js"},{"revision":"26f22ef8ebe68b81dded081044053244","url":"assets/message-circle-CjFgfZyK.js"},{"revision":"22e1c4455f7961d1f19ff73291b859d8","url":"assets/OwnerEarningsPage-BqBKK5Sd.js"},{"revision":"ea31db8047ece64c6fa5032a13cca990","url":"assets/PartnerLoginPage-Dw0ov4af.js"},{"revision":"928d60f5d6f5ef3b4c562fc0dd13e648","url":"assets/phone-DkOHcZyk.js"},{"revision":"654745540cd6292c9b958e17529ab684","url":"assets/QHubPage-Cf7aDmuD.js"},{"revision":"6bd8c5cf9de4e9b3ba97aba43716e0f3","url":"assets/RafflePage-DQpfoj7G.js"},{"revision":"bd727a3edfe6d2d16753e6d75d7fa040","url":"assets/ReferralsPage-Bh1ypcbs.js"},{"revision":"690fa67cb1b028309a1b3c2aff8d27d0","url":"assets/RegisterPage-BtQXliTO.js"},{"revision":"9b9d3ad1b49e85e1ad3178a1a14bf6e2","url":"assets/RewardsPage-BvuK-4ui.js"},{"revision":"6ee56aa3fdf2811ad69091ec712e2e27","url":"assets/search-KhXzctSJ.js"},{"revision":"8705762602f057a398e5bbca8d560a67","url":"assets/send-GWTVLaTQ.js"},{"revision":"8a9403819222fc3b94c63658fa77321b","url":"assets/settings-WHC8bgXE.js"},{"revision":"cda072ea12397948ee7f05bbf6d68880","url":"assets/share-2-CqSe2Q_u.js"},{"revision":"badd1981f286689c015e3cd66acddf18","url":"assets/shield-check-BOOaawgn.js"},{"revision":"48e35d8c3b7d7b003b04830fbce5f89d","url":"assets/shield-CXRn3x8r.js"},{"revision":"38ce6f41ddcdc2c21a938658136850f9","url":"assets/shopping-bag-BS3JGbo4.js"},{"revision":"d0c3fc7b8cebf90b2dee68220ff08dcc","url":"assets/smartphone-DSCUK80e.js"},{"revision":"54dc9af7fde01ef24e3b13684f82a1a9","url":"assets/sparkles-DLeytLJO.js"},{"revision":"079b344575e28f401403c849f6dc6ebb","url":"assets/star-BUwnc-5r.js"},{"revision":"e7a2377be76a99b7e296cd7278022e59","url":"assets/storage-ChKwH2O4.js"},{"revision":"c47f798c3ecdab2b1313cf84f3d9e0b4","url":"assets/tag-Cyc-7rSn.js"},{"revision":"06cdadbf019b65d1c478d78d8eaf0dfe","url":"assets/target-y942f7rl.js"},{"revision":"325a5d4a934ac7d32828fa947b2726f3","url":"assets/ticket-DCn2WyQE.js"},{"revision":"7474e578fd3459c3316a6862c12f5d2a","url":"assets/trash-2-BFn66HNK.js"},{"revision":"521ba8c26daf35890c2cd4639f6bce03","url":"assets/trending-down-DN6-lKKl.js"},{"revision":"df0cda155c211c564f71e57036ad31f1","url":"assets/trending-up-PwEI-13E.js"},{"revision":"f15987403d53f947b255dcd26a89f7f7","url":"assets/triangle-alert-DkZLNhSK.js"},{"revision":"537a14fd058e7c52992d47624b530be9","url":"assets/trophy-DVRXEZu_.js"},{"revision":"66abc34490a13fce652ceaab5bef1e33","url":"assets/user-BgwA199W.js"},{"revision":"312dc8731b14f1ace318e5a2b7d1a238","url":"assets/user-plus-DActCJZZ.js"},{"revision":"b7b417de35a408789611e1ecd5d74b5c","url":"assets/users-kvJMYKny.js"},{"revision":"e0d5b4c4219da187efafa460ec40a100","url":"assets/utils-Ge6ynrCK.js"},{"revision":"cb0d3213158e1819738bb1843f2374b6","url":"assets/wallet-hwLS0ZIW.js"},{"revision":"d0384922a8ad51015b0590ad22615fc9","url":"assets/WalletFundingPage-Clr4m13x.js"},{"revision":"416e20f066e26f187f0b71b20dff2d9a","url":"assets/youtube-DoEeR-03.js"},{"revision":"460748f8a7f9390420ccd9ca879c5609","url":"assets/zap-uGlVBDg7.js"},{"revision":"59bef1569f1e9b776c32c78ab46a6b02","url":"favicon.ico"},{"revision":"eb120b796b8c0e15d1c2cdde05e6665f","url":"index.html"},{"revision":"20502e8b9b9c03333c5ea7513a484f98","url":"q-3d.png"},{"revision":"5790fe600299aff0f9ca71bf261cce56","url":"qquest-dashboard-concept.png"},{"revision":"f78fcdcc118dcbfe3b446ec423890b64","url":"qquest-hero-bg.png"}] || []);

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
