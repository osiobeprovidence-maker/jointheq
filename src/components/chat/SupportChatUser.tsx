import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useAction } from "convex/react";

import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { motion, AnimatePresence } from "motion/react";
import {
    Send,
    Paperclip,
    Smile,
    CheckCircle2,
    Clock,
    ArrowLeft,
    X,
    MessageSquare
} from "lucide-react";
import toast from "react-hot-toast";

interface SupportChatUserProps {
    userId: Id<"users">;
    onBack?: () => void;
}

type SupportContact = {
    name: string;
    label: string;
    phone: string;
};

const getSupportContacts = (platformSettings: Record<string, any>): SupportContact[] => {
    const contacts = Array.isArray(platformSettings?.whatsapp_support_contacts)
        ? platformSettings.whatsapp_support_contacts
        : [];

    return contacts
        .filter((contact: any) => contact && typeof contact.phone === "string" && contact.phone.trim())
        .map((contact: any, index: number) => ({
            name: typeof contact.name === "string" && contact.name.trim() ? contact.name.trim() : `Support ${index + 1}`,
            label: typeof contact.label === "string" && contact.label.trim() ? contact.label.trim() : "WhatsApp Support",
            phone: contact.phone.trim(),
        }))
        .slice(0, 3);
};

const buildWhatsAppLink = (phone: string, message?: string) => {
    const normalizedPhone = phone.replace(/[^0-9]/g, "");
    return message
        ? `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`
        : `https://wa.me/${normalizedPhone}`;
};

export default function SupportChatUser({ userId, onBack }: SupportChatUserProps) {
    const [content, setContent] = useState("");
    const [image, setImage] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const data = useQuery(api.support.getMyConversation, { userId });
    const startConv = useMutation(api.support.startConversation);
    const sendMessage = useMutation(api.support.sendMessage);
    const chatWithAI = useAction(api.support_actions.chatWithAI);
    const escalateToAgent = useMutation(api.support.escalateToAgent);
    const platformSettings = useQuery(api.admin.getPlatformSettings) || {};
    const supportContacts = getSupportContacts(platformSettings);
    const supportMessage = "Hi, I need support with my JoinTheQ account.";

    const conversation = data?.conversation;
    const messages = data?.messages || [];

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

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

    const handleStart = async () => {
        try {
            await startConv({ userId });
        } catch (err: any) {
            toast.error("Could not start conversation: " + err.message);
        }
    };

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if ((!content.trim() && !image) || !conversation) return;

        const text = content;
        const imgData = image;
        setContent("");
        setImage(null);

        try {
            await sendMessage({
                conversationId: conversation._id,
                senderId: userId,
                senderRole: "user",
                content: text,
                image_url: imgData || undefined
            });

            // If handled by AI, trigger the AI response
            if (conversation.handled_by === "ai") {
                chatWithAI({
                    conversationId: conversation._id,
                    message: text
                }).catch(e => console.error("AI Assistant Error:", e));
            }
        } catch (err: any) {
            toast.error("Failed to send message: " + err.message);
            setContent(text);
            setImage(imgData);
        }

    };

    if (data === undefined) return <div className="p-8 text-center animate-pulse">Loading Support...</div>;

    if (!conversation) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-black/5 text-center">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                    <MessageSquare size={40} className="text-emerald-600" />
                </div>
                <h2 className="text-2xl font-black mb-2">JoinTheQ Support</h2>
                <p className="text-gray-400 mb-8 max-w-sm">
                    Need help with your account, payments, or campaigns? Our verified support team is online and ready to assist you.
                </p>
                <div className="flex flex-col gap-3 w-full max-w-sm">
                    <button
                        onClick={handleStart}
                        className="w-full px-8 py-4 bg-zinc-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-xl shadow-black/10"
                    >
                        <Send size={18} /> Start a Conversation
                    </button>
                    {supportContacts.length > 0 && (
                        <div className="w-full text-left">
                            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 text-center">
                                Choose a WhatsApp support line
                            </div>
                            <div className="grid gap-3">
                                {supportContacts.map((contact, index) => (
                                    <a
                                        key={`${contact.phone}-${index}`}
                                        href={buildWhatsAppLink(contact.phone, supportMessage)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full px-5 py-4 bg-[#25D366] text-white rounded-2xl font-bold flex items-center justify-between gap-3 hover:scale-[1.02] transition-transform shadow-xl shadow-[#25D366]/20"
                                    >
                                        <div className="flex items-center gap-3">
                                            <MessageSquare size={18} />
                                            <div>
                                                <div className="text-sm font-black">{contact.name}</div>
                                                <div className="text-[10px] uppercase tracking-widest text-white/75">{contact.label}</div>
                                            </div>
                                        </div>
                                        <div className="text-xs font-bold text-white/80">{contact.phone}</div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[600px] bg-white rounded-3xl border border-black/5 overflow-hidden shadow-2xl shadow-black/5">
            {/* Header */}
            <div className="p-4 border-b border-black/5 flex items-center justify-between bg-zinc-50">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <button onClick={onBack} className="p-2 hover:bg-black/5 rounded-xl transition-colors">
                            <ArrowLeft size={18} />
                        </button>
                    )}
                    <div className="relative">
                        <div className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center">
                            <img src="/logo-icon.png" alt="Q" className="w-6 h-6 invert" />
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="font-black text-sm">{conversation.handled_by === 'ai' ? 'AI Assistant' : 'Human Agent'}</span>
                            <CheckCircle2 size={12} className="text-blue-500 fill-blue-500" />
                        </div>
                        <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">
                            {conversation.handled_by === 'ai' ? 'Instant AI Response' : 'Verified Agent'}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                    {supportContacts.map((contact, index) => (
                        <a
                            key={`${contact.phone}-${index}`}
                            href={buildWhatsAppLink(contact.phone, supportMessage)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-[#25D366]/10 border border-[#25D366]/20 rounded-lg hover:bg-[#25D366]/20 transition-all text-[#25D366] flex items-center gap-1"
                        >
                            {contact.name}
                        </a>
                    ))}
                    {conversation.handled_by === 'ai' && (
                        <button 
                            onClick={() => {
                                escalateToAgent({ conversationId: conversation._id });
                            }}
                            className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-white border border-black/10 rounded-lg hover:bg-black/5 transition-all text-gray-500"
                        >
                            Talk to Agent
                        </button>
                    )}
                </div>
            </div>


            {/* Messages */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth bg-[#f8f9fa]"
            >
                <div className="text-center py-4">
                    <div className="inline-block px-3 py-1 bg-zinc-200/50 rounded-full text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                        Conversation Started
                    </div>
                </div>

                {messages.map((msg, i) => {
                    const isMe = msg.sender_role === "user";
                    const isAI = msg.sender_role === "ai";
                    return (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            key={msg._id}
                            className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                        >
                            {!isMe && (
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 mt-1 ${isAI ? "bg-indigo-100 text-indigo-600" : "bg-zinc-900 text-white"}`}>
                                    {isAI ? <Clock size={14} /> : <CheckCircle2 size={14} />}
                                </div>
                            )}
                            <div className={`max-w-[75%] ${isMe ? "bg-zinc-900 text-white rounded-2xl rounded-tr-none" : isAI ? "bg-indigo-50 text-indigo-900 rounded-2xl rounded-tl-none border border-indigo-100" : "bg-white text-zinc-900 rounded-2xl rounded-tl-none shadow-sm border border-black/5"} p-3 px-4`}>
                                {isAI && <div className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-1">AI Assistant</div>}
                                {!isMe && !isAI && <div className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1">Support Agent</div>}

                                {msg.image_url && (
                                    <div className="mb-2 rounded-xl overflow-hidden shadow-sm">
                                        <img src={msg.image_url} alt="Attached" className="max-w-full h-auto" />
                                    </div>
                                )}
                                {msg.content && <p className="text-sm leading-relaxed">{msg.content}</p>}
                                <div className={`text-[9px] mt-1.5 font-bold ${isMe ? "text-white/40" : "text-gray-400"}`}>
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-black/5 bg-white">
                <form onSubmit={handleSend} className="flex flex-col gap-2">
                    {image && (
                        <div className="relative inline-block self-start ml-2 mb-2">
                            <img src={image} alt="Preview" className="h-20 rounded-xl border-2 border-white shadow-lg" />
                            <button
                                onClick={() => setImage(null)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:scale-110 transition-transform"
                            >
                                <X size={10} />
                            </button>
                        </div>
                    )}
                    <div className="flex items-end gap-2">
                        <div className="flex-1 bg-zinc-50 rounded-2xl p-2 px-3 border border-black/5 focus-within:ring-2 ring-black/5 transition-all">
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                placeholder="Send a message..."
                                className="w-full bg-transparent border-none outline-none text-sm py-1 resize-none max-h-32"
                                rows={1}
                            />
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/5">
                                <div className="flex items-center gap-2">
                                    <label className="p-1.5 text-gray-400 hover:text-zinc-900 hover:bg-black/5 rounded-lg transition-all cursor-pointer">
                                        <Paperclip size={16} />
                                        <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                    </label>
                                    <button type="button" className="p-1.5 text-gray-400 hover:text-zinc-900 hover:bg-black/5 rounded-lg transition-all">
                                        <Smile size={16} />
                                    </button>
                                </div>
                                <button
                                    type="submit"
                                    disabled={!content.trim() && !image}
                                    className={`p-1.5 rounded-xl transition-all ${content.trim() || image ? "bg-zinc-900 text-white scale-110" : "text-gray-300"}`}
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
