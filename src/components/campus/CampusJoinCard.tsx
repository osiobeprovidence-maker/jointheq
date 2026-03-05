import React from "react";
import { motion } from "motion/react";
import { GraduationCap, ArrowRight, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface CampusJoinCardProps {
    userId: Id<"users">;
    onApply: () => void;
}

export default function CampusJoinCard({ userId, onApply }: CampusJoinCardProps) {
    const myApplication = useQuery(api.campus.getMyCampusApplication, { userId });

    const getStatusContent = () => {
        if (!myApplication) {
            return {
                title: "Become a Campus Ambassador",
                description: "Represent JoinTheQ on your campus and earn exclusive rewards, commissions, and early access to new features.",
                button: "Apply Now",
                color: "bg-blue-600",
                icon: <GraduationCap size={24} />,
                onClick: onApply
            };
        }

        switch (myApplication.status) {
            case "pending":
                return {
                    title: "Application Pending",
                    description: "Your application for " + myApplication.university + " is currently being reviewed by our team. We'll get back to you soon!",
                    button: "Pending Review",
                    color: "bg-amber-500",
                    icon: <Clock size={24} />,
                    disabled: true
                };
            case "approved":
                return {
                    title: "Application Approved!",
                    description: "Congratulations! You're now a Campus Ambassador for " + myApplication.university + ". Welcome to the team!",
                    button: "View Dashboard",
                    color: "bg-emerald-500",
                    icon: <CheckCircle2 size={24} />,
                    onClick: () => { } // Redirect to campus rep dashboard if exists
                };
            case "rejected":
                return {
                    title: "Application Declined",
                    description: "Thank you for your interest. Unfortunately, your application was not approved at this time. You can try again later.",
                    button: "Try Again Later",
                    color: "bg-red-500",
                    icon: <XCircle size={24} />,
                    disabled: true
                };
            default:
                return null;
        }
    };

    const content = getStatusContent();
    if (!content) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative overflow-hidden p-8 rounded-[2.5rem] text-white shadow-2xl ${content.color} group`}
        >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                {content.icon}
            </div>

            <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                            {content.icon}
                        </div>
                        <h3 className="text-xl font-black">{content.title}</h3>
                    </div>
                    <p className="text-white/80 text-sm font-medium leading-relaxed mb-8 max-w-sm">
                        {content.description}
                    </p>
                </div>

                <button
                    onClick={content.onClick}
                    disabled={content.disabled}
                    className={`flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 disabled:bg-white/5 backdrop-blur-md rounded-2xl font-black text-sm transition-all ${!content.disabled && "hover:scale-105 active:scale-95"}`}
                >
                    {content.button} {!content.disabled && <ArrowRight size={18} />}
                </button>
            </div>

            {/* Background Orbs */}
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
        </motion.div>
    );
}
