import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Handshake, Eye, EyeOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function PartnerLoginPage() {
  const navigate = useNavigate();
  const partnerLogin = useMutation(api.partners.partnerLogin);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Please enter email and password"); return; }
    setLoading(true);
    try {
      const result = await partnerLogin({ email, password });
      if (result.success) {
        localStorage.setItem("partner_token", result.token!);
        localStorage.setItem("partner_id", result.partner!._id);
        toast.success("Welcome back!");
        navigate("/dashboard");
      } else {
        toast.error(result.error || "Login failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600/20">
            <Handshake className="text-indigo-400" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white">Partner Portal</h1>
          <p className="mt-1 text-sm text-white/50">Sign in to your partner dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/70">Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-indigo-500"
              placeholder="partner@example.com"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/70">Password</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-10 text-sm text-white outline-none placeholder:text-white/30 focus:border-indigo-500"
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50">
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-white/30">
          Only authorized partners can access this portal.
        </p>
      </div>
    </div>
  );
}
