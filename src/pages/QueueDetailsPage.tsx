import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  ArrowLeft,
  Users,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Zap,
  TrendingDown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface QueueDetailsPageProps {
  queueId: Id<"queues">;
  userId: Id<"users">;
}

export const QueueDetailsPage: React.FC<QueueDetailsPageProps> = ({
  queueId,
  userId,
}) => {
  const navigate = useNavigate();
  const [showJoinConfirm, setShowJoinConfirm] = useState(false);

  const queue = useQuery(api.queues.getQueueDetails, { queueId });
  const userQueues = useQuery(api.queues.getUserQueues, { userId });
  const joinQueue = useMutation(api.queues.joinQueue);

  // Check if user is already in this queue
  const isUserInQueue = userQueues?.some((q) => q._id === queueId);

  if (!queue) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-950 flex items-center justify-center">
        <Zap className="text-purple-400 animate-spin" size={40} />
      </div>
    );
  }

  const handleJoinQueue = async () => {
    try {
      await joinQueue({ queueId, userId });
      setShowJoinConfirm(false);
      alert("Request to join sent! Waiting for admin approval.");
    } catch (error) {
      alert(`Error: ${error}`);
    }
  };

  const progressPercentage = Math.round(
    ((queue.total_approved || 0) / queue.max_members) * 100
  );

  const closingDateObj = new Date(queue.closing_date);
  const daysRemaining = Math.ceil(
    (closingDateObj.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-8 font-medium"
        >
          <ArrowLeft size={20} />
          Back to Marketplace
        </button>

        {/* Header with Image */}
        <div className="relative h-80 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg overflow-hidden mb-8">
          {queue.service_image_url ? (
            <img
              src={queue.service_image_url}
              alt={queue.service_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Zap className="text-white" size={100} opacity={0.2} />
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-4 right-4">
            <span
              className={`px-4 py-2 rounded-full font-bold text-white ${
                queue.status === "active"
                  ? "bg-green-600"
                  : queue.status === "full"
                  ? "bg-yellow-600"
                  : "bg-red-600"
              }`}
            >
              {queue.status === "active"
                ? "Accepting Members"
                : queue.status === "full"
                ? "Queue Full"
                : "Closed"}
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title & Category */}
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                {queue.service_name}
              </h1>
              <span className="inline-block px-3 py-1 bg-purple-600/20 text-purple-300 rounded-full text-sm font-medium">
                {queue.category}
              </span>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-lg font-bold text-gray-300 mb-3">About</h2>
              <p className="text-gray-400 leading-relaxed">
                {queue.description}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="bg-slate-800/50 border border-gray-700 p-6 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Users size={20} className="text-purple-400" />
                  Queue Progress
                </h3>
                <span className="text-2xl font-bold text-purple-400">
                  {queue.total_approved || 0} / {queue.max_members}
                </span>
              </div>

              {/* Large Progress Bar */}
              <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden mb-4">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>

              {/* Stats Below Progress */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-gray-400 mb-1">Members Joined</div>
                  <div className="text-2xl font-bold text-purple-400">
                    {queue.total_approved || 0}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Pending</div>
                  <div className="text-2xl font-bold text-blue-400">
                    {queue.total_pending || 0}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Spots Left</div>
                  <div className="text-2xl font-bold text-yellow-400">
                    {queue.remaining_spots || queue.max_members}
                  </div>
                </div>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="bg-slate-800/50 border border-gray-700 p-6 rounded-lg">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <DollarSign size={20} className="text-pink-400" />
                Price Breakdown
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between p-3 bg-slate-700/50 rounded">
                  <span className="text-gray-300">Total Subscription Cost</span>
                  <span className="font-bold text-white">
                    ₦{queue.total_cost.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between p-3 bg-slate-700/50 rounded">
                  <span className="text-gray-300">Current Members</span>
                  <span className="font-bold text-white">
                    {queue.total_approved || 1}
                  </span>
                </div>

                <div className="border-t border-gray-600 pt-3 flex justify-between p-3 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded">
                  <span className="text-gray-300 font-medium">
                    Estimated Cost per Member
                  </span>
                  <span className="font-bold text-pink-400 text-lg">
                    ₦{(queue.current_price_per_member || queue.total_cost).toLocaleString()}
                  </span>
                </div>

                {/* Savings Info */}
                <div className="flex gap-2 p-3 bg-green-600/10 border border-green-600/50 rounded">
                  <CheckCircle className="text-green-400 flex-shrink-0" size={20} />
                  <div className="text-sm">
                    <p className="text-green-300 font-medium">
                      You save money as members join!
                    </p>
                    <p className="text-green-400 text-xs mt-1">
                      Each new member reduces the cost for everyone
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing Examples */}
            <div className="bg-slate-800/50 border border-gray-700 p-6 rounded-lg">
              <h3 className="font-bold text-white mb-4">Cost at Each Stage</h3>

              <div className="space-y-2">
                {[1, 2, 3, 4].map((members) => {
                  if (members > queue.max_members) return null;

                  const costAtThisStage =
                    queue.total_cost / Math.min(members, queue.max_members);
                  const isCurrent = members === queue.total_approved;

                  return (
                    <div
                      key={members}
                      className={`p-3 rounded-lg flex justify-between items-center ${
                        isCurrent
                          ? "bg-purple-600/20 border border-purple-500"
                          : "bg-slate-700/50"
                      }`}
                    >
                      <span className="text-gray-300">
                        {members}/{queue.max_members} members
                        {isCurrent && (
                          <span className="ml-2 text-purple-400 text-xs font-bold">
                            CURRENT
                          </span>
                        )}
                      </span>
                      <span
                        className={`font-bold ${
                          isCurrent ? "text-purple-400" : "text-pink-400"
                        }`}
                      >
                        ₦{costAtThisStage.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Key Info Card */}
            <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/50 rounded-lg p-6 space-y-4">
              {/* Closing Date */}
              <div>
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                  <Calendar size={16} />
                  Closing Date
                </div>
                <div className="text-white font-bold">
                  {closingDateObj.toLocaleDateString("en-US", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
                <div className="text-purple-400 text-sm mt-1">
                  {daysRemaining > 0
                    ? `${daysRemaining} days remaining`
                    : "Queue closed"}
                </div>
              </div>

              <div className="border-t border-purple-500/30"></div>

              {/* Maximum Members */}
              <div>
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                  <Users size={16} />
                  Maximum Capacity
                </div>
                <div className="text-white font-bold text-xl">
                  {queue.max_members} members
                </div>
              </div>

              <div className="border-t border-purple-500/30"></div>

              {/* Status */}
              <div>
                <div className="text-gray-400 text-sm mb-2">Status</div>
                <div
                  className={`inline-block px-3 py-1 rounded-full font-bold text-sm ${
                    queue.status === "active"
                      ? "bg-green-600/20 text-green-300"
                      : "bg-red-600/20 text-red-300"
                  }`}
                >
                  {queue.status === "active"
                    ? "🟢 Active"
                    : queue.status === "full"
                    ? "🟡 Full"
                    : "🔴 Closed"}
                </div>
              </div>
            </div>

            {/* Join Button */}
            {isUserInQueue ? (
              <div className="p-4 bg-green-600/20 border border-green-600 rounded-lg text-center">
                <div className="flex items-center justify-center gap-2 text-green-400 font-bold">
                  <CheckCircle size={20} />
                  You've joined this queue!
                </div>
              </div>
            ) : queue.status === "active" ? (
              <button
                onClick={() => setShowJoinConfirm(true)}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
              >
                Join Queue
              </button>
            ) : (
              <button disabled className="w-full py-4 bg-gray-600 text-gray-300 font-bold text-lg rounded-lg cursor-not-allowed">
                Queue Closed
              </button>
            )}

            {/* Confirmation Dialog */}
            {showJoinConfirm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-slate-900 rounded-lg p-6 max-w-sm border border-gray-700">
                  <h3 className="text-lg font-bold text-white mb-3">
                    Confirm Queue Join
                  </h3>
                  <p className="text-gray-400 mb-6">
                    You're requesting to join <strong>{queue.service_name}</strong>. The admin will review your request.
                  </p>
                  <div className="mb-6 p-4 bg-purple-600/20 rounded-lg">
                    <div className="text-sm text-gray-400 mb-1">
                      Current estimated cost:
                    </div>
                    <div className="text-2xl font-bold text-pink-400">
                      ₦{(queue.current_price_per_member || queue.total_cost).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowJoinConfirm(false)}
                      className="flex-1 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleJoinQueue}
                      className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold"
                    >
                      Join Now
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueueDetailsPage;
