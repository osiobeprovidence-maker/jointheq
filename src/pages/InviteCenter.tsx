import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Send,
  AlertCircle,
  Archive,
  Filter,
  Users,
} from "lucide-react";

interface Invitation {
  _id: Id<"queue_invitations">;
  queue_id: Id<"queues">;
  sender_id: Id<"users">;
  recipient_id: Id<"users">;
  status: "pending" | "accepted" | "declined" | "expired";
  message?: string;
  expires_at: number;
  sent_at: number;
  responded_at?: number;
  queue?: { service_name: string };
  sender?: { full_name: string };
}

export const InviteCenter: React.FC<{ userId: Id<"users"> }> = ({ userId }) => {
  const [filterStatus, setFilterStatus] = useState<
    "all" | "pending" | "accepted" | "declined"
  >("all");

  const invitations = useQuery(api.queues.getPendingInvitations, {
    userId,
  }) || [];

  const acceptInvitation = useMutation(api.queues.acceptInvitation);
  const declineInvitation = useMutation(api.queues.declineInvitation);

  // Filter invitations
  const filteredInvitations = invitations.filter((inv: Invitation) => {
    if (filterStatus === "all") return true;
    return inv.status === filterStatus;
  });

  const handleAccept = async (invitationId: Id<"queue_invitations">) => {
    try {
      await acceptInvitation({ invitationId });
      alert("Invitation accepted! You've been added to the queue.");
    } catch (error) {
      alert(`Error: ${error}`);
    }
  };

  const handleDecline = async (invitationId: Id<"queue_invitations">) => {
    try {
      await declineInvitation({ invitationId });
      alert("Invitation declined.");
    } catch (error) {
      alert(`Error: ${error}`);
    }
  };

  const isExpired = (expiresAt: number) => expiresAt < Date.now();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-300";
      case "accepted":
        return "bg-green-500/20 text-green-300";
      case "declined":
        return "bg-red-500/20 text-red-300";
      case "expired":
        return "bg-gray-500/20 text-gray-300";
      default:
        return "bg-gray-500/20 text-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="text-yellow-400" size={18} />;
      case "accepted":
        return <CheckCircle className="text-green-400" size={18} />;
      case "declined":
        return <XCircle className="text-red-400" size={18} />;
      default:
        return <AlertCircle className="text-gray-400" size={18} />;
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Mail className="text-purple-400" size={32} />
            <h1 className="text-4xl font-bold text-white">Invite Center</h1>
          </div>
          <p className="text-gray-400">Manage your queue invitations</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/50 border border-gray-700 p-4 rounded-lg">
            <div className="text-xs text-gray-400 mb-1">Total</div>
            <div className="text-2xl font-bold text-white">
              {invitations.length}
            </div>
          </div>
          <div className="bg-slate-800/50 border border-gray-700 p-4 rounded-lg">
            <div className="text-xs text-gray-400 mb-1">Pending</div>
            <div className="text-2xl font-bold text-yellow-400">
              {invitations.filter((i: Invitation) => i.status === "pending")
                .length}
            </div>
          </div>
          <div className="bg-slate-800/50 border border-gray-700 p-4 rounded-lg">
            <div className="text-xs text-gray-400 mb-1">Accepted</div>
            <div className="text-2xl font-bold text-green-400">
              {invitations.filter((i: Invitation) => i.status === "accepted")
                .length}
            </div>
          </div>
          <div className="bg-slate-800/50 border border-gray-700 p-4 rounded-lg">
            <div className="text-xs text-gray-400 mb-1">Declined</div>
            <div className="text-2xl font-bold text-red-400">
              {invitations.filter((i: Invitation) => i.status === "declined")
                .length}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(["all", "pending", "accepted", "declined"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-colors ${
                filterStatus === status
                  ? "bg-purple-600 text-white"
                  : "bg-slate-800 text-gray-400 hover:bg-slate-700"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Invitations List */}
        <div className="space-y-4">
          {filteredInvitations.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/50 rounded-lg border border-gray-700">
              <Mail className="mx-auto text-gray-500 mb-3" size={40} />
              <p className="text-gray-400">
                {filterStatus === "all"
                  ? "No invitations yet"
                  : `No ${filterStatus} invitations`}
              </p>
            </div>
          ) : (
            filteredInvitations.map((invitation: Invitation) => {
              const isExp = isExpired(invitation.expires_at);

              return (
                <div
                  key={invitation._id}
                  className={`bg-slate-800/50 border rounded-lg p-6 ${
                    isExp || invitation.status !== "pending"
                      ? "border-gray-700"
                      : "border-purple-500"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    {/* Left Side - Invitation Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(invitation.status)}
                        <div>
                          <h3 className="text-lg font-bold text-white">
                            {invitation.queue?.service_name}
                          </h3>
                          <p className="text-sm text-gray-400">
                            from{" "}
                            <span className="font-medium">
                              {invitation.sender?.full_name}
                            </span>
                          </p>
                        </div>
                      </div>

                      {invitation.message && (
                        <p className="text-gray-400 text-sm mt-3 ml-0">
                          "{invitation.message}"
                        </p>
                      )}

                      {/* Metadata */}
                      <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
                        <div>
                          Sent:{" "}
                          {new Date(invitation.sent_at).toLocaleDateString()}
                        </div>
                        {invitation.responded_at && (
                          <div>
                            Responded:{" "}
                            {new Date(invitation.responded_at).toLocaleDateString()}
                          </div>
                        )}
                        {invitation.status === "pending" && (
                          <div
                            className={
                              isExp
                                ? "text-red-400"
                                : "text-yellow-400"
                            }
                          >
                            {isExp
                              ? "EXPIRED"
                              : `Expires: ${new Date(invitation.expires_at).toLocaleDateString()}`}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Side - Status Badge */}
                    <div className="ml-4 flex flex-col items-end gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2 ${getStatusColor(invitation.status)}`}
                      >
                        {invitation.status.charAt(0).toUpperCase() +
                          invitation.status.slice(1)}
                      </span>

                      {/* Action Buttons */}
                      {invitation.status === "pending" && !isExp && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAccept(invitation._id)}
                            className="px-4 py-2 bg-green-600/20 text-green-300 rounded hover:bg-green-600/30 font-medium text-sm flex items-center gap-2 transition-colors"
                          >
                            <CheckCircle size={16} />
                            Accept
                          </button>
                          <button
                            onClick={() => handleDecline(invitation._id)}
                            className="px-4 py-2 bg-red-600/20 text-red-300 rounded hover:bg-red-600/30 font-medium text-sm flex items-center gap-2 transition-colors"
                          >
                            <XCircle size={16} />
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-slate-800/50 border border-gray-700 rounded-lg p-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="text-purple-400" size={24} />
            About Invitations
          </h2>
          <div className="space-y-3 text-gray-400">
            <p>
              • <strong className="text-white">Pending invitations</strong> are
              active for 7 days. Accept or decline within this period.
            </p>
            <p>
              • When you <strong className="text-white">accept an invitation</strong>
              , you'll be automatically added to the queue and can start paying
              when the queue closes.
            </p>
            <p>
              • <strong className="text-white">Invitations expire</strong> after 7
              days if no action is taken.
            </p>
            <p>
              • You'll receive email notifications for new invitations (if email
              verified).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteCenter;
