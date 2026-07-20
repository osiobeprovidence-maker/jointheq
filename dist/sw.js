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
  self.workbox.precaching.precacheAndRoute([{"revision":"b8ee97048593ce8edb0dac12f2087d45","url":"assets/activity-C-IM4SRS.js"},{"revision":"3e6f31f8e6dd00feb4d8a6fa16fd5264","url":"assets/AdminAcceptPage-j--O7Kwb.js"},{"revision":"5f963569b865d566445cbba4e94aafc8","url":"assets/AdminEnhancedPage-BKD_lanN.js"},{"revision":"17f2cd81605fd7e4886cb0a3deeaca57","url":"assets/AdminListingsPage-7mHDMFk_.js"},{"revision":"8758c66b1bc8f641d7147efe578cecb9","url":"assets/AdminMigrationPage-DmiHzWaJ.js"},{"revision":"e8d687c649a3302a21604e9486c19493","url":"assets/AdminPanel-Cn29kMP8.js"},{"revision":"6ba8ce95ab18cda53c7b2cebadc71710","url":"assets/AdminPaymentsPage-Dr22yICj.js"},{"revision":"52840205bda7558c301a1ce9eb0a4abe","url":"assets/AdminRafflePage-BBo9SX7J.js"},{"revision":"f7f078aeca51d0795bd97c4fa10a8878","url":"assets/AdminShell-CD6uGgKi.js"},{"revision":"4ff8065e5d7490af6714cfe59e78c567","url":"assets/api-3oToZaNH.js"},{"revision":"47a025dcb841e0ec7efb61c78e6cabe7","url":"assets/arrow-left-AHWGKoeI.js"},{"revision":"45fa56bd31d26fa5bba6dd47da8141cf","url":"assets/arrow-right-DH0BVoaC.js"},{"revision":"20f36d83b2af899d0714f1399a59886a","url":"assets/award-BbxaCiNH.js"},{"revision":"634491bdad9b70502e7f1310db99771f","url":"assets/badge-dollar-sign-CjDf_7rb.js"},{"revision":"e09ffa809b4f7ec3868ac945c500e8f3","url":"assets/book-open-CIvlBeJV.js"},{"revision":"6d44958a290a6f53cadb7d9c4d0c6641","url":"assets/calendar-CcckblhZ.js"},{"revision":"d0798dafa935400fc0c7b18fe5c21542","url":"assets/CampaignPage-dWcI0oT8.js"},{"revision":"c33d713c9dd5ef9a2b9c57d7b8020134","url":"assets/CampusDashboardPage-ZO_NeY2M.js"},{"revision":"60212f2d42b4f732f4dcdad4d3b3bb27","url":"assets/check-DvCssEXN.js"},{"revision":"287231fbbc2b822a844f8a16217acfe2","url":"assets/chevron-left-ByZWHRSL.js"},{"revision":"ac1d3ffffb7f43f4306ab577d2fce761","url":"assets/chevron-right-r7zcxSEc.js"},{"revision":"51dd6ad2604e2b11bda9e8e0cf35e322","url":"assets/circle-alert-CIptXMB2.js"},{"revision":"bea71e0b9e8e90e9bc94c51bd1bc775c","url":"assets/circle-check-big-lQ0UsC1r.js"},{"revision":"92fb92d69b7d9a44704ad360910385aa","url":"assets/circle-check-BnlLfaXg.js"},{"revision":"27ddbfe85c1c0e65b194f219ee3e04bb","url":"assets/circle-x-B3LsUSQx.js"},{"revision":"eb0c53235ded76d530316852a7046fc2","url":"assets/clock-DFI50NV4.js"},{"revision":"1dbfefb5b304cd87156b46581c64b3c1","url":"assets/Console-CYkE-Iib.js"},{"revision":"d4a7008fd20591472d964fd156208e85","url":"assets/copy-B_ln54qu.js"},{"revision":"eb3f0ec3764babe3bcf4c1571f1d15f7","url":"assets/credit-card-D4kD0kN1.js"},{"revision":"987562d832584ba059d9e770b6c7a7a5","url":"assets/crown-T2Jogtwm.js"},{"revision":"4f254045eca739e6058ced80633da5cd","url":"assets/DashboardPage-BZSYxq__.js"},{"revision":"8d3ca8508f79752adbbf9d14629431b2","url":"assets/external-link-CWuJ2enC.js"},{"revision":"52a32ae635f7f8749ec0693f7b6391c7","url":"assets/eye-CILpha5U.js"},{"revision":"a90a9d069b4b144e3871fa0c3a7940bf","url":"assets/eye-off-Choq4djB.js"},{"revision":"26342ac7760acf79370fb1cf84ee1b90","url":"assets/file-text-ORndcNYg.js"},{"revision":"5178331040fa9f6abb748009d34d8d19","url":"assets/funnel-Bf-U6a_m.js"},{"revision":"0f13c7f97d4257ca5c086a7524044405","url":"assets/gift-L7J_3bkp.js"},{"revision":"5bf1819618e12e0f0b9c42064d51eea3","url":"assets/graduation-cap-cdKbaEXX.js"},{"revision":"0af67dcd1fb00399835ff007be7913f2","url":"assets/GuestOnboardingPage-Plb7E-WC.js"},{"revision":"753bcfad3af5cbe784880d25820ac151","url":"assets/handshake-BH7DoA3n.js"},{"revision":"788b43225defe6a5c00d5277a4a62422","url":"assets/image-C9JZYH3y.js"},{"revision":"987d665cc5eb78ac2df9085c598b4cbe","url":"assets/index-Bp86mZia.js"},{"revision":"7542b4697fcae42df49d89e63b92e8d3","url":"assets/index-C2IzPhVw.css"},{"revision":"39d73ae9595fc7c48be75ddd54447931","url":"assets/info-CS36F-Hb.js"},{"revision":"58d060d67bd9458424e98c18d16471f4","url":"assets/LandingPage-knyBl8YT.js"},{"revision":"7cf5ae1f2606347577ceb6bf080278f4","url":"assets/layout-dashboard-VvGnhsxr.js"},{"revision":"6a570c6cf635b96216f20e0c639b9d39","url":"assets/link-2-CT1UafDu.js"},{"revision":"70612372d5d7de0e81c87d69ae6afc4b","url":"assets/ListSubscriptionPage-DDZC2KKs.js"},{"revision":"b1d96e0d58b5af4d42753c5f70c2859d","url":"assets/loader-circle-DMyXGG2C.js"},{"revision":"6ffddc85feff62c30336cc46c37e2fa2","url":"assets/lock-BvjKZ4Ux.js"},{"revision":"4a6dc997147c912272ce1aaba5b1f416","url":"assets/log-out-D6zZEqHh.js"},{"revision":"1dc08bd662395e685a1ad7f45b640bee","url":"assets/Logo-Bl6-JBjX.js"},{"revision":"c2ed56627a942d534d4844951db94762","url":"assets/mail-2cpANfIS.js"},{"revision":"d3f946d3d7cdf3a0f4b7461d1bb726a0","url":"assets/MainLayout-MAjMnUt_.js"},{"revision":"65ef264a5a4982057baf47e45c3a1cee","url":"assets/medal-B0bcPv1M.js"},{"revision":"636f7488e91f54337c0c2e0bcd0a7c25","url":"assets/OwnerEarningsPage-DrfLfnxV.js"},{"revision":"dc127c0bc930dde990c7c26ca4be2c66","url":"assets/PartnerLoginPage-CM2hqe7T.js"},{"revision":"9adf772848ae0086d5808817d80b9c8b","url":"assets/phone-64XdfXw6.js"},{"revision":"b935897b7afabd0337531521b0e11c1b","url":"assets/QHubPage-CU2GLvYq.js"},{"revision":"d190366139797eff53980ec16ea6ac53","url":"assets/RafflePage-n0_mAl3z.js"},{"revision":"f77c9e9e0505ce3072f6671a9e476d80","url":"assets/ReferralsPage-D3tQGZOm.js"},{"revision":"a1d4dcf3646e4e1d0e39434ecec66ed8","url":"assets/RegisterPage-CjtCd_JN.js"},{"revision":"91425eb2399af647c9c091debaa710da","url":"assets/RewardsPage-D1Wd-GLq.js"},{"revision":"3990c83d740cc8e7bedf81f58b7f500b","url":"assets/search-B3ObZbuj.js"},{"revision":"1e8b5d9854d3f650b30a18f183db4839","url":"assets/send-gEgw_GTe.js"},{"revision":"b165b0d72e291e211c49fbcdb370f316","url":"assets/settings-Cwk81m7M.js"},{"revision":"a541ae2aea978d4cc79d634a7d1d6cc0","url":"assets/share-2-BgNFb5In.js"},{"revision":"200ab83a25598dbcc7268bba193caab6","url":"assets/shield-C4WdBdkt.js"},{"revision":"86cc236078bbc086c51b995722de32f2","url":"assets/shield-check-D0q5ACsv.js"},{"revision":"e1a75e11fd5f711d7e849bcf57877a4f","url":"assets/shopping-bag-ZM7Tz4bp.js"},{"revision":"db3b2c9ae2d3d3864ebf48ad59be2322","url":"assets/smartphone-D-Gvtodm.js"},{"revision":"e5f012da7560f7e0743caa57a57f7c50","url":"assets/sparkles-I2ftY1gg.js"},{"revision":"a577991af8297ad22e2feb589c386d01","url":"assets/star-CjeZFKvo.js"},{"revision":"f254d7f816d6b9a3f4822dd115638fff","url":"assets/storage-u0Dfe9_Y.js"},{"revision":"0c18786e4bdcb622dc74ea8143e46ecf","url":"assets/tag-BUodIZ-B.js"},{"revision":"ca947c984cad073690851fc465e5238c","url":"assets/target-9XMdTy8F.js"},{"revision":"f197042a3789c447f56812a1f9cac3fb","url":"assets/ticket-cNu56Stg.js"},{"revision":"61c5a46f15ab224f76ab3d37c92d4466","url":"assets/trash-2-Y-S1e8ox.js"},{"revision":"9f488b5977cb9fa164145f53092eb1ba","url":"assets/trending-down-DD0CqiSQ.js"},{"revision":"7da88bc04e1de18e36281a572917e4e8","url":"assets/trending-up-DQUrWLnx.js"},{"revision":"9ebf36f3d8b853e2783c3820eabc6e70","url":"assets/triangle-alert-CZnSp7PY.js"},{"revision":"32e142e8b008ea0b2c63668456c39366","url":"assets/trophy-Di-30Z8C.js"},{"revision":"f5f0ccb6601dbf3834fd01cbec5728e2","url":"assets/twitter-C_4CE8C2.js"},{"revision":"3307c848327840dc533cc8b82b99f610","url":"assets/user-By95Z6bi.js"},{"revision":"4dd3c8ed172688d81a731cb871dcc2cf","url":"assets/user-plus-CVX6Iw2v.js"},{"revision":"ff8bfbb0338df86018225b74017a15ba","url":"assets/users-BU6D3XeJ.js"},{"revision":"4f25e6cec9f729d8e5af21bcce9ba046","url":"assets/utils-Cqmww_DQ.js"},{"revision":"740a76ec1f1cb04d8b738afcb50be2d8","url":"assets/wallet-DOqiMUgh.js"},{"revision":"73ad18935f2980530d528a78381ee381","url":"assets/WalletFundingPage-DCw5fC1x.js"},{"revision":"aa21b2d4fff1f2cc93056e456c0d5767","url":"assets/youtube-DtMLCGR1.js"},{"revision":"7b25390e8ce846b7a47d00a2f3f13065","url":"assets/zap-CzYv7HNP.js"},{"revision":"59bef1569f1e9b776c32c78ab46a6b02","url":"favicon.ico"},{"revision":"d82994a23bfd29071118763b63f304f2","url":"index.html"},{"revision":"20502e8b9b9c03333c5ea7513a484f98","url":"q-3d.png"},{"revision":"5790fe600299aff0f9ca71bf261cce56","url":"qquest-dashboard-concept.png"},{"revision":"f78fcdcc118dcbfe3b446ec423890b64","url":"qquest-hero-bg.png"}] || []);

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
