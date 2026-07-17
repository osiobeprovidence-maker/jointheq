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
  self.workbox.precaching.precacheAndRoute([{"revision":"88d834661055e64e0611dc9bb8d73e0f","url":"assets/activity-BdyrHxLd.js"},{"revision":"dea6ed6630c5170d2b95dc5bedf271c9","url":"assets/AdminAcceptPage-Du4Vr2PX.js"},{"revision":"d2f7346862f4d74298753d7613aa0c20","url":"assets/AdminEnhancedPage-E-ckA3UR.js"},{"revision":"23fc9415e82b9fd774c3a89b78f6844b","url":"assets/AdminListingsPage-BWA7cocx.js"},{"revision":"dd94acc011697e0e7da18b07d37aaa8e","url":"assets/AdminMigrationPage-CGat69QY.js"},{"revision":"4d39c8b46f993c4e0f1c883c32bd0a0a","url":"assets/AdminPanel-fyp2oXeW.js"},{"revision":"8e2cf8dfc6c060cbd418dce405f97008","url":"assets/AdminPaymentsPage-DKajQ6jx.js"},{"revision":"fcfd574e6fe90aebc6bb04d7a817f2bb","url":"assets/AdminRafflePage-DgevqzUN.js"},{"revision":"0f6d1ba49ef52f9da81e323a10b160b8","url":"assets/AdminShell-pShnKRis.js"},{"revision":"05f0680ff8454e2e6c926ebd75e8379c","url":"assets/api-BWVbuEZh.js"},{"revision":"99a00364ecff6edbb42e557af47f6de2","url":"assets/arrow-left-f_iuoWi_.js"},{"revision":"d208f31c486e1d4b26d5df72fced05d1","url":"assets/arrow-right-D2teiK-f.js"},{"revision":"05af2fdac2e8ff49deeffe66eb240c35","url":"assets/award-B4CX3QNU.js"},{"revision":"b01b62bb6d6aefb25fb4ac142841fd20","url":"assets/badge-dollar-sign-Be3zZqCB.js"},{"revision":"42e203844350f1174491a80e15bf6576","url":"assets/calendar-Dxf2MGEs.js"},{"revision":"f74878bef8351b50e152dc7eb7ddc089","url":"assets/CampaignPage-BVIm8FzA.js"},{"revision":"91ddfd2a2cf9bd050697ddd3cf973f08","url":"assets/CampusDashboardPage-CMXm6FCa.js"},{"revision":"0c3757b2fb3b1e646eb4e095d05e92b9","url":"assets/check-D8kV_Dr3.js"},{"revision":"17c47253423df2069687dd1cf6485b45","url":"assets/chevron-down-CMEPqitK.js"},{"revision":"013ff080ad609cbeafe9035caa3fa846","url":"assets/chevron-left-G2cdnQaO.js"},{"revision":"300985fd8efa8996ab3904352c048301","url":"assets/chevron-right-CNZ34_vK.js"},{"revision":"503ad8fdb6787e2a7de436b2ec902dd6","url":"assets/circle-alert-DeytzTVx.js"},{"revision":"8626c3908b3b8f908dd9f84c7d7ffd12","url":"assets/circle-check-big-Dgr7xoVI.js"},{"revision":"9a0ef5fd0d5f79f5a3bf8871f2c8cd3a","url":"assets/circle-check-Hoeq9p5w.js"},{"revision":"1f13817b5fcc13f0a4c61d2dd9251380","url":"assets/circle-x-CqiyLlU4.js"},{"revision":"baa5da80417953e6d3fd01a25a40c9d4","url":"assets/clock-B711rFmM.js"},{"revision":"18ee3dd585f3d8eadf7eb8cdb6b139fb","url":"assets/Console-CULiXFgI.js"},{"revision":"e7e70717aee164a37effe0e001bbf9ce","url":"assets/copy-Blqjc0tn.js"},{"revision":"dc6a6bd9d907de15660d3fb2da322805","url":"assets/credit-card-DLzUFf-H.js"},{"revision":"d407ab8fdb5b5c30a86e0733aba7ba98","url":"assets/crown-DpgOOujY.js"},{"revision":"31ff77f65534769e2700138a710aefb2","url":"assets/DashboardPage-Bhv8oxE6.js"},{"revision":"3e5e11905e5cc99572985b6c0e2f7522","url":"assets/external-link-BaIQoawp.js"},{"revision":"13911d744f8f5f3e6925c6cae01b2e45","url":"assets/eye-BQ-skBTy.js"},{"revision":"18184cb224c8bc878a1d73cf1f297844","url":"assets/eye-off-C1F9LNsl.js"},{"revision":"767625ffa13c58fbf1ca527d51eddafb","url":"assets/file-text-DjFSIvoV.js"},{"revision":"d710a4532496520514fcf9b4c15bad1d","url":"assets/funnel-Cb6ze6wQ.js"},{"revision":"43871e49b6984ee1e497dbcee62652b0","url":"assets/gift-BHNwU6lA.js"},{"revision":"88d64766c43fc3b25d90e29a789291db","url":"assets/graduation-cap-BeIOGPrz.js"},{"revision":"2873d1bef31b7f9b6509f9d4508b69db","url":"assets/GuestOnboardingPage-Cj62tFSC.js"},{"revision":"da4271672a5619810873af65434e8e25","url":"assets/handshake-12inp_Dt.js"},{"revision":"8c3be56ff4d977b4a4394f69578e8e6b","url":"assets/image-_qS7jf2R.js"},{"revision":"1153b75533c4e59fcb64be53c9aeb6ea","url":"assets/index-D5L0m8xR.js"},{"revision":"e940d024c9505159eab9bee741a9be97","url":"assets/index-DPXiS8Y_.css"},{"revision":"d69ef81f6003daf2121a45e326383a37","url":"assets/info-DRo2Ovoz.js"},{"revision":"ee1cf2fc32abd100ed57b9478ec24bd1","url":"assets/LandingPage-BtShSNak.js"},{"revision":"1ae8a272b3f0c75736eb75e613986f4e","url":"assets/layout-dashboard-1erW9uFs.js"},{"revision":"40be998b17192d6ff64ae3361f02f146","url":"assets/link-2-FkrbHccg.js"},{"revision":"10d5fd4e8f8ecfcc68897baf75a2b41b","url":"assets/ListSubscriptionPage-BITZQAru.js"},{"revision":"9937c7f24b9b96f7c48ffeaf2d0f2a06","url":"assets/loader-circle-C4hhmLRc.js"},{"revision":"ed9c62bcd588eedc0a9aa20a71d7988d","url":"assets/lock-CB11tRye.js"},{"revision":"7ff7726f13aa3d39b97c35a84e7d21f4","url":"assets/Logo-Ds3QmWy4.js"},{"revision":"4575e873076b8ab506a9f60b0ac1549f","url":"assets/mail-3kYMa3bc.js"},{"revision":"f68eff7899556df572ccc765dbd222d3","url":"assets/MainLayout-B_oJvDtG.js"},{"revision":"a7fe76cba13c94b99ec3d8c16fc74222","url":"assets/medal--1K5SuiS.js"},{"revision":"e71090d176572598bf0b9417d07a30af","url":"assets/message-circle-iUFxTmqk.js"},{"revision":"8db4337309f4bfaefeba310e09cf4ca2","url":"assets/OwnerEarningsPage-hbIa20Ti.js"},{"revision":"043d98800982577650ef24f412bf7323","url":"assets/PartnerLoginPage-BHYHv1qa.js"},{"revision":"fda3cf801b026980eadaa03bc02856d6","url":"assets/phone-KYBh9F1V.js"},{"revision":"eae0587ddb25a3fc81380a01f3dc69d6","url":"assets/QHubPage-DjTmrAY4.js"},{"revision":"c4e92700c1ed55910b22490b03884139","url":"assets/RafflePage-BkfCoz2T.js"},{"revision":"0f7c0ee8377b942426f82098d380596c","url":"assets/ReferralsPage-BNKxAT-I.js"},{"revision":"d1f82fe668fec2e31c153d7c1aeefb67","url":"assets/RegisterPage-IGMxwkAg.js"},{"revision":"a083a228bd672d3af653e4355d0c688d","url":"assets/RewardsPage-ChD89wXn.js"},{"revision":"a957a6c6a65baaed59dc870f5b984d23","url":"assets/search-pB63Gbb_.js"},{"revision":"a10b1f7f682b09cbb1469ac2b90041ee","url":"assets/send-DCkcAwU1.js"},{"revision":"c5104ba072727284106026fd526be4f9","url":"assets/settings-BvSuJ3or.js"},{"revision":"52bca6a3a3abb905398656510ce654e4","url":"assets/share-2-k46kNj63.js"},{"revision":"916b675bc6aeecd232e390a5080aec18","url":"assets/shield-check-aIZA0FG3.js"},{"revision":"56eda28e3eb448d4aefd489b6b8eaa3d","url":"assets/shield-DJy9ez_S.js"},{"revision":"d714ebfa583a1f4d7a90f270d21eccc1","url":"assets/shopping-bag-DV5s4Lde.js"},{"revision":"88d66f507db78dc16bbc804cf489619a","url":"assets/smartphone-DJ02K19x.js"},{"revision":"f7945bac110e1ba158a2c3b54963fa91","url":"assets/sparkles-da_FJMcE.js"},{"revision":"b038a33807a8721fa4df5833f51eec9b","url":"assets/star-CGmIqF5u.js"},{"revision":"c6db2675eb7b86431c67283993d649be","url":"assets/storage-C4_C7djb.js"},{"revision":"dbb931752de86dd1250e1981b321a10c","url":"assets/tag-CaZHaiNK.js"},{"revision":"51f0b813f3e698ebefb013f8678dbcd0","url":"assets/target-7Js1c715.js"},{"revision":"fc390d1267d9386de65fcce3dbec6432","url":"assets/ticket-C28fNXcD.js"},{"revision":"9dc80b73fd90bbfc323fa362088af836","url":"assets/trash-2-CSUmRRzz.js"},{"revision":"8b947fdf8d96c032aba39dbbb7bc7e65","url":"assets/trending-down-BzbF47ld.js"},{"revision":"e384e642224ee9fd11d10dc6b64e2166","url":"assets/trending-up-DjwQWbPf.js"},{"revision":"50622b5d8601a4d5bcf3d3cecb223028","url":"assets/triangle-alert-C4_4e1xl.js"},{"revision":"5bd6933b796cc263b02dc74851d76016","url":"assets/trophy-CRqbrDDm.js"},{"revision":"e6d79a642848986b729b85c3d009bc5c","url":"assets/user-plus-BfEwiOsr.js"},{"revision":"bfa5eceaaf0ed0a5f1e03a9a21d25eca","url":"assets/user-ULUB4Yxn.js"},{"revision":"248ce157d1834a8a724251393f45a3e5","url":"assets/users-Dcyvxbt0.js"},{"revision":"0044de74417d685b44c2bfd2f7a253fa","url":"assets/utils-DOxTVxcJ.js"},{"revision":"f50fddae00894649f6364825a6918855","url":"assets/wallet-XArRQGbg.js"},{"revision":"4fe58f1edad7ba59d09c2bd61677fac2","url":"assets/WalletFundingPage-B1M5-nC5.js"},{"revision":"7568a5a248a0648f15f263a6e9047638","url":"assets/youtube-CPfBfhZO.js"},{"revision":"2802dbf1e45d933ffd27b76f34ebca39","url":"assets/zap-CK2V2X2J.js"},{"revision":"59bef1569f1e9b776c32c78ab46a6b02","url":"favicon.ico"},{"revision":"069f813015cc09f49b85aec95cb579ee","url":"index.html"},{"revision":"20502e8b9b9c03333c5ea7513a484f98","url":"q-3d.png"},{"revision":"5790fe600299aff0f9ca71bf261cce56","url":"qquest-dashboard-concept.png"},{"revision":"f78fcdcc118dcbfe3b446ec423890b64","url":"qquest-hero-bg.png"}] || []);

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
