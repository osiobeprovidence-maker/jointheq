
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { auth } from "../lib/auth";
import { Logo } from "../components/ui/Logo";
import { CheckCircle, XCircle, Loader2, ArrowRight } from "lucide-react";

type Status = "loading" | "needs_login" | "accepting" | "success" | "error";

export default function AdminAcceptPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token");
    const [status, setStatus] = useState<Status>("loading");
    const [errorMsg, setErrorMsg] = useState("");
    const [acceptedRole, setAcceptedRole] = useState("");

    const acceptInvite = useMutation(api.adminWorkforce.acceptAdminInvitation);

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setErrorMsg("Missing invitation token. Please check the link you received.");
            return;
        }

        const user = auth.getCurrentUser();
        if (!user) {
            setStatus("needs_login");
            return;
        }

        setStatus("accepting");
        acceptInvite({ token, userId: user._id as any })
            .then((result) => {
                setAcceptedRole(result.role);
                setStatus("success");
                // Refresh the auth user in localStorage with updated admin fields
                const updated = { ...user, is_admin: true, admin_role: result.role };
                auth.login(updated as any);
            })
            .catch((err) => {
                setStatus("error");
                setErrorMsg(err.message || "Failed to accept invitation");
            });
    }, [token, acceptInvite, navigate]);

    return (
        <div className="min-h-screen bg-[#f4f5f8] flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-lg border border-zinc-100 p-8 text-center">
                <Logo className="w-14 h-14 mx-auto mb-6" />

                {status === "loading" && (
                    <div className="flex flex-col items-center gap-4 py-8">
                        <Loader2 size={32} className="animate-spin text-zinc-400" />
                        <p className="text-zinc-500 text-sm">Verifying invitation...</p>
                    </div>
                )}

                {status === "needs_login" && (
                    <div className="flex flex-col items-center gap-4 py-6">
                        <XCircle size={40} className="text-amber-500" />
                        <h2 className="text-xl font-bold text-zinc-900">Sign in to accept invite</h2>
                        <p className="text-zinc-500 text-sm max-w-xs">
                            You need to sign in with the account that was invited before you can accept.
                        </p>
                        <Link
                            to={`/?admin-invite=${encodeURIComponent(token || "")}`}
                            className="mt-2 inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-2xl font-bold text-sm hover:scale-105 transition-transform"
                        >
                            Sign In <ArrowRight size={16} />
                        </Link>
                    </div>
                )}

                {status === "accepting" && (
                    <div className="flex flex-col items-center gap-4 py-8">
                        <Loader2 size={32} className="animate-spin text-zinc-900" />
                        <p className="text-zinc-700 font-medium">Accepting invitation...</p>
                    </div>
                )}

                {status === "success" && (
                    <div className="flex flex-col items-center gap-4 py-6">
                        <CheckCircle size={48} className="text-emerald-500" />
                        <h2 className="text-xl font-bold text-zinc-900">Welcome to the team!</h2>
                        <p className="text-zinc-500 text-sm max-w-xs">
                            You've been granted <span className="font-semibold text-zinc-800 capitalize">{acceptedRole}</span> admin access.
                        </p>
                        <button
                            onClick={() => navigate("/admin")}
                            className="mt-2 inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-2xl font-bold text-sm hover:scale-105 transition-transform"
                        >
                            Go to Admin Panel <ArrowRight size={16} />
                        </button>
                    </div>
                )}

                {status === "error" && (
                    <div className="flex flex-col items-center gap-4 py-6">
                        <XCircle size={48} className="text-red-500" />
                        <h2 className="text-xl font-bold text-zinc-900">Invitation failed</h2>
                        <p className="text-red-600 text-sm max-w-xs bg-red-50 px-4 py-2 rounded-xl">
                            {errorMsg}
                        </p>
                        <Link
                            to="/"
                            className="mt-2 text-sm text-zinc-500 underline hover:text-zinc-800 transition-colors"
                        >
                            Go back home
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
