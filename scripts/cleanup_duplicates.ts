import dotenv from 'dotenv';
import { ConvexHttpClient } from 'convex/browser';

dotenv.config({ path: '.env.local' });

const client = new ConvexHttpClient(process.env.VITE_CONVEX_URL!);

function keyFor(sub: any) {
  return `${sub.owner_id}||${sub.platform}||${sub.login_email}||${sub.renewal_date}`;
}

async function main() {
  const apply = process.argv.includes('--apply');
  console.log('Running cleanup_duplicates (dry-run by default). Use --apply to delete.');

  // Fetch all subscriptions via server query
  const allSubs: any[] = await client.query('listings.getAdminListings' as any, {});
  console.log(`Found ${allSubs.length} subscriptions.`);

  const groups: Record<string, any[]> = {};
  for (const s of allSubs) {
    const k = keyFor(s);
    (groups[k] = groups[k] || []).push(s);
  }

  const duplicatesToDelete: string[] = [];
  for (const k of Object.keys(groups)) {
    const arr = groups[k];
    if (arr.length <= 1) continue;

    // Choose one to keep: earliest created_at (if present) else first
    arr.sort((a, b) => (a.created_at || 0) - (b.created_at || 0));
    const keep = arr[0];
    const dup = arr.slice(1);
    console.log(`Key=${k} => keep=${keep._id} (${keep.login_email}) duplicates=${dup.map(d => d._id).join(',')}`);
    duplicatesToDelete.push(...dup.map(d => d._id));
  }

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

  // Delete via maintenance mutation
  console.log('Deleting duplicates...');
  const res = await client.mutation('maintenance.deleteSubscriptions' as any, { subscription_ids: duplicatesToDelete });
  console.log('Delete result:', res);
}

main().catch((err) => {
  console.error('Error running cleanup:', err);
  process.exit(1);
});
