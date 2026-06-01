import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  TrendingDown,
  Users,
  Calendar,
  DollarSign,
  LogOut,
  AlertCircle,
  CheckCircle,
  Clock,
  Mail,
  ArrowRight,
} from "lucide-react";

interface UserQueue {
  _id: Id<"queues">;
  service_name: string;
  total_cost: number;
  max_members: number;
  current_members: number;
  current_price_per_member: number;
  closing_date: number;
  status: string;
  membership?: {
    status: string;
    join_date: number;
  };
}

export const QueueDashboard: React.FC<{ userId: Id<"users"> }> = ({
  userId,
}) => {
  const [selectedQueue, setSelectedQueue] = useState<UserQueue | null>(null);

  const userQueues = useQuery(api.queues.getUserQueues, { userId }) || [];
  const pendingInvitations =
    useQuery(api.queues.getPendingInvitations, { userId }) || [];

  const leaveQueue = useMutation(api.queues.leaveQueue);

  const handleLeaveQueue = async (queueId: Id<"queues">) => {
    if (
      confirm(
        "Are you sure you want to leave this queue? This action cannot be undone."
      )
    ) {
      try {
        await leaveQueue({ queueId, userId });
        alert("You've left the queue.");
      } catch (error) {
        alert(`Error: ${error}`);
      }
    }
  };

  // Filter queues by status
  const activeQueues = userQueues.filter((q: UserQueue) => q.membership?.status === "approved");
  const pendingQueues = userQueues.filter((q: UserQueue) => q.membership?.status === "pending");

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-950 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-2">
            My Queues
          </h1>
          <p className="text-gray-300">Track your joined queues and estimated costs</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/50 border border-gray-700 p-4 rounded-lg">
            <div className="text-xs text-gray-400 mb-1">Active Queues</div>
            <div className="text-3xl font-bold text-purple-400">
              {activeQueues.length}
            </div>
          </div>
          <div className="bg-slate-800/50 border border-gray-700 p-4 rounded-lg">
            <div className="text-xs text-gray-400 mb-1">Pending Approval</div>
            <div className="text-3xl font-bold text-yellow-400">
              {pendingQueues.length}
            </div>
          </div>
          <div className="bg-slate-800/50 border border-gray-700 p-4 rounded-lg">
            <div className="text-xs text-gray-400 mb-1">Invitations</div>
            <div className="text-3xl font-bold text-blue-400">
              {pendingInvitations.length}
            </div>
          </div>
          <div className="bg-slate-800/50 border border-gray-700 p-4 rounded-lg">
            <div className="text-xs text-gray-400 mb-1">Total Invested</div>
            <div className="text-3xl font-bold text-pink-400">
              ₦
              {activeQueues
                .reduce((sum, q: UserQueue) => sum + q.total_cost, 0)
                .toLocaleString()}
            </div>
          </div>
        </div>

        {/* Active Queues */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <CheckCircle className="text-green-400" size={24} />
            Active Queues
          </h2>

          {activeQueues.length === 0 ? (
            <div className="text-center py-8 bg-slate-800/50 rounded-lg border border-gray-700">
              <AlertCircle className="mx-auto text-gray-500 mb-2" size={32} />
              <p className="text-gray-400">
                You haven't joined any queues yet. Explore the marketplace!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeQueues.map((queue: UserQueue) => (
                <div
                  key={queue._id}
                  className="bg-slate-800/50 border border-purple-500/50 rounded-lg p-6 hover:border-purple-400 transition-colors"
                >
                  {/* Title */}
                  <h3 className="text-lg font-bold text-white mb-2">
                    {queue.service_name}
                  </h3>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Queue Progress</span>
                      <span>
                        {queue.current_members}/{queue.max_members}
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-full"
                        style={{
                          width: `${(queue.current_members / queue.max_members) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-slate-700/50 p-2 rounded">
                      <div className="text-xs text-gray-400">Your Cost</div>
                      <div className="font-bold text-pink-400">
                        ₦{queue.current_price_per_member.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-slate-700/50 p-2 rounded">
                      <div className="text-xs text-gray-400">Closing</div>
                      <div className="font-bold text-yellow-400 text-sm">
                        {new Date(queue.closing_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Savings Potential */}
                  <div className="mb-4 p-3 bg-green-600/10 border border-green-600/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingDown className="text-green-400" size={16} />
                      <span className="text-xs font-semibold text-green-400">
                        Potential Savings
                      </span>
                    </div>
                    <div className="text-green-300 text-sm">
                      ₦
                      {(
                        queue.total_cost / queue.max_members -
                        queue.current_price_per_member
                      ).toLocaleString()}{" "}
                      if queue fills
                    </div>
                  </div>

                  {/* Leave Button */}
                  <button
                    onClick={() => handleLeaveQueue(queue._id)}
                    className="w-full py-2 bg-red-600/20 text-red-300 rounded font-medium text-sm hover:bg-red-600/30 transition-colors flex items-center justify-center gap-2"
                  >
                    <LogOut size={16} />
                    Leave Queue
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Approval */}
        {pendingQueues.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="text-yellow-400" size={24} />
              Pending Approval
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pendingQueues.map((queue: UserQueue) => (
                <div
                  key={queue._id}
                  className="bg-slate-800/50 border border-yellow-500/50 rounded-lg p-6"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold text-white">
                      {queue.service_name}
                    </h3>
                    <span className="px-2 py-1 bg-yellow-600/20 text-yellow-300 text-xs font-bold rounded">
                      Pending
                    </span>
                  </div>

                  <p className="text-gray-400 text-sm mb-4">
                    Your request is waiting for admin approval.
                  </p>

                  <div className="mb-4 p-3 bg-blue-600/10 border border-blue-600/50 rounded-lg">
                    <div className="text-xs text-gray-400 mb-1">
                      Estimated cost if approved:
                    </div>
                    <div className="text-xl font-bold text-blue-400">
                      ₦{queue.current_price_per_member.toLocaleString()}
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    Requested:{" "}
                    {new Date(queue.membership?.join_date || Date.now()).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invitations */}
        {pendingInvitations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Mail className="text-blue-400" size={24} />
              Pending Invitations
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pendingInvitations.map((invitation: any) => (
                <div
                  key={invitation._id}
                  className="bg-slate-800/50 border border-blue-500/50 rounded-lg p-6"
                >
                  <h3 className="text-lg font-bold text-white mb-1">
                    {invitation.queue?.service_name}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Invited by <strong>{invitation.sender?.full_name}</strong>
                  </p>

                  {invitation.message && (
                    <p className="text-gray-400 text-sm mb-3 italic">
                      "{invitation.message}"
                    </p>
                  )}

                  <div className="mb-4 p-3 bg-blue-600/10 border border-blue-600/50 rounded-lg">
                    <div className="text-xs text-gray-400 mb-1">
                      Queue details:
                    </div>
                    <div className="text-sm text-blue-300">
                      {invitation.queue?.max_members} member queue
                    </div>
                  </div>

                  <div className="text-xs text-yellow-400 mb-4">
                    Expires:{" "}
                    {new Date(invitation.expires_at).toLocaleDateString()}
                  </div>

                  <button className="w-full py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                    <CheckCircle size={16} />
                    View Invitation
                    <ArrowRight size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment Section Info */}
        <div className="bg-slate-800/50 border border-gray-700 rounded-lg p-8">
          <h2 className="text-xl font-bold text-white mb-4">
            How Payment Works
          </h2>
          <div className="space-y-3 text-gray-400">
            <p>
              • Your <strong className="text-white">estimated cost</strong> is
              calculated in real-time as members join
            </p>
            <p>
              • When a queue <strong className="text-white">reaches full capacity</strong>
              , you'll be notified to complete payment
            </p>
            <p>
              • Payment will be collected via your preferred payment method
            </p>
            <p>
              • Once paid, you'll get access to the shared subscription
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueueDashboard;
