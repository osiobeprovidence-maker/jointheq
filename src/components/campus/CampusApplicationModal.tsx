import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, GraduationCap, Instagram, Link } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import toast from "react-hot-toast";

interface CampusApplicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: Id<"users">;
}

export default function CampusApplicationModal({ isOpen, onClose, userId }: CampusApplicationModalProps) {
    const [university, setUniversity] = useState("");
    const [socialHandle, setSocialHandle] = useState("");
    const [reason, setReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const submitApplication = useMutation(api.campus.submitCampusApplication);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!university || !reason) {
            return toast.error("Please fill in all required fields.");
        }

        setIsSubmitting(true);
        try {
            await submitApplication({
                userId,
                university,
                social_handle: socialHandle,
                reason,
            });
            toast.success("Application submitted! We'll review it soon.");
            onClose();
        } catch (error: any) {
            toast.error(error.message || "Failed to submit application.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
                    >
                        <div className="p-8 pb-10">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
                                        <GraduationCap size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black">Join Campus Q</h2>
                                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Application Form</p>
                                    </div>
                                </div>
                                <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-xl transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">University Name *</label>
                                    <div className="relative">
                                        <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            value={university}
                                            onChange={(e) => setUniversity(e.target.value)}
                                            placeholder="e.g. University of Lagos"
                                            className="w-full bg-zinc-50 border-2 border-transparent focus:border-zinc-900 rounded-2xl py-4 pl-12 pr-4 font-bold text-sm outline-none transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Instagram / Twitter handle</label>
                                    <div className="relative">
                                        <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            value={socialHandle}
                                            onChange={(e) => setSocialHandle(e.target.value)}
                                            placeholder="@yourusername"
                                            className="w-full bg-zinc-50 border-2 border-transparent focus:border-zinc-900 rounded-2xl py-4 pl-12 pr-4 font-bold text-sm outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Why do you want to join? *</label>
                                    <textarea
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="Tell us a bit about yourself and your campus network..."
                                        rows={4}
                                        className="w-full bg-zinc-50 border-2 border-transparent focus:border-zinc-900 rounded-2xl py-4 px-4 font-bold text-sm outline-none transition-all resize-none"
                                        required
                                    />
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-zinc-900 text-white py-5 rounded-2xl font-black shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {isSubmitting ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                Submit Application <Send size={18} />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
