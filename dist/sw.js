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
  self.workbox.precaching.precacheAndRoute([{"revision":"60c443e9841427872597eb79b8f913c5","url":"assets/activity-BG7IV-OD.js"},{"revision":"720238abeccfc5b7de997ec2c6850c3f","url":"assets/AdminAcceptPage-zDBIIfg_.js"},{"revision":"7636ee60fab4760925f3e24bb764bbe5","url":"assets/AdminEnhancedPage-C1bGQLiX.js"},{"revision":"66b31afd322f6cd22944dce6adf228bc","url":"assets/AdminListingsPage-O-Itol8R.js"},{"revision":"bb0e256badcf1f19954428d5794789ca","url":"assets/AdminMigrationPage-BoA5Pyui.js"},{"revision":"06cdcf8b05f4ac08d66ade6decc744f0","url":"assets/AdminPanel-Dk3BTjbh.js"},{"revision":"74d52551d05a360bb5d6d3c693629b41","url":"assets/AdminPaymentsPage-Ccm_AHqI.js"},{"revision":"20ec99ae50ac3ed2f4e5cfa7501ef6f0","url":"assets/AdminRafflePage-DXcDmL2h.js"},{"revision":"0a1afeac313c5f2ad11beacbb79e26c2","url":"assets/AdminShell-DVALWkDQ.js"},{"revision":"273a4bddf5b8bd3657567404705e4faa","url":"assets/api-CRdTlqSS.js"},{"revision":"457e84620024effb26486b5d72e19fbb","url":"assets/arrow-left-DsnT_vku.js"},{"revision":"63b6cec4b41529f8ecff4fbc9984cce5","url":"assets/arrow-right-Oc9vXA-T.js"},{"revision":"3714abcc185b8f5020ca8c1d120aebdf","url":"assets/award-DBPZdHz3.js"},{"revision":"672f480f7d431d194ca15bf4440f9c45","url":"assets/badge-dollar-sign-DjdU-hgE.js"},{"revision":"a877370ea5adf4fcc589609a6900833d","url":"assets/book-open-Dw7p4EAY.js"},{"revision":"13a06731f686dd803106899874f3feb1","url":"assets/calendar-BTdefb6n.js"},{"revision":"7f2d54c3e74a3d8a9cca6e39a3fbd97d","url":"assets/CampaignPage-DoW06v9U.js"},{"revision":"ed8eba15f7029ed8065b7e413cb49d6a","url":"assets/CampusDashboardPage-C5SXM7_n.js"},{"revision":"2d5e5ae6e2d1705306c3695329ac6847","url":"assets/check-EZaRuH5y.js"},{"revision":"15a0dafaf8c3386b9690422e04775636","url":"assets/chevron-left-BVC9ihmD.js"},{"revision":"8eddd3314e330c7628197964a2db4104","url":"assets/chevron-right-BA_Oiw1K.js"},{"revision":"7423b9c38a9b915067f7d78455224d03","url":"assets/circle-alert-B6myLYId.js"},{"revision":"0e6a4647ce63c73b71ce96cb3effdc26","url":"assets/circle-check-BgrdsEbY.js"},{"revision":"2ed23200ca9fa4a886fa2c21a4ae4be3","url":"assets/circle-check-big-B1C3Z9Lf.js"},{"revision":"561e8d761f42738f5222fc9edfcb2974","url":"assets/circle-x-DaXkqS-H.js"},{"revision":"d234730edfc5a5ef42ac80b446f307d7","url":"assets/clock-BLDpeBEp.js"},{"revision":"67ff76144136d08310a3f6a6e43dcb00","url":"assets/Console-DrKav36W.js"},{"revision":"ccd2b25cdb459f70c782552ad418b254","url":"assets/copy-uwzk0oNQ.js"},{"revision":"d4080cee7d96fdf743837dba8b3f0634","url":"assets/credit-card-SMMAnCk1.js"},{"revision":"5db356c47d60f4b481fd286783776e3e","url":"assets/crown-jW1E6xna.js"},{"revision":"d262dcfe4a2f6211c178c656f77ee66d","url":"assets/DashboardPage-BDiWYfRp.js"},{"revision":"be8e98673ecd94638ae98954a6992f78","url":"assets/external-link-Brhk8LPE.js"},{"revision":"9134576da4e1d85640d5d51492f5702f","url":"assets/eye-off-DCxV4IQ1.js"},{"revision":"0b2bfc2bc8ab4e9132e74ff20de2f36f","url":"assets/eye-TgIo1GoJ.js"},{"revision":"d34aff3868903ffbb3a8761c8be5236b","url":"assets/file-text-Cr_YDKP0.js"},{"revision":"54a92e44e7c74fa8ab0a3b7f4de44ffb","url":"assets/funnel-Becknw9q.js"},{"revision":"a8dda4194ac5d20493e77d0a1af57e21","url":"assets/gift-DOJUJOoh.js"},{"revision":"af86cf3e148ed0038984c347cba2723a","url":"assets/graduation-cap-DB3ymeBS.js"},{"revision":"306a666cabd9a6a182879a9739b3df4d","url":"assets/GuestOnboardingPage-DJY9M4HS.js"},{"revision":"198086cd753854463db477f91a60a158","url":"assets/handshake-H_bJW9d9.js"},{"revision":"860852b792340e5779dd4e5d21986bd1","url":"assets/image-DTZBa7F7.js"},{"revision":"68e228d1ab552d25f053ca94a3f4d772","url":"assets/index-BBQ6gOTp.css"},{"revision":"9a1a0eb6cb67df2dc82f899b111d7f67","url":"assets/index-Djd-KCS6.js"},{"revision":"7d323716e63a368b1f3115286db844ab","url":"assets/LandingPage-8b5iy3sc.js"},{"revision":"68ede8a538dd02857329c11c7c95084a","url":"assets/layout-dashboard-C5pCZHWN.js"},{"revision":"0c3572318d94d663ff931bb98816d39f","url":"assets/link-2-BqnBGbsX.js"},{"revision":"7a64ce4d00ec4cc8c6c2c356cbcc905f","url":"assets/ListSubscriptionPage-_Dtx6u98.js"},{"revision":"caa8fa4bb1c3fb6b41f589a91892c779","url":"assets/loader-circle-C10EKVMt.js"},{"revision":"46d0ac6f8bdc87a2dc5b161447de237d","url":"assets/lock-P2eJdUtx.js"},{"revision":"e09e8c99fef587e5b1bbc2ff28ea8aca","url":"assets/log-out-BJpjsM1A.js"},{"revision":"439525e45707b271b9e7c3ccbe37fbf9","url":"assets/Logo-BTUqWWL1.js"},{"revision":"7b3fcdea8dfc6e9342e9ae304e4f41f5","url":"assets/mail-qujPJD-Y.js"},{"revision":"ca3277e0ec9c78721c380a36fcec958a","url":"assets/MainLayout-HaC3amkf.js"},{"revision":"56ca89b46e09dc72f5e5375022c14513","url":"assets/medal-SAOMffx7.js"},{"revision":"2c6db80bff906a2b6d7f1bdf0c57a306","url":"assets/OwnerEarningsPage-igNHoCIr.js"},{"revision":"d7997be9eaef990a0b7af480438e941f","url":"assets/PartnerLoginPage-C8tVu73E.js"},{"revision":"130166f35d88b55ca598fd2a8d285653","url":"assets/phone-D7MqnLyD.js"},{"revision":"01e2328b96131dff29f2b3a4b0fe649b","url":"assets/QHubPage-DXfimR4d.js"},{"revision":"e30689a2c2f16a58f0de6266bc87015e","url":"assets/qr-code-B_-n1tXP.js"},{"revision":"1e8979dcd18b2612a15bbdddfc70eb97","url":"assets/RafflePage-B4l6_350.js"},{"revision":"32ee3e26317dd2c41bbb0b2a2ccc6540","url":"assets/ReferralsPage-D7Ru9wu_.js"},{"revision":"257de93e62cb5ba62c43f358088c5714","url":"assets/RegisterPage-CWO5fxs2.js"},{"revision":"d6e9aa95aa4fff89f31aa29d44bd9a44","url":"assets/RewardsPage-C3CqvB7w.js"},{"revision":"d7e0dd8beddbf218b1f99ee4059778e0","url":"assets/search-DMD45pvD.js"},{"revision":"1dd813308ff8d9715f3d39e2de4b8b8d","url":"assets/send-BcNrsyp0.js"},{"revision":"038143e30349d12036df2f2be286d63d","url":"assets/settings-Cfn8Ygg6.js"},{"revision":"94dd8af00ac9e94bcfa944370431acf1","url":"assets/share-2-DE2kmucJ.js"},{"revision":"0e748fd8000781440624cef3c9ff2540","url":"assets/shield-check-C51zro-z.js"},{"revision":"8ddbf27e88c65734c9ce62051557185e","url":"assets/shield-J1IQU0D1.js"},{"revision":"3cd1452cab3cac3afd92b038d0d68943","url":"assets/shopping-bag-DogKRxAf.js"},{"revision":"fefeb326b504cbbbb064add010146db7","url":"assets/smartphone-CuV_uObg.js"},{"revision":"711693d708ed992ae54469dc90a1448b","url":"assets/sparkles-DBWcY10d.js"},{"revision":"9fa4fc0e68e20ca6d912935dce8e6b5e","url":"assets/star-CnzqDeey.js"},{"revision":"8d5a9dcc231d389d0a5a24da609de898","url":"assets/storage-opKsqITf.js"},{"revision":"b0256426c4f637fcd4172a9bfd4bf392","url":"assets/tag-BikMcj-D.js"},{"revision":"b42842360697fe5f803d289276095608","url":"assets/target-DhiRMSGy.js"},{"revision":"2f563e3f11950832448152d38735748a","url":"assets/ticket-DuCrD5E3.js"},{"revision":"fccf8e8ee99ffcc0793907e0f5d63f10","url":"assets/trash-2-BL4ChdBU.js"},{"revision":"cb9364c81d5393e15548157f30e84b90","url":"assets/trending-down-BFHwgDQB.js"},{"revision":"e182b0b14f48df436859af4084e0606e","url":"assets/trending-up-Cwun9kY5.js"},{"revision":"a8ef7f080cfbe8b52c04561c9c2d4509","url":"assets/triangle-alert-BfRMvRFs.js"},{"revision":"3f939e2f653d77195ac65351f0e8bc3b","url":"assets/trophy-Bwci15Z3.js"},{"revision":"7c78fcabbb2f38ca411800c90588d05a","url":"assets/twitter-D8aHv386.js"},{"revision":"734e2ac10b5a2dc47c0621af9e7a7e62","url":"assets/user-iZJgn58w.js"},{"revision":"2f5c2e7afe5d048e233f18feac15f092","url":"assets/user-plus-D3heVa0d.js"},{"revision":"f7098da421d34329af223e951a9b085f","url":"assets/users-BanZ6P8Z.js"},{"revision":"b2cd771d4f5058daec0590d7c7e33825","url":"assets/utils-CSL1y4Wg.js"},{"revision":"ae19ebba2413cd74758528ce8adefef1","url":"assets/wallet-C0x3C1uB.js"},{"revision":"d5a56a49ea578ab2209a2cc9fbde469c","url":"assets/WalletFundingPage-BzT2l2Fs.js"},{"revision":"fe27412ec38e537029e26a9642c8f961","url":"assets/youtube-CQxgmDEP.js"},{"revision":"c53ce71d14964cee467965c91e158796","url":"assets/zap-CnHkDCoH.js"},{"revision":"59bef1569f1e9b776c32c78ab46a6b02","url":"favicon.ico"},{"revision":"7e4de72c1a2befac431b960ca9670822","url":"index.html"},{"revision":"20502e8b9b9c03333c5ea7513a484f98","url":"q-3d.png"},{"revision":"5790fe600299aff0f9ca71bf261cce56","url":"qquest-dashboard-concept.png"},{"revision":"f78fcdcc118dcbfe3b446ec423890b64","url":"qquest-hero-bg.png"}] || []);

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
