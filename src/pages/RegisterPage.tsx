import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "motion/react";
import { useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { auth } from "../lib/auth";
import {
    UserPlus, Eye, EyeOff, Gift, ChevronLeft, Loader2,
    CheckCircle2
} from "lucide-react";
import toast from "react-hot-toast";

const INTERESTED_PACKAGES = ["Netflix", "Spotify", "ChatGPT", "Canva", "CapCut", "Others"];

interface FormData {
    fullName: string;
    phone: string;
    email: string;
    password: string;
    confirmPassword: string;
    interestedPackage: string;
}

export default function RegisterPage() {
    const { refCode } = useParams();
    const navigate = useNavigate();
    const createUser = useMutation(api.users.createUser);
    const login = useMutation(api.users.login);
    const sendVerificationEmail = useAction(api.actions.sendVerificationEmail);
    const [step, setStep] = useState<"form" | "success">("form");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [form, setForm] = useState<FormData>({
        fullName: "",
        phone: "",
        email: "",
        password: "",
        confirmPassword: "",
        interestedPackage: "",
    });

    const updateField = (field: keyof FormData, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }));
    };

    const validate = (): boolean => {
        const errs: Record<string, string> = {};
        if (!form.fullName.trim()) errs.fullName = "Full name is required";
        if (!form.phone.trim()) errs.phone = "Phone number is required";
        else if (!/^[\d\s\+\-\(\)]{7,15}$/.test(form.phone.trim())) errs.phone = "Enter a valid phone number";
        if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = "Enter a valid email";
        if (!form.password) errs.password = "Password is required";
        else if (form.password.length < 6) errs.password = "Password must be at least 6 characters";
        if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match";
        if (!form.interestedPackage) errs.interestedPackage = "Select a package";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);

        try {
            const email = form.email.trim().toLowerCase();
            const phone = form.phone.trim();
            const token = email ? Math.random().toString(36).substring(2) + Date.now().toString(36) : undefined;
            const expires = email ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : undefined;
            const usernameBase = form.fullName
                .toLowerCase()
                .replace(/[^a-z0-9_]/g, "")
                .slice(0, 16) || `user${phone.slice(-4)}`;
            const username = `${usernameBase}${Math.floor(100 + Math.random() * 900)}`;

            await createUser({
                email: email || undefined,
                phone,
                full_name: form.fullName.trim(),
                username,
                password_hash: form.password,
                verification_token: token,
                verification_token_expires: expires,
                referred_by_code: refCode?.trim().toUpperCase() || undefined,
                registration_source: refCode ? "public_referral_link" : "public_signup",
            });

            if (email && token) {
                try {
                    await sendVerificationEmail({
                        email,
                        name: form.fullName.trim(),
                        token,
                        baseUrl: window.location.origin,
                    });
                } catch (emailError) {
                    console.warn("Verification email could not be sent", emailError);
                }
            }

            const loginResult = await login({
                identifier: email || phone,
                password: form.password,
            });

            if (!loginResult.success || !loginResult.user) {
                throw new Error(loginResult.error || "Account created, but automatic login failed");
            }

            const newUser = loginResult.user;

            auth.login({ ...newUser, interested_package: form.interestedPackage });

            setStep("success");
            toast.success("Account created successfully!");
        } catch (error: any) {
            toast.error(error?.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (step === "success") {
        return (
            <div className="min-h-screen bg-[#f4f5f8] flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl shadow-sm border border-black/5 p-8 max-w-md w-full text-center space-y-6">
                    <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                        <CheckCircle2 size={40} className="text-emerald-500" />
                    </div>
                    <h1 className="text-2xl font-black text-zinc-900">Welcome to Q!</h1>
                    <p className="text-sm font-bold text-zinc-500">
                        Your account has been created. Start exploring the marketplace and earn rewards!
                    </p>
                    <div className="bg-zinc-50 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-bold text-zinc-500">Name</span>
                            <span className="font-black text-zinc-900">{form.fullName}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-bold text-zinc-500">Phone</span>
                            <span className="font-black text-zinc-900">{form.phone}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-bold text-zinc-500">Package</span>
                            <span className="font-black text-zinc-900">{form.interestedPackage}</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-3">
                        <button onClick={() => navigate("/dashboard")} className="w-full h-12 rounded-2xl bg-zinc-900 text-white text-xs font-black hover:bg-zinc-800 transition-all">
                            Go to Dashboard
                        </button>
                        <button onClick={() => navigate("/")} className="w-full h-12 rounded-2xl bg-zinc-100 text-zinc-900 text-xs font-black hover:bg-zinc-200 transition-all">
                            Learn More
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f4f5f8] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-sm border border-black/5 p-6 sm:p-8 max-w-md w-full">
                <Link to="/" className="inline-flex items-center gap-2 text-xs font-black text-zinc-500 hover:text-zinc-900 transition-colors mb-6">
                    <ChevronLeft size={16} /> Back to Home
                </Link>

                <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-4">
                        <UserPlus size={28} className="text-white" />
                    </div>
                    <h1 className="text-xl font-black text-zinc-900">Join Q</h1>
                    <p className="text-xs font-bold text-zinc-500 mt-1">
                        {refCode ? "You were referred by a friend!" : "Create your account to get started"}
                    </p>
                    {refCode && (
                        <span className="inline-flex items-center gap-1 mt-2 bg-amber-50 text-amber-700 rounded-full px-3 py-1 text-[10px] font-black">
                            <Gift size={12} /> Referral Code: {refCode}
                        </span>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1.5 block">Full Name *</label>
                        <input value={form.fullName} onChange={e => updateField("fullName", e.target.value)}
                            placeholder="Enter your full name"
                            className={`w-full h-11 rounded-2xl border ${errors.fullName ? "border-red-300 bg-red-50" : "border-black/5 bg-zinc-50"} px-4 text-sm font-bold outline-none focus:border-zinc-900 transition-colors`} />
                        {errors.fullName && <p className="text-[10px] font-bold text-red-500 mt-1">{errors.fullName}</p>}
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1.5 block">Phone Number *</label>
                        <input value={form.phone} onChange={e => updateField("phone", e.target.value)}
                            placeholder="e.g. 08012345678"
                            className={`w-full h-11 rounded-2xl border ${errors.phone ? "border-red-300 bg-red-50" : "border-black/5 bg-zinc-50"} px-4 text-sm font-bold outline-none focus:border-zinc-900 transition-colors`} />
                        {errors.phone && <p className="text-[10px] font-bold text-red-500 mt-1">{errors.phone}</p>}
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1.5 block">Email Address <span className="text-zinc-300">(optional)</span></label>
                        <input value={form.email} onChange={e => updateField("email", e.target.value)}
                            placeholder="Enter your email"
                            className={`w-full h-11 rounded-2xl border ${errors.email ? "border-red-300 bg-red-50" : "border-black/5 bg-zinc-50"} px-4 text-sm font-bold outline-none focus:border-zinc-900 transition-colors`} />
                        {errors.email && <p className="text-[10px] font-bold text-red-500 mt-1">{errors.email}</p>}
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1.5 block">Password *</label>
                        <div className="relative">
                            <input type={showPassword ? "text" : "password"} value={form.password} onChange={e => updateField("password", e.target.value)}
                                placeholder="Create a password"
                                className={`w-full h-11 rounded-2xl border ${errors.password ? "border-red-300 bg-red-50" : "border-black/5 bg-zinc-50"} px-4 pr-10 text-sm font-bold outline-none focus:border-zinc-900 transition-colors`} />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900">
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {errors.password && <p className="text-[10px] font-bold text-red-500 mt-1">{errors.password}</p>}
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1.5 block">Confirm Password *</label>
                        <div className="relative">
                            <input type={showConfirm ? "text" : "password"} value={form.confirmPassword} onChange={e => updateField("confirmPassword", e.target.value)}
                                placeholder="Confirm your password"
                                className={`w-full h-11 rounded-2xl border ${errors.confirmPassword ? "border-red-300 bg-red-50" : "border-black/5 bg-zinc-50"} px-4 pr-10 text-sm font-bold outline-none focus:border-zinc-900 transition-colors`} />
                            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900">
                                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {errors.confirmPassword && <p className="text-[10px] font-bold text-red-500 mt-1">{errors.confirmPassword}</p>}
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1.5 block">Interested Package *</label>
                        <div className="grid grid-cols-3 gap-2">
                            {INTERESTED_PACKAGES.map(pkg => (
                                <button key={pkg} type="button" onClick={() => updateField("interestedPackage", pkg)}
                                    className={`h-10 rounded-2xl text-[10px] font-black transition-all ${
                                        form.interestedPackage === pkg
                                            ? "bg-zinc-900 text-white shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
                                            : "bg-zinc-50 text-zinc-600 border border-black/5 hover:bg-zinc-100"
                                    }`}>
                                    {pkg}
                                </button>
                            ))}
                        </div>
                        {errors.interestedPackage && <p className="text-[10px] font-bold text-red-500 mt-1">{errors.interestedPackage}</p>}
                    </div>

                    <button type="submit" disabled={loading}
                        className="w-full h-12 rounded-2xl bg-zinc-900 text-white text-xs font-black hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                        {loading ? "Creating Account..." : "Create Account"}
                    </button>
                </form>

                <p className="text-center mt-4 text-[10px] font-bold text-zinc-400">
                    Already have an account?{" "}
                    <Link to="/" className="text-zinc-900 hover:underline">Log in</Link>
                </p>
            </motion.div>
        </div>
    );
}
