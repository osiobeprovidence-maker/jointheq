import React, { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Search,
  Filter,
  DollarSign,
  Users,
  Calendar,
  TrendingDown,
  ArrowRight,
  Clock,
  Zap,
} from "lucide-react";

interface QueueCard {
  _id: Id<"queues">;
  service_name: string;
  description: string;
  category: string;
  service_image_url?: string;
  total_cost: number;
  max_members: number;
  current_members: number;
  current_price_per_member: number;
  status: string;
  closing_date: number;
  approved_members?: number;
  remaining_spots?: number;
}

export const QueueMarketplace: React.FC<{ userId: Id<"users"> }> = ({
  userId,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedQueue, setSelectedQueue] = useState<QueueCard | null>(null);

  const queues = useQuery(api.queues.getActiveQueues) || [];
  const joinQueue = useMutation(api.queues.joinQueue);

  // Filter queues
  const filteredQueues = useMemo(() => {
    return queues.filter((queue: QueueCard) => {
      const matchesSearch =
        queue.service_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        queue.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" || queue.category === selectedCategory;

      return matchesSearch && matchesCategory && queue.status === "active";
    });
  }, [queues, searchQuery, selectedCategory]);

  const handleJoinQueue = async (queueId: Id<"queues">) => {
    try {
      await joinQueue({ queueId, userId });
      alert("Request to join queue sent! Waiting for admin approval.");
    } catch (error) {
      alert(`Error joining queue: ${error}`);
    }
  };

  const categories = [
    "all",
    "streaming",
    "software",
    "education",
    "gaming",
    "productivity",
  ];

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-3">
            Queue Marketplace
          </h1>
          <p className="text-gray-300 text-lg">
            Join queues and save money as more people join
          </p>
        </div>

        {/* Search & Filter */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500"
              size={20}
            />
            <input
              type="text"
              placeholder="Search queues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? "bg-purple-600 text-white"
                    : "bg-slate-800 text-gray-300 hover:bg-slate-700"
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Queue Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredQueues.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Zap className="mx-auto mb-4 text-gray-500" size={40} />
              <p className="text-gray-400">No queues found. Check back later!</p>
            </div>
          ) : (
            filteredQueues.map((queue: QueueCard) => (
              <div
                key={queue._id}
                className="group bg-slate-800/50 rounded-lg border border-gray-700 overflow-hidden hover:border-purple-500 transition-all cursor-pointer hover:shadow-xl hover:shadow-purple-500/20"
              >
                {/* Image */}
                <div className="h-40 bg-gradient-to-br from-purple-600 to-pink-600 overflow-hidden">
                  {queue.service_image_url ? (
                    <img
                      src={queue.service_image_url}
                      alt={queue.service_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Zap className="text-white" size={60} opacity={0.3} />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                  {/* Title & Category */}
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">
                      {queue.service_name}
                    </h3>
                    <span className="inline-block px-2 py-1 text-xs bg-purple-600/20 text-purple-300 rounded">
                      {queue.category}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Queue Progress</span>
                      <span>
                        {queue.approved_members || 0}/{queue.max_members}
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all"
                        style={{
                          width: `${((queue.approved_members || 0) / queue.max_members) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Current Cost */}
                    <div className="bg-slate-700/50 p-2 rounded">
                      <div className="text-xs text-gray-400">Cost/Member</div>
                      <div className="text-sm font-bold text-pink-400">
                        ₦{(queue.current_price_per_member || queue.total_cost).toLocaleString()}
                      </div>
                    </div>

                    {/* Remaining Spots */}
                    <div className="bg-slate-700/50 p-2 rounded">
                      <div className="text-xs text-gray-400">Spots Left</div>
                      <div className="text-sm font-bold text-purple-400">
                        {queue.remaining_spots || queue.max_members}
                      </div>
                    </div>
                  </div>

                  {/* Time Remaining */}
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Clock size={14} />
                    Closes{" "}
                    {new Date(queue.closing_date).toLocaleDateString()}
                  </div>

                  {/* Join Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleJoinQueue(queue._id);
                    }}
                    className="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2 group-hover:shadow-lg"
                  >
                    Join Queue
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Info Section */}
        <div className="bg-slate-800/50 border border-gray-700 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-6">
            How Queue Pricing Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Example 1 */}
            <div className="space-y-3">
              <div className="text-2xl font-bold text-purple-400">1/4</div>
              <div className="text-gray-300">
                When you're the first to join, you pay the full price
              </div>
              <div className="bg-slate-700 p-3 rounded text-pink-400 font-bold">
                ₦20,000 each
              </div>
            </div>

            {/* Example 2 */}
            <div className="space-y-3">
              <div className="text-2xl font-bold text-purple-400">2-3/4</div>
              <div className="text-gray-300">
                As more people join, the cost automatically decreases
              </div>
              <div className="space-y-2">
                <div className="bg-slate-700 p-2 rounded text-pink-400 font-bold text-sm">
                  ₦10,000 (2 members)
                </div>
                <div className="bg-slate-700 p-2 rounded text-pink-400 font-bold text-sm">
                  ₦6,667 (3 members)
                </div>
              </div>
            </div>

            {/* Example 3 */}
            <div className="space-y-3">
              <div className="text-2xl font-bold text-purple-400">4/4</div>
              <div className="text-gray-300">
                Queue reaches full capacity, best price unlocked
              </div>
              <div className="bg-slate-700 p-3 rounded text-pink-400 font-bold">
                ₦5,000 each
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueueMarketplace;
