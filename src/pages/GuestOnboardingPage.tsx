import { FormEvent, useMemo, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { ArrowRight, CheckCircle2, Copy, CreditCard, Mail, Phone, ShieldCheck, User as UserIcon, Lock, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../../convex/_generated/api";
import { auth } from "../lib/auth";
import { Logo } from "../components/ui/Logo";
import { fmtCurrency } from "../lib/utils";
import { getUserFacingErrorMessage } from "../lib/errors";

const GUEST_ONBOARDING_SELECTION_KEY = "guest_onboarding_selection";

type ActiveSlot = {
  _id: string;
  sub_name?: string;
  name?: string;
  price?: number;
  current_members?: number;
  capacity?: number;
  min_q_score?: number;
  category?: string;
  sub_logo?: string;
  features?: string[];
};

function buildUsernameSeed(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 20);
}

export default function GuestOnboardingPage() {
  const navigate = useNavigate();
  const createUser = useMutation(api.users.createUser);
  const login = useMutation(api.users.login);
  const sendVerificationEmail = useAction(api.actions.sendVerificationEmail);
  const activeSubscriptions = (useQuery(api.subscriptions.getActiveSubscriptions) || []) as ActiveSlot[];

  const referredByCode = new URLSearchParams(window.location.search).get("ref")?.trim();
  const [isLoading, setIsLoading] = useState(false);
  const [stage, setStage] = useState<"account" | "plans">("account");
  const [createdName, setCreatedName] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const featuredPlans = useMemo(
    () =>
      activeSubscriptions
        .slice()
        .sort((a, b) => Number(a.price || 0) - Number(b.price || 0))
        .slice(0, 8),
    [activeSubscriptions],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const usernameBase = buildUsernameSeed(formData.name || formData.email.split("@")[0] || "guest");
      const username = `${usernameBase || "guest"}${Math.floor(100 + Math.random() * 900)}`;

      await createUser({
        email: formData.email,
        full_name: formData.name,
        username,
        phone: formData.phone,
        password_hash: formData.password,
        verification_token: token,
        verification_token_expires: expires,
        referred_by_code: referredByCode?.toUpperCase() || undefined,
      });

      try {
        await sendVerificationEmail({
          email: formData.email,
          name: formData.name,
          token,
          baseUrl: window.location.origin,
        });
      } catch (emailError) {
        console.warn("Verification email could not be sent during guest onboarding", emailError);
      }

      const loginResult = await login({
        identifier: formData.email,
        password: formData.password,
      });

      if (!loginResult.success || !loginResult.user) {
        throw new Error(loginResult.error || "Account created, but automatic login failed.");
      }

      auth.login(loginResult.user as any);
      setCreatedName(formData.name);
      setStage("plans");
      toast.success("Account created. Choose a service to continue.");
    } catch (error: any) {
      toast.error(getUserFacingErrorMessage(error, "Unable to create account"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPlan = (plan: ActiveSlot) => {
    const selection = {
      slotTypeId: plan._id,
      subscriptionName: plan.sub_name || "Selected plan",
      slotName: plan.name || "Plan",
      price: Number(plan.price || 0),
      category: plan.category || "",
      selectedAt: Date.now(),
    };

    sessionStorage.setItem(GUEST_ONBOARDING_SELECTION_KEY, JSON.stringify(selection));
    toast.success("Plan saved. Continue with bank transfer.");
    navigate("/fund-wallet");
  };

  const copyGuestLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("Guest onboarding link copied");
  };

  return (
    <div className="min-h-screen bg-[#f5f5f2] text-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 rounded-[2.5rem] bg-white p-5 shadow-[0_20px_50px_rgba(0,0,0,0.05)] sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-4">
            <Logo className="h-12 w-12" />
            <div>
              <div className="text-xs font-black uppercase tracking-[0.28em] text-zinc-400">Join the Queue</div>
              <h1 className="text-2xl font-black tracking-tight">Guest Onboarding</h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={copyGuestLink}
              className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-4 py-2 text-sm font-bold text-zinc-700 transition hover:bg-zinc-200"
            >
              <Copy size={16} />
              Copy Link
            </button>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-black"
            >
              Main Site
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[3rem] bg-gradient-to-br from-zinc-950 via-zinc-900 to-emerald-900 p-8 text-white shadow-2xl">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-white/70">
              <ShieldCheck size={14} />
              Admin-shareable onboarding
            </div>
            <h2 className="max-w-xl text-4xl font-black leading-tight sm:text-5xl">
              Create the account first.
              <span className="block text-white/45">Let payment happen after.</span>
            </h2>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/70">
              This page helps new guests skip the usual signup friction. They fill one form, get their Join the Queue account created instantly, then move straight into service selection and local bank transfer.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                  <UserIcon size={18} />
                </div>
                <div className="text-lg font-black">1. Guest fills form</div>
                <p className="mt-2 text-sm text-white/60">Name, email, phone, and password are enough to create the account.</p>
              </div>
              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                  <Sparkles size={18} />
                </div>
                <div className="text-lg font-black">2. Pick a service</div>
                <p className="mt-2 text-sm text-white/60">They immediately see active plans they can fund for next.</p>
              </div>
              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                  <CreditCard size={18} />
                </div>
                <div className="text-lg font-black">3. Pay by transfer</div>
                <p className="mt-2 text-sm text-white/60">We send them into the existing wallet funding flow for manual transfer review.</p>
              </div>
            </div>
          </section>

          <section className="rounded-[3rem] bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.06)] sm:p-8">
            {stage === "account" ? (
              <>
                <div className="mb-8">
                  <div className="text-xs font-black uppercase tracking-[0.28em] text-emerald-600">Step 1</div>
                  <h2 className="mt-2 text-3xl font-black tracking-tight">Create guest account</h2>
                  <p className="mt-2 text-sm text-zinc-500">
                    Once this is submitted, the account is created and the guest is signed in immediately.
                  </p>
                </div>

                {referredByCode ? (
                  <div className="mb-6 rounded-[2rem] border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-bold text-blue-700">
                    Referral detected: {referredByCode}
                  </div>
                ) : null}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <Field
                    icon={<UserIcon size={18} />}
                    label="Full Name"
                    value={formData.name}
                    onChange={(value) => setFormData((current) => ({ ...current, name: value }))}
                    placeholder="John Doe"
                    type="text"
                  />
                  <Field
                    icon={<Mail size={18} />}
                    label="Email Address"
                    value={formData.email}
                    onChange={(value) => setFormData((current) => ({ ...current, email: value }))}
                    placeholder="john@example.com"
                    type="email"
                  />
                  <Field
                    icon={<Phone size={18} />}
                    label="Phone Number"
                    value={formData.phone}
                    onChange={(value) => setFormData((current) => ({ ...current, phone: value }))}
                    placeholder="+234 800 000 0000"
                    type="tel"
                  />
                  <Field
                    icon={<Lock size={18} />}
                    label="Password"
                    value={formData.password}
                    onChange={(value) => setFormData((current) => ({ ...current, password: value }))}
                    placeholder="Choose a password"
                    type="password"
                  />

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-[2rem] bg-zinc-950 px-6 py-5 text-sm font-black text-white shadow-xl shadow-black/10 transition hover:scale-[1.01] hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLoading ? "Creating account..." : "Create Account And Continue"}
                    <ArrowRight size={16} />
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="mb-8 flex flex-col gap-4 rounded-[2rem] bg-emerald-50 p-5 text-emerald-900">
                  <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.24em] text-emerald-600">
                    <CheckCircle2 size={16} />
                    Account Ready
                  </div>
                  <div>
                    <h2 className="text-3xl font-black tracking-tight">{createdName || "Guest"}, choose a service</h2>
                    <p className="mt-2 text-sm font-medium text-emerald-800/80">
                      Your account is live. Pick the plan you want, then continue to bank transfer funding.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {featuredPlans.length === 0 ? (
                    <div className="rounded-[2rem] bg-zinc-50 p-6 text-sm font-bold text-zinc-500">
                      No active plans are available right now. You can still continue to your dashboard after signup.
                    </div>
                  ) : (
                    featuredPlans.map((plan) => (
                      <button
                        key={plan._id}
                        type="button"
                        onClick={() => handleSelectPlan(plan)}
                        className="w-full rounded-[2rem] border border-black/5 bg-zinc-50 p-5 text-left transition hover:border-black/10 hover:bg-white hover:shadow-lg"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-3">
                              {plan.sub_logo ? (
                                <img src={plan.sub_logo} alt={plan.sub_name || "Plan"} className="h-11 w-11 rounded-2xl bg-white object-contain p-2" />
                              ) : (
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-950 text-sm font-black text-white">
                                  {(plan.sub_name || "Q").slice(0, 1)}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="truncate text-lg font-black text-zinc-950">{plan.sub_name || "Subscription"}</div>
                                <div className="truncate text-sm font-bold text-zinc-400">{plan.name || "Shared slot"}</div>
                              </div>
                            </div>
                            {plan.features?.length ? (
                              <div className="mt-3 text-xs font-medium text-zinc-500">
                                {plan.features.slice(0, 3).join(" • ")}
                              </div>
                            ) : null}
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-black text-zinc-950">{fmtCurrency(Number(plan.price || 0))}</div>
                            <div className="mt-1 text-[11px] font-black uppercase tracking-[0.24em] text-zinc-400">
                              {Math.max(0, Number(plan.capacity || 0) - Number(plan.current_members || 0))} spots left
                            </div>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="mt-6 w-full rounded-[2rem] bg-zinc-100 px-6 py-4 text-sm font-black text-zinc-700 transition hover:bg-zinc-200"
                >
                  Skip for now and go to dashboard
                </button>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({
  icon,
  label,
  value,
  onChange,
  placeholder,
  type,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 ml-1 block text-[11px] font-black uppercase tracking-[0.24em] text-zinc-400">{label}</span>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-400">{icon}</div>
        <input
          type={type}
          required
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-[1.5rem] border border-black/5 bg-zinc-50 py-4 pl-12 pr-4 text-sm font-bold text-zinc-950 outline-none transition focus:border-zinc-300 focus:bg-white focus:ring-4 focus:ring-black/5"
        />
      </div>
    </label>
  );
}
