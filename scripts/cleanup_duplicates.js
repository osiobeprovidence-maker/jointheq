import dotenv from 'dotenv';
import { ConvexHttpClient } from 'convex/browser';

dotenv.config({ path: '.env.local' });
const url = process.env.VITE_CONVEX_URL;
if (!url) {
  console.error('VITE_CONVEX_URL not set in .env.local');
  process.exit(1);
}

const client = new ConvexHttpClient(url);

function keyFor(sub) {
  return `${sub.owner_id}||${sub.platform}||${sub.login_email}||${sub.renewal_date}`;
}

(async function main() {
  const apply = process.argv.includes('--apply');
  console.log('Running cleanup_duplicates (dry-run by default). Use --apply to delete.');

  // Ask the server to compute duplicates (safer than fetching admin listings)
  const duplicatesToDelete = await client.query('maintenance:listDuplicateSubscriptions');
  console.log(`Server reported ${duplicatesToDelete.length} duplicate subscriptions.`);

  if (duplicatesToDelete.length === 0) {
    console.log('No duplicates found.');
    return;
  }

  console.log(`Found ${duplicatesToDelete.length} duplicate subscriptions.`);
  if (!apply) {
    console.log('Dry-run mode: not deleting. Run with --apply to remove duplicates.');
    console.log('Duplicate IDs:', duplicatesToDelete.join(','));
    return;
  }

  console.log('Deleting duplicates...');
  const res = await client.mutation('maintenance:deleteSubscriptions', { subscription_ids: duplicatesToDelete });
  console.log('Delete result:', res);
})().catch(err => { console.error('Error running cleanup:', err); process.exit(1); });
