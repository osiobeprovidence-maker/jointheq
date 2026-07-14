import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export interface ActiveSubscription {
  _id: Id<any>;
  slot_name: string;
  sub_name: string;
  platform: string;
  status: string;
  renewal_date?: number;
  auto_renew: boolean;
  removal_scheduled_at?: number;
  allocation?: string;
}

export interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  activeSlots: ActiveSubscription[];
  totalActive: number;
}

export function useSubscriptionStatus(userId: Id<"users"> | undefined, platform?: string): {
  status: SubscriptionStatus | undefined;
  isLoading: boolean;
  hasActive: boolean;
} {
  const status = useQuery(
    api.subscriptions.getUserSubscriptionStatus,
    userId ? { userId, ...(platform ? { platform } : {}) } : "skip"
  );

  return {
    status,
    isLoading: userId ? status === undefined : false,
    hasActive: status?.hasActiveSubscription ?? false,
  };
}
