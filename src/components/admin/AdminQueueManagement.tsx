import React, { useState, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Plus,
  Upload,
  Save,
  ChevronDown,
  Eye,
  EyeOff,
  Users,
  Clock,
  DollarSign,
  Trash2,
  Send,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
} from "lucide-react";

interface Queue {
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
  visibility: boolean;
  closing_date: number;
  created_at: number;
}

export const AdminQueueManagement: React.FC<{ adminId: Id<"users"> }> = ({
  adminId,
}) => {
  const [activeTab, setActiveTab] = useState<"create" | "manage">("manage");
  const [formData, setFormData] = useState({
    service_name: "",
    description: "",
    category: "",
    service_image_url: "",
    total_cost: 0,
    max_members: 0,
    closing_date: "",
    visibility: true,
  });
  const [selectedQueue, setSelectedQueue] = useState<Queue | null>(null);
  const [showMemberApproval, setShowMemberApproval] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);

  // API calls
  const createQueue = useMutation(api.queues.createQueue);
  const updateQueue = useMutation(api.queues.updateQueue);
  const closeQueue = useMutation(api.queues.closeQueue);
  const approveMember = useMutation(api.queues.approveMember);
  const rejectMember = useMutation(api.queues.rejectMember);
  const sendAnnouncement = useMutation(api.queues.sendQueueAnnouncement);

  const queues = useQuery(api.queues.getAdminQueues, { adminId }) || [];

  const handleCreateQueue = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.service_name || !formData.category || formData.total_cost <= 0) {
      alert("Please fill all required fields");
      return;
    }

    try {
      const closingDate = new Date(formData.closing_date).getTime();
      await createQueue({
        admin_id: adminId,
        service_name: formData.service_name,
        description: formData.description,
        category: formData.category,
        service_image_url: formData.service_image_url || undefined,
        total_cost: formData.total_cost,
        max_members: formData.max_members,
        closing_date: closingDate,
        visibility: formData.visibility,
      });

      // Reset form
      setFormData({
        service_name: "",
        description: "",
        category: "",
        service_image_url: "",
        total_cost: 0,
        max_members: 0,
        closing_date: "",
        visibility: true,
      });

      setActiveTab("manage");
      alert("Queue created successfully!");
    } catch (error) {
      alert(`Error creating queue: ${error}`);
    }
  };

  const handleApproveMember = async () => {
    if (!selectedMember || !selectedQueue) return;

    try {
      await approveMember({
        memberId: selectedMember._id,
        queueId: selectedQueue._id,
      });
      setShowMemberApproval(false);
      setSelectedMember(null);
      alert("Member approved!");
    } catch (error) {
      alert(`Error approving member: ${error}`);
    }
  };

  const handleRejectMember = async () => {
    if (!selectedMember || !selectedQueue) return;

    try {
      await rejectMember({
        memberId: selectedMember._id,
        queueId: selectedQueue._id,
        reason: "Rejected by admin",
      });
      setShowMemberApproval(false);
      setSelectedMember(null);
      alert("Member rejected!");
    } catch (error) {
      alert(`Error rejecting member: ${error}`);
    }
  };

  return (
    <div className="w-full h-full overflow-auto bg-gradient-to-br from-slate-950 via-purple-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-2">
            Queue Marketplace
          </h1>
          <p className="text-gray-300">Manage your subscription queues</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-700">
          <button
            onClick={() => setActiveTab("manage")}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === "manage"
                ? "border-purple-500 text-purple-400"
                : "border-transparent text-gray-400 hover:text-gray-300"
            }`}
          >
            <Users className="inline mr-2" size={18} />
            Manage Queues
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === "create"
                ? "border-purple-500 text-purple-400"
                : "border-transparent text-gray-400 hover:text-gray-300"
            }`}
          >
            <Plus className="inline mr-2" size={18} />
            Create Queue
          </button>
        </div>

        {/* Create Queue Tab */}
        {activeTab === "create" && (
          <div className="bg-slate-800/50 rounded-lg border border-gray-700 p-8 max-w-2xl">
            <form onSubmit={handleCreateQueue} className="space-y-6">
              {/* Service Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Service Name *
                </label>
                <input
                  type="text"
                  value={formData.service_name}
                  onChange={(e) =>
                    setFormData({ ...formData, service_name: e.target.value })
                  }
                  placeholder="e.g., ChatGPT Team"
                  className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe what this queue offers..."
                  rows={4}
                  className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="">Select category</option>
                  <option value="streaming">Streaming Services</option>
                  <option value="software">Software & Tools</option>
                  <option value="education">Education</option>
                  <option value="gaming">Gaming</option>
                  <option value="productivity">Productivity</option>
                </select>
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Service Image URL
                </label>
                <input
                  type="url"
                  value={formData.service_image_url}
                  onChange={(e) =>
                    setFormData({ ...formData, service_image_url: e.target.value })
                  }
                  placeholder="https://..."
                  className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Pricing Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Total Cost (₦) *
                  </label>
                  <div className="flex items-center">
                    <DollarSign className="absolute ml-3 text-gray-500" size={18} />
                    <input
                      type="number"
                      value={formData.total_cost}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          total_cost: parseFloat(e.target.value),
                        })
                      }
                      min="0"
                      className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Max Members *
                  </label>
                  <div className="flex items-center">
                    <Users className="absolute ml-3 text-gray-500" size={18} />
                    <input
                      type="number"
                      value={formData.max_members}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          max_members: parseInt(e.target.value),
                        })
                      }
                      min="1"
                      className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Closing Date */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Queue Closing Date *
                </label>
                <div className="flex items-center">
                  <Calendar
                    className="absolute ml-3 text-gray-500"
                    size={18}
                  />
                  <input
                    type="datetime-local"
                    value={formData.closing_date}
                    onChange={(e) =>
                      setFormData({ ...formData, closing_date: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Visibility Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-gray-600">
                <div className="flex items-center gap-3">
                  {formData.visibility ? (
                    <Eye className="text-purple-400" size={18} />
                  ) : (
                    <EyeOff className="text-gray-500" size={18} />
                  )}
                  <span className="text-gray-300">Visible in Marketplace</span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, visibility: !formData.visibility })
                  }
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    formData.visibility
                      ? "bg-purple-600 text-white"
                      : "bg-gray-600 text-gray-300"
                  }`}
                >
                  {formData.visibility ? "Visible" : "Hidden"}
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Create Queue
              </button>
            </form>
          </div>
        )}

        {/* Manage Queues Tab */}
        {activeTab === "manage" && (
          <div className="space-y-6">
            {queues.length === 0 ? (
              <div className="text-center py-12 bg-slate-800/50 rounded-lg border border-gray-700">
                <AlertCircle className="mx-auto text-gray-500 mb-3" size={40} />
                <p className="text-gray-400">No queues yet. Create your first one!</p>
              </div>
            ) : (
              queues.map((queue: any) => (
                <div
                  key={queue._id}
                  className="bg-slate-800/50 rounded-lg border border-gray-700 p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {queue.service_name}
                      </h3>
                      <p className="text-gray-400 text-sm">{queue.category}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        queue.status === "active"
                          ? "bg-green-500/20 text-green-300"
                          : queue.status === "full"
                          ? "bg-yellow-500/20 text-yellow-300"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {queue.status.charAt(0).toUpperCase() +
                        queue.status.slice(1)}
                    </span>
                  </div>

                  {/* Queue Stats */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-slate-700/50 p-4 rounded-lg">
                      <div className="text-xs text-gray-400 mb-1">Members</div>
                      <div className="text-2xl font-bold text-purple-400">
                        {queue.approved_members}/{queue.max_members}
                      </div>
                    </div>
                    <div className="bg-slate-700/50 p-4 rounded-lg">
                      <div className="text-xs text-gray-400 mb-1">
                        Price per Member
                      </div>
                      <div className="text-2xl font-bold text-pink-400">
                        ₦{queue.current_price_per_member.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-slate-700/50 p-4 rounded-lg">
                      <div className="text-xs text-gray-400 mb-1">Pending</div>
                      <div className="text-2xl font-bold text-blue-400">
                        {queue.pending_members}
                      </div>
                    </div>
                    <div className="bg-slate-700/50 p-4 rounded-lg">
                      <div className="text-xs text-gray-400 mb-1">
                        Remaining
                      </div>
                      <div className="text-2xl font-bold text-yellow-400">
                        {queue.remaining_spots}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <button
                    onClick={() => setSelectedQueue(queue)}
                    className="w-full py-2 bg-purple-600/20 text-purple-300 rounded-lg font-medium hover:bg-purple-600/30 transition-colors"
                  >
                    View & Manage Members
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Member Management Modal */}
        {selectedQueue && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-lg max-w-2xl w-full max-h-96 overflow-auto border border-gray-700">
              <div className="sticky top-0 bg-slate-800 p-6 border-b border-gray-700 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">
                  {selectedQueue.service_name} - Members
                </h2>
                <button
                  onClick={() => setSelectedQueue(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4">
                <h3 className="font-semibold text-gray-300 mb-4">
                  Pending Approvals
                </h3>
                {selectedQueue.pending_members?.length === 0 ? (
                  <p className="text-gray-500 text-sm">No pending members</p>
                ) : (
                  selectedQueue.pending_members?.map((member: any) => (
                    <div
                      key={member._id}
                      className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-white">
                          {member.user?.full_name}
                        </p>
                        <p className="text-sm text-gray-400">
                          {member.user?.email}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedMember(member);
                            setShowMemberApproval(true);
                          }}
                          className="px-3 py-1 bg-green-600/20 text-green-300 rounded hover:bg-green-600/30 text-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectMember()}
                          className="px-3 py-1 bg-red-600/20 text-red-300 rounded hover:bg-red-600/30 text-sm"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminQueueManagement;
