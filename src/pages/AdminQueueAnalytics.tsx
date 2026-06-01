import React, { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Activity,
  Zap,
} from "lucide-react";

interface AdminAnalyticsProps {
  adminId: Id<"users">;
}

export const AdminQueueAnalytics: React.FC<AdminAnalyticsProps> = ({
  adminId,
}) => {
  const queues = useQuery(api.queues.getAdminQueues, { adminId }) || [];

  // Calculate analytics
  const analytics = useMemo(() => {
    if (!queues.length)
      return {
        totalQueues: 0,
        activeQueues: 0,
        fullQueues: 0,
        totalMembers: 0,
        totalCapacity: 0,
        conversionRate: 0,
        totalRevenue: 0,
        avgQueueFillRate: 0,
        pendingApprovals: 0,
      };

    const activeQueues = queues.filter((q: any) => q.status === "active").length;
    const fullQueues = queues.filter((q: any) => q.status === "full").length;
    const totalMembers = queues.reduce(
      (sum: number, q: any) => sum + (q.approved_members || 0),
      0
    );
    const totalCapacity = queues.reduce(
      (sum: number, q: any) => sum + q.max_members,
      0
    );
    const conversionRate =
      totalCapacity > 0 ? Math.round((totalMembers / totalCapacity) * 100) : 0;
    const totalRevenue = queues.reduce(
      (sum: number, q: any) => sum + q.total_cost,
      0
    );
    const avgQueueFillRate =
      queues.length > 0
        ? Math.round(
            queues.reduce(
              (sum: number, q: any) =>
                sum + ((q.approved_members || 0) / q.max_members) * 100,
              0
            ) / queues.length
          )
        : 0;
    const pendingApprovals = queues.reduce(
      (sum: number, q: any) => sum + (q.pending_members || 0),
      0
    );

    return {
      totalQueues: queues.length,
      activeQueues,
      fullQueues,
      totalMembers,
      totalCapacity,
      conversionRate,
      totalRevenue,
      avgQueueFillRate,
      pendingApprovals,
    };
  }, [queues]);

  const mostPopularQueue = useMemo(() => {
    return queues.reduce((max: any, q: any) =>
      (q.approved_members || 0) > (max?.approved_members || 0) ? q : max
    );
  }, [queues]);

  const closingSoonQueues = useMemo(() => {
    const now = Date.now();
    const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000;

    return queues
      .filter(
        (q: any) =>
          q.closing_date > now &&
          q.closing_date <= sevenDaysFromNow &&
          q.status !== "closed"
      )
      .sort((a: any, b: any) => a.closing_date - b.closing_date)
      .slice(0, 3);
  }, [queues]);

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="text-purple-400" size={32} />
            <h1 className="text-4xl font-bold text-white">Queue Analytics</h1>
          </div>
          <p className="text-gray-400">Performance overview of your queues</p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Queues */}
          <div className="bg-gradient-to-br from-purple-600/20 to-purple-600/5 border border-purple-500/50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm font-medium">
                Total Queues
              </span>
              <Zap className="text-purple-400" size={20} />
            </div>
            <div className="text-3xl font-bold text-white">
              {analytics.totalQueues}
            </div>
            <div className="text-xs text-purple-400 mt-2">
              {analytics.activeQueues} active, {analytics.fullQueues} full
            </div>
          </div>

          {/* Total Members */}
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-600/5 border border-blue-500/50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm font-medium">
                Total Members
              </span>
              <Users className="text-blue-400" size={20} />
            </div>
            <div className="text-3xl font-bold text-white">
              {analytics.totalMembers}
            </div>
            <div className="text-xs text-blue-400 mt-2">
              Capacity: {analytics.totalCapacity}
            </div>
          </div>

          {/* Conversion Rate */}
          <div className="bg-gradient-to-br from-green-600/20 to-green-600/5 border border-green-500/50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm font-medium">
                Conversion Rate
              </span>
              <TrendingUp className="text-green-400" size={20} />
            </div>
            <div className="text-3xl font-bold text-white">
              {analytics.conversionRate}%
            </div>
            <div className="text-xs text-green-400 mt-2">
              {analytics.totalMembers} / {analytics.totalCapacity}
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-gradient-to-br from-pink-600/20 to-pink-600/5 border border-pink-500/50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm font-medium">
                Total Potential Revenue
              </span>
              <DollarSign className="text-pink-400" size={20} />
            </div>
            <div className="text-3xl font-bold text-white">
              ₦{(analytics.totalRevenue / 1000000).toFixed(1)}M
            </div>
            <div className="text-xs text-pink-400 mt-2">
              All queue costs combined
            </div>
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Avg Fill Rate */}
          <div className="bg-slate-800/50 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm font-medium">
                Avg Queue Fill Rate
              </span>
              <Activity className="text-yellow-400" size={20} />
            </div>
            <div className="text-3xl font-bold text-yellow-400">
              {analytics.avgQueueFillRate}%
            </div>
            <div className="mt-4 bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-yellow-500 to-yellow-400 h-full"
                style={{ width: `${analytics.avgQueueFillRate}%` }}
              />
            </div>
          </div>

          {/* Pending Approvals */}
          <div className="bg-slate-800/50 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm font-medium">
                Pending Approvals
              </span>
              <AlertCircle className="text-orange-400" size={20} />
            </div>
            <div className="text-3xl font-bold text-orange-400">
              {analytics.pendingApprovals}
            </div>
            <div className="text-xs text-gray-400 mt-2">
              Waiting for your review
            </div>
          </div>

          {/* Full Queues */}
          <div className="bg-slate-800/50 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm font-medium">
                Full Queues
              </span>
              <CheckCircle className="text-green-400" size={20} />
            </div>
            <div className="text-3xl font-bold text-green-400">
              {analytics.fullQueues}
            </div>
            <div className="text-xs text-gray-400 mt-2">
              Ready for payment collection
            </div>
          </div>
        </div>

        {/* Most Popular Queue */}
        {mostPopularQueue && (
          <div className="mb-8 bg-slate-800/50 border border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-bold text-white mb-4">
              Most Popular Queue
            </h2>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-purple-400">
                  {mostPopularQueue.service_name}
                </h3>
                <p className="text-gray-400 text-sm mt-1">
                  {mostPopularQueue.approved_members || 0} of{" "}
                  {mostPopularQueue.max_members} members
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-pink-400">
                  ₦{mostPopularQueue.current_price_per_member.toLocaleString()}
                </div>
                <div className="text-xs text-gray-400">per member</div>
              </div>
            </div>
          </div>
        )}

        {/* Closing Soon */}
        {closingSoonQueues.length > 0 && (
          <div className="bg-slate-800/50 border border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <AlertCircle className="text-yellow-400" size={20} />
              Closing Soon
            </h2>
            <div className="space-y-3">
              {closingSoonQueues.map((queue: any) => {
                const daysLeft = Math.ceil(
                  (queue.closing_date - Date.now()) / (1000 * 60 * 60 * 24)
                );
                const fillPercent = Math.round(
                  ((queue.approved_members || 0) / queue.max_members) * 100
                );

                return (
                  <div
                    key={queue._id}
                    className="p-4 bg-slate-700/50 rounded-lg border border-yellow-500/30"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-white">
                        {queue.service_name}
                      </h3>
                      <span className="text-xs font-bold text-yellow-400">
                        {daysLeft} days left
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-400">
                      <span>
                        {queue.approved_members || 0}/{queue.max_members} members
                      </span>
                      <div className="w-32 bg-slate-600 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-yellow-500 to-yellow-400 h-full"
                          style={{ width: `${fillPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminQueueAnalytics;
