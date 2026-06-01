# Queue Marketplace & Admin Queue Management System - Implementation Guide

## Overview

This implementation provides a complete Queue Marketplace system where:
- **Admins** create subscription queues with dynamic pricing that decreases as members join
- **Users** discover and join queues to save money through group buying
- **Pricing** automatically recalculates in real-time based on member count
- **Invitations** allow admins to invite specific users with notifications
- **Analytics** provide admins with detailed queue performance metrics

---

## File Structure

### Backend (Convex)

**Schema Updates** (`convex/schema.ts`):
- `queues` - Main queue records with pricing and capacity
- `queue_members` - Track queue membership with approval status
- `queue_invitations` - Invitation records with expiration
- `queue_announcements` - Admin announcements to queue members

**API Functions** (`convex/queues.ts`):
- Queries: `getActiveQueues`, `getQueueDetails`, `getAdminQueues`, `getUserQueues`, `getPendingInvitations`
- Mutations: `createQueue`, `updateQueue`, `joinQueue`, `approveMember`, `rejectMember`, `leaveQueue`, `sendQueueInvitation`, `acceptInvitation`, `declineInvitation`, `sendQueueAnnouncement`, `closeQueue`

### Frontend (React)

**Admin Components**:
- `src/components/admin/AdminQueueManagement.tsx` - Create and manage queues
- `src/pages/AdminQueueAnalytics.tsx` - Analytics dashboard

**User Pages**:
- `src/pages/QueueMarketplace.tsx` - Browse and join queues
- `src/pages/QueueDetailsPage.tsx` - Detailed queue information
- `src/pages/InviteCenter.tsx` - Manage invitations
- `src/components/queues/QueueDashboard.tsx` - User's joined queues

---

## Integration Steps

### Step 1: Deploy Database Schema

The queue tables have been added to `convex/schema.ts`. Deploy to Convex:

```bash
npm run convex deploy
```

### Step 2: Add Routes to Your Router

Update your routing file (likely `src/App.tsx` or `src/Router.tsx`):

```typescript
import QueueMarketplace from "@/pages/QueueMarketplace";
import QueueDetailsPage from "@/pages/QueueDetailsPage";
import InviteCenter from "@/pages/InviteCenter";
import QueueDashboard from "@/components/queues/QueueDashboard";
import AdminQueueManagement from "@/components/admin/AdminQueueManagement";
import AdminQueueAnalytics from "@/pages/AdminQueueAnalytics";

// Add these routes:
<Route path="/queues/marketplace" element={<QueueMarketplace userId={userId} />} />
<Route path="/queues/:queueId" element={<QueueDetailsPage queueId={queueId} userId={userId} />} />
<Route path="/invites" element={<InviteCenter userId={userId} />} />
<Route path="/dashboard/queues" element={<QueueDashboard userId={userId} />} />
<Route path="/admin/queues" element={<AdminQueueManagement adminId={adminId} />} />
<Route path="/admin/queues/analytics" element={<AdminQueueAnalytics adminId={adminId} />} />
```

### Step 3: Add Navigation Links

Update your main navigation to include:

```typescript
// For Users
- "Queue Marketplace" → /queues/marketplace
- "My Queues" → /dashboard/queues
- "Invites" (with badge) → /invites

// For Admins
- "Queue Management" → /admin/queues
- "Queue Analytics" → /admin/queues/analytics
```

### Step 4: Add Notification Badges

Update your notification/header component to show:

```typescript
// Pending invitations count badge
const pendingCount = useQuery(api.queues.getPendingInvitations, { userId })?.length || 0;

// Show badge on Invites link
<Link to="/invites">
  Invites
  {pendingCount > 0 && <Badge>{pendingCount}</Badge>}
</Link>
```

---

## Dynamic Pricing Engine

### How It Works

The core pricing logic recalculates whenever membership changes:

```
Current Price Per Member = Total Subscription Cost ÷ Current Approved Members
```

### Example: ChatGPT Team for ₦20,000

```
1 member  → ₦20,000 each
2 members → ₦10,000 each
3 members → ₦6,667 each
4 members → ₦5,000 each (FULL)
```

### Real-Time Updates

When a member is approved:
1. Recalculate: `new_price = total_cost / new_member_count`
2. Update queue record: `current_members`, `current_price_per_member`, `status`
3. All open pages see price update instantly (Convex subscriptions)
4. Members notified of price change

---

## Member Approval Workflow

### States

**Pending** → Awaiting admin review
**Approved** → Active member, price now calculated including this member
**Rejected** → User notified, can request again later
**Left** → User manually left queue, pricing recalculated

### Admin Approval Checklist

In `AdminQueueManagement.tsx`:
1. View pending members for each queue
2. Click "Approve" to accept and trigger pricing recalculation
3. Click "Reject" to decline membership
4. See real-time member count and new pricing

---

## Invitation System

### Sending Invitations

Admin can invite specific users (from `AdminQueueManagement.tsx`):

```typescript
await sendQueueInvitation({
  queueId,
  senderId: adminId,
  recipientId: userId,
  message: "Join our ChatGPT queue!"
});
```

### Invitation Flow

1. **Created** - Invitation sent with 7-day expiration
2. **Notification** - In-app notification + email (if verified)
3. **Invite Center** - User sees invitation in `/invites`
4. **Accept** - User automatically added as approved member
5. **Declined** - User rejects invitation
6. **Expired** - After 7 days with no action

### Invitation Statuses

- `pending` - Waiting for user response
- `accepted` - User joined queue
- `declined` - User rejected
- `expired` - 7 days passed

---

## Queue Status Lifecycle

```
ACTIVE
  ↓ (when full)
FULL (ready for payment)
  ↓ (closed by admin or automatically)
CLOSED (no more actions)
```

### Status-Specific Behaviors

| Status | Can Join? | Can Leave? | Can Invite? | Show in Marketplace? |
|--------|-----------|-----------|------------|-------------------|
| Active | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| Full | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes (info only) |
| Closed | ❌ No | ❌ No | ❌ No | ❌ No |

---

## User Scenarios

### Scenario 1: User Joins a Queue

1. User browses marketplace (`/queues/marketplace`)
2. Sees ChatGPT Team: 2/4 members, ₦10,000 per member
3. Clicks "Join Queue"
4. Status: **Pending** (admin review needed)
5. Admin approves → User becomes **Approved** member
6. Price now: ₦6,667 (3/4 members)
7. All active pages update in real-time

### Scenario 2: User Receives Invitation

1. Admin sends invitation with message
2. User gets in-app notification
3. User checks `/invites` page
4. Clicks "Accept" in Invite Center
5. User automatically added as approved member
6. Can now see in `/dashboard/queues`

### Scenario 3: User Leaves Queue

1. User in `/dashboard/queues` clicks "Leave Queue"
2. Confirmation dialog shown
3. User removed as member
4. Pricing recalculates for remaining members
5. If was member #4, new price becomes ₦6,667 (3 members)

---

## Admin Scenarios

### Scenario 1: Create Queue

1. Go to `/admin/queues`
2. Click "Create Queue" tab
3. Fill details:
   - Service Name
   - Description
   - Category
   - Service Image URL
   - Total Cost (₦20,000)
   - Max Members (4)
   - Closing Date
   - Visibility Toggle
4. Click "Create Queue"
5. Queue goes live in marketplace

### Scenario 2: Manage Members

1. Go to `/admin/queues`
2. Click "View & Manage Members" on queue
3. See pending approvals
4. Approve: User added as member, pricing recalculated
5. Reject: User notified, removed from queue

### Scenario 3: Send Announcement

1. Go to `/admin/queues`
2. Click queue > "Send Announcement"
3. Enter title and message
4. All queue members get notification

### Scenario 4: Analytics

1. Go to `/admin/queues/analytics`
2. See:
   - Total queues and active queues
   - Total members joined
   - Conversion rate
   - Average fill rate
   - Pending approvals
   - Queues closing soon

---

## Real-Time Features

All components use Convex queries which update automatically:

```typescript
// Marketplace prices update as members join
const queues = useQuery(api.queues.getActiveQueues);

// Admin sees updated member counts in real-time
const queues = useQuery(api.queues.getAdminQueues, { adminId });

// User's join queue status updates when admin approves
const userQueues = useQuery(api.queues.getUserQueues, { userId });

// Invitations appear instantly
const invitations = useQuery(api.queues.getPendingInvitations, { userId });
```

---

## Error Handling

All mutations include error handling:

```typescript
try {
  await joinQueue({ queueId, userId });
  alert("Request to join sent!");
} catch (error) {
  alert(`Error joining queue: ${error}`);
}
```

Common errors:
- "Queue not found" - Queue deleted or ID invalid
- "Queue is not currently accepting new members" - Status not active
- "User already in queue" - Already member/invited
- "Queue is full" - Max members reached
- "User already has a pending invitation" - Can't invite twice

---

## Database Queries & Indexes

All tables have proper indexes for performance:

```typescript
// Efficient lookups by status
.index("by_status", ["status"])

// Filter by user
.index("by_user", ["user_id"])

// Find queues for admin
.index("by_admin", ["admin_id"])

// Check membership
.index("by_queue_user", ["queue_id", "user_id"])
```

---

## Security Considerations

### Currently Implemented

- ✅ Admin-only queue creation (via admin role check needed)
- ✅ Approval workflow prevents unauthorized members
- ✅ User can only see their own queues/invitations
- ✅ Admins can only manage their own queues

### Recommended Additions

- Add role-based access control in mutations
- Validate admin status before allowing queue creation
- Rate limit invitation sending
- Audit log all admin actions

---

## Customization

### Change Invitation Expiration

In `queues.ts`, `sendQueueInvitation`:

```typescript
expires_at: Date.now() + 14 * 24 * 60 * 60 * 1000, // 14 days
```

### Adjust Queue Categories

In `QueueMarketplace.tsx`:

```typescript
const categories = [
  "all",
  "streaming",
  "software",
  "education",
  "gaming",
  "productivity",
  // Add your categories here
];
```

### Modify Pricing Formula

In `queues.ts`, `approveMember`:

```typescript
// Current: Simple division
const newPricePerMember = queue.total_cost / newMemberCount;

// Custom: Add platform fee
const newPricePerMember = (queue.total_cost * 1.05) / newMemberCount;
```

---

## Next Steps

1. ✅ Deploy schema changes
2. ✅ Add routes to router
3. ✅ Update navigation with links
4. ✅ Add notification badges
5. ⏳ Set up email notifications (when invitation sent)
6. ⏳ Create payment collection when queue full
7. ⏳ Add queue refund logic if queue cancels
8. ⏳ Create admin onboarding for queue creation

---

## Support & Testing

### Test the Complete Flow

1. Create admin account
2. Create a test queue via `/admin/queues`
3. Open marketplace `/queues/marketplace` in different browser
4. Join queue as user
5. Check `/admin/queues` - see pending member
6. Approve member - check prices update
7. See member in admin queue details
8. Invite another user
9. Check `/invites` as invited user
10. Accept invitation
11. View both users in `/admin/queues/analytics`

### Debug Queries

Add console logs to see real-time updates:

```typescript
const queues = useQuery(api.queues.getActiveQueues);
console.log("Active queues:", queues);
```

---

## Troubleshooting

**Issue**: Prices not updating
- Check that admin approval mutation is called
- Verify `current_members` and `current_price_per_member` are updated

**Issue**: Invitations not appearing
- Check user ID matches
- Verify invitation status is "pending"
- Check invitation hasn't expired

**Issue**: Members not showing in queue
- Ensure member status is "approved"
- Check queue ID matches
- Verify `getQueueDetails` query is called

---

## Performance Notes

- All queries use Convex indexes for fast lookups
- Real-time updates via Convex subscriptions
- Pagination recommended for >100 queues per admin
- Consider caching analytics for large datasets

---

## Future Enhancements

1. **Waitlist** - Users can waitlist for full queues
2. **Queue Swapping** - Users can trade spots
3. **Early Bird Bonus** - Discount for early joiners
4. **Referral Rewards** - Bonus for inviting users
5. **Queue Templates** - Admin templates for common services
6. **Auto-Close** - Queue closes automatically when full
7. **Notification Preferences** - Users choose notification channels
8. **Queue Metrics Export** - Export analytics to CSV/PDF
