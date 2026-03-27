import dotenv from 'dotenv';
import { ConvexHttpClient } from 'convex/browser';

dotenv.config({ path: '.env.local' });
const url = process.env.VITE_CONVEX_URL;
if (!url) {
  console.error('VITE_CONVEX_URL not set in .env.local');
  process.exit(1);
}

const client = new ConvexHttpClient(url);

async function main() {
  console.log('Fetching admin marketplace...');
  const marketplace = await client.query('subscriptions:getAdminMarketplace');
  console.log(`Found ${marketplace.length} groups in admin marketplace`);

  const spotifyGroups = marketplace.filter(g => (g.subscription_name || '').toLowerCase().includes('spotify') || (g.subscription_name || '').toLowerCase().includes('spotify'));
  console.log(`Spotify groups count: ${spotifyGroups.length}`);
  for (const g of spotifyGroups) {
    console.log('--- Group ---');
    console.log('group_id:', g._id);
    console.log('subscription_name:', g.subscription_name);
    console.log('account_email:', g.account_email);
    console.log('status:', g.status);
    console.log('member_count:', g.member_count);
    console.log('slot_types:', (g.slot_types || []).map((st) => ({ id: st._id, name: st.name, price: st.price, capacity: st.capacity })));
  }

  // Fetch public marketplace catalogs (what end users see)
  // Fetch public marketplace catalogs (what end users see)
  

  console.log('\nFetching public marketplace subscriptions via getActiveSubscriptions...');
  const publicSubs = await client.query('subscriptions:getActiveSubscriptions');
  const spotifyPublic = publicSubs.filter((p) => (p.name || '').toLowerCase().includes('spotify'));
  console.log(`Public subscription catalogs count: ${publicSubs.length}, Spotify catalogs: ${spotifyPublic.length}`);
  for (const p of spotifyPublic) {
    console.log('--- Public Catalog ---');
    console.log('catalog_id:', p._id);
    console.log('name:', p.name);
    console.log('is_active:', p.is_active);
    console.log('slot_types count:', (p.slot_types || []).length);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
