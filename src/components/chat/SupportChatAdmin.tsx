import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { motion, AnimatePresence } from "motion/react";
import {
    Send,
    Search,
    MessageSquare,
    CheckCircle2,
    Clock,
    MoreVertical,
    X,
    User,
    ArrowRight,
    ArrowLeft,
    Shield,
    Filter
} from "lucide-react";
import toast from "react-hot-toast";

interface SupportChatAdminProps {
    adminId: Id<"users">;
}

export default function SupportChatAdmin({ adminId }: SupportChatAdminProps) {
    const [selectedConvId, setSelectedConvId] = useState<Id<"support_conversations"> | null>(null);
    const [search, setSearch] = useState("");
    const [replyContent, setReplyContent] = useState("");
    const [image, setImage] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const conversations = useQuery(api.support.getConversations, { adminId });
    const messagesData = useQuery(api.support.getConversationMessages,
        selectedConvId ? { adminId, conversationId: selectedConvId } : "skip"
    );

    const sendMessage = useMutation(api.support.sendMessage);
    const assignAdmin = useMutation(api.support.assignAdmin);
    const closeConv = useMutation(api.support.resolveConversation);


    const activeMessages = messagesData?.messages || [];
    const selectedUser = messagesData?.user;

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [activeMessages]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSendReply = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if ((!replyContent.trim() && !image) || !selectedConvId) return;

        const text = replyContent;
        const imgData = image;
        setReplyContent("");
        setImage(null);

        try {
            await sendMessage({
                conversationId: selectedConvId,
                senderId: adminId,
                senderRole: "admin",
                content: text,
                image_url: imgData || undefined
            });
        } catch (err: any) {
            toast.error("Reply failed: " + err.message);
            setReplyContent(text);
            setImage(imgData);
        }
    };

    const filteredConversations = conversations?.filter(c =>
        c.user_name.toLowerCase().includes(search.toLowerCase()) ||
        c.user_email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex h-[600px] sm:h-[700px] bg-white rounded-3xl border border-black/5 overflow-hidden shadow-2xl shadow-black/5">
            {/* Sidebar: Inbox - Hidden on mobile when conversation selected */}
            <div className={`w-full sm:w-80 border-r border-black/5 flex flex-col bg-zinc-50/50 ${selectedConvId ? 'hidden sm:flex' : 'flex'}`}>
                <div className="p-4 sm:p-5 border-b border-black/5 bg-white">
                    <h2 className="text-base sm:text-lg font-black mb-4 flex items-center gap-2">
                        <MessageSquare size={18} /> <span className="hidden sm:inline">Support Inbox</span><span className="sm:hidden">Inbox</span>
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-zinc-100 border-none rounded-xl py-2 pl-9 pr-4 text-xs font-bold focus:ring-2 ring-black/5 transition-all outline-none"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-black/3">
                    {filteredConversations?.length === 0 ? (
                        <div className="p-10 text-center text-gray-400">
                            <p className="text-xs font-bold">No conversations found</p>
                        </div>
                    ) : filteredConversations?.map((conv) => {
                        const isActive = selectedConvId === conv._id;
                        const isUnassigned = !conv.assigned_admin_id;
                        return (
                            <button
                                key={conv._id}
                                onClick={() => setSelectedConvId(conv._id)}
                                className={`w-full p-4 text-left transition-all relative hover:bg-white ${isActive ? "bg-white ring-1 ring-black/5 shadow-sm" : ""}`}
                            >
                                <div className="flex gap-3">
                                    <div className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center font-black text-xs flex-shrink-0">
                                        {conv.user_name[0]}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className="font-black text-sm truncate">{conv.user_name}</span>
                                            <span className="text-[9px] text-gray-400 font-bold uppercase">
                                                {new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-gray-400 truncate font-medium mb-1">{conv.user_email}</div>
                                        <p className={`text-xs truncate ${isActive ? "text-zinc-600" : "text-gray-400"}`}>
                                            {conv.last_message}
                                        </p>
                                    </div>
                                </div>
                                {isUnassigned && conv.status === "open" && conv.handled_by === "agent" && (
                                    <div className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                                )}
                                {conv.handled_by === "ai" && conv.status === "open" && (
                                    <div className="absolute top-2 right-2 bg-indigo-500 text-white text-[8px] font-black px-1 rounded-md uppercase">AI</div>
                                )}
                                {conv.status === "resolved" && (
                                    <div className="absolute top-2 right-2 text-emerald-500"><CheckCircle2 size={12} /></div>
                                )}

                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main: Chat Thread - Hidden on mobile when no conversation selected */}
            <div className={`flex-1 flex flex-col bg-white ${!selectedConvId ? 'hidden sm:flex' : 'flex'}`}>
                {selectedConvId ? (
                    <>
                        {/* Header */}
                        <div className="p-3 sm:p-4 border-b border-black/5 flex items-center justify-between bg-zinc-50/30">
                            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                {/* Back button for mobile */}
                                <button onClick={() => setSelectedConvId(null)} className="sm:hidden p-2 -ml-2 hover:bg-black/5 rounded-xl">
                                    <ArrowLeft size={18} />
                                </button>
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-600 font-black text-xs sm:text-sm flex-shrink-0">
                                    {selectedUser?.full_name?.[0] || "?"}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="font-black text-xs sm:text-sm truncate">{selectedUser?.full_name}</div>
                                    <div className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1 sm:gap-2 truncate">
                                        <span className="truncate">{selectedUser?.email}</span>
                                        {selectedUser?.is_verified && <CheckCircle2 size={10} className="text-blue-500 flex-shrink-0" />}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                                {messagesData?.conversation?.status === "open" && (
                                    <>
                                        <button
                                            onClick={() => assignAdmin({ adminId, conversationId: selectedConvId })}
                                            className="px-2 sm:px-3 py-1.5 bg-zinc-900 text-white rounded-xl text-[9px] sm:text-[10px] font-black hover:scale-105 transition-transform"
                                        >
                                            {messagesData.conversation.handled_by === 'ai' ? 'Take Over' : 'Assign'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm("End this conversation? Messages will be cleared but the issue record remains.")) {
                                                    closeConv({ conversationId: selectedConvId });
                                                    setSelectedConvId(null);
                                                    toast.success("Conversation resolved and cleared.");
                                                }
                                            }}
                                            className="p-2 sm:px-3 py-1.5 bg-red-50 text-red-600 rounded-xl text-[9px] sm:text-[10px] font-black hover:bg-red-100 transition-colors flex items-center gap-1"
                                        >
                                            <X size={12} /> <span className="hidden sm:inline">End</span>
                                        </button>
                                    </>
                                )}
                            </div>

                        </div>

                        {/* Messages */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4 bg-[#fcfcfc]"
                        >
                            {activeMessages.map((msg) => {
                                const isAdmin = msg.sender_role === "admin";
                                return (
                                    <div key={msg._id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                                        <div className={`max-w-[80%] sm:max-w-[70%] ${isAdmin ? "bg-zinc-900 text-white rounded-2xl rounded-tr-none" : msg.sender_role === "ai" ? "bg-indigo-50 text-indigo-900 border border-indigo-100 rounded-2xl rounded-tl-none" : "bg-white text-zinc-900 shadow-sm border border-black/5 rounded-2xl rounded-tl-none"} p-3 sm:p-4`}>
                                            {!isAdmin && msg.sender_role !== "ai" && <div className="text-[9px] font-black uppercase text-gray-400 mb-1">{selectedUser?.full_name}</div>}
                                            {msg.sender_role === "ai" && <div className="text-[9px] font-black uppercase text-indigo-400 mb-1">AI Assistant</div>}
                                            {isAdmin && <div className="text-[9px] font-black uppercase text-white/40 mb-1">You (Support)</div>}

                                            {msg.image_url && (
                                                <div className="mb-2 rounded-xl overflow-hidden shadow-sm">
                                                    <img src={msg.image_url} alt="Attached" className="max-w-full h-auto" />
                                                </div>
                                            )}
                                            {msg.content && <p className="text-xs sm:text-sm leading-relaxed">{msg.content}</p>}
                                            <div className={`text-[9px] mt-2 font-bold ${isAdmin ? "text-white/30" : "text-gray-300"}`}>
                                                {new Date(msg.created_at).toLocaleTimeString()}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Reply Input */}
                        <div className="p-3 sm:p-4 border-t border-black/5 bg-white">
                            <form onSubmit={handleSendReply} className="flex flex-col gap-2 sm:gap-3">
                                {image && (
                                    <div className="relative inline-block self-start ml-2">
                                        <img src={image} alt="Preview" className="h-20 rounded-xl border-2 border-white shadow-lg" />
                                        <button
                                            onClick={() => setImage(null)}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:scale-110 transition-transform"
                                        >
                                            <X size={10} />
                                        </button>
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <div className="flex-1 bg-zinc-100 rounded-2xl flex items-center px-3 sm:px-4">
                                        <input
                                            type="text"
                                            placeholder={`Reply to ${selectedUser?.full_name}...`}
                                            value={replyContent}
                                            onChange={(e) => setReplyContent(e.target.value)}
                                            className="flex-1 bg-transparent border-none py-2 sm:py-3 text-xs sm:text-sm font-medium focus:ring-0 outline-none"
                                        />
                                        <label className="p-2 text-gray-400 hover:text-zinc-900 transition-colors cursor-pointer">
                                            <Shield size={16} className="rotate-45" />
                                            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                        </label>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!replyContent.trim() && !image}
                                        className="bg-zinc-900 text-white w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50 flex-shrink-0"
                                    >
                                        <Send size={16} />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 sm:p-12">
                        <div className="w-16 h-16 sm:w-24 sm:h-24 bg-zinc-50 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                            <MessageSquare size={32} className="text-zinc-200" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-black mb-2">Select a Conversation</h3>
                        <p className="text-xs sm:text-sm text-gray-400 max-w-xs">
                            Open a thread from the inbox to reply to user inquiries.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
