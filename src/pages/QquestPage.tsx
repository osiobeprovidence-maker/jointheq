import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Compass,
  Filter,
  Headphones,
  History,
  LayoutDashboard,
  Menu,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Trophy,
  User,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { Logo } from "../components/ui/Logo";

type QuestTag = "Sponsored" | "Trending" | "New";
type QuestStatus = "all" | "mine" | "completed";
type NavPage = "dashboard" | "marketplace" | "notifications" | "quest" | "wallet" | "referrals" | "history" | "support" | "profile";
type ConnectedAccount = {
  bankName: string;
  accountNumber: string;
  accountName: string;
  qic: string;
};
type ConnectStatus = "idle" | "loading" | "success" | "error";
type WithdrawStep = "form" | "below-minimum" | "confirm" | "success";
type CreateQquestStep = 1 | 2 | 3 | 4 | 5 | 6;
type ProofRequirement = "Screenshot upload" | "Username input" | "None";
type AudienceType = "Students" | "Creators" | "Gamers" | "General";
type CreateQquestState = {
  questType: string;
  budget: number;
  rewardPerUser: number;
  autoOptimize: boolean;
  title: string;
  instructions: string;
  link: string;
  proofRequirement: ProofRequirement;
  location: string;
  audienceType: AudienceType;
  coverImageName: string;
};

interface Quest {
  id: number;
  title: string;
  reward: string;
  time: string;
  users: string;
  urgency: string;
  tag: QuestTag;
  status: QuestStatus[];
  image: string;
  progress: number;
  accent: string;
  questType?: string;
  budget?: number;
  rewardPerUser?: number;
  estimatedUsers?: number;
  serviceFee?: number;
  location?: string;
  audienceType?: AudienceType;
  proofRequirement?: ProofRequirement;
  instructions?: string;
  link?: string;
  source?: "admin-featured" | "created" | "seed";
}

const walletBalance = 42850;
const minimumWithdrawal = 1000;
const withdrawalFee = 20;
const minimumCampaignBudget = 7500;
const qquestRewardPerUser = 150;
const serviceFeeCap = 2500;
const banks = ["Access Bank", "GTBank", "Zenith Bank", "UBA", "First Bank", "Opay", "Kuda Bank"];

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "marketplace", label: "Marketplace", icon: ShoppingBag },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "quest", label: "Quest", icon: Trophy },
  { id: "wallet", label: "Wallet", icon: Wallet },
  { id: "referrals", label: "Referrals", icon: Users },
  { id: "history", label: "History", icon: History },
  { id: "support", label: "Support", icon: Headphones },
  { id: "profile", label: "Profile", icon: User },
] satisfies { id: NavPage; label: string; icon: typeof LayoutDashboard }[];

const pageTitles: Record<NavPage, string> = {
  dashboard: "Dashboard",
  marketplace: "Marketplace",
  notifications: "Notifications",
  quest: "Quest",
  wallet: "Wallet",
  referrals: "Referrals",
  history: "History",
  support: "Support",
  profile: "Profile",
};

const marketplaceItems = [
  { name: "Netflix Premium Circle", price: "₦1,500/mo", detail: "2 slots open", accent: "from-rose-500 to-red-600" },
  { name: "Spotify Family Seat", price: "₦900/mo", detail: "Instant access", accent: "from-emerald-500 to-lime-500" },
  { name: "YouTube Premium Share", price: "₦1,200/mo", detail: "Verified owner", accent: "from-red-500 to-orange-500" },
  { name: "Canva Pro Team", price: "₦1,000/mo", detail: "Creator tools", accent: "from-cyan-500 to-blue-500" },
];

const notifications = [
  { title: "Quest proof approved", detail: "+₦350 moved to your wallet", time: "8 min ago", tone: "emerald" },
  { title: "New quick quest", detail: "Follow a creator and earn in under a minute", time: "24 min ago", tone: "zinc" },
  { title: "Marketplace slot expiring", detail: "Renew Netflix Premium before tonight", time: "2 hours ago", tone: "amber" },
  { title: "Referral bonus unlocked", detail: "Tomi joined with your code", time: "Yesterday", tone: "emerald" },
];

const historyItems = [
  { title: "PulsePay verification", amount: "+₦350", status: "Completed", date: "Today" },
  { title: "Netflix saver circle", amount: "-₦1,500", status: "Active", date: "Today" },
  { title: "Instagram follow quest", amount: "+₦100", status: "Completed", date: "Yesterday" },
  { title: "Wallet top up", amount: "+₦10,000", status: "Settled", date: "Apr 30" },
  { title: "Watch Video", amount: "+₦200", status: "Completed", date: "Apr 29" },
  { title: "Withdrawal (₦1,000 + ₦20 fee)", amount: "-₦1,020", status: "Pending", date: "Apr 28" },
];

const quests: Quest[] = [
  {
    id: 1,
    title: "Follow @joinqueue on Instagram",
    reward: "Earn ₦100",
    time: "20 seconds",
    users: "1.2k joined",
    urgency: "120 spots left",
    tag: "Sponsored",
    status: ["all", "mine"],
    image:
      "linear-gradient(135deg, rgba(31,241,176,.78), rgba(41,64,255,.52)), url('/qquest-hero-bg.png')",
    progress: 72,
    accent: "from-emerald-500 to-cyan-500",
  },
  {
    id: 2,
    title: "Watch the trailer for Neon Rush",
    reward: "Earn ₦250",
    time: "2 minutes",
    users: "8.4k joined",
    urgency: "Ends in 2 days",
    tag: "Trending",
    status: ["all"],
    image:
      "linear-gradient(135deg, rgba(245,91,255,.68), rgba(20,24,39,.28)), url('/qquest-hero-bg.png')",
    progress: 44,
    accent: "from-fuchsia-500 to-violet-500",
  },
  {
    id: 3,
    title: "Join a Netflix saver circle",
    reward: "Earn ₦500",
    time: "3 minutes",
    users: "956 joined",
    urgency: "48 spots left",
    tag: "New",
    status: ["all", "mine"],
    image:
      "linear-gradient(135deg, rgba(255,75,75,.72), rgba(15,15,20,.22)), url('/qquest-hero-bg.png')",
    progress: 61,
    accent: "from-rose-500 to-amber-500",
  },
  {
    id: 4,
    title: "Download PulsePay and verify",
    reward: "Earn ₦350",
    time: "5 minutes",
    users: "2.1k joined",
    urgency: "Ends tonight",
    tag: "Sponsored",
    status: ["all", "completed"],
    image:
      "linear-gradient(135deg, rgba(68,229,255,.7), rgba(27,245,157,.46)), url('/qquest-hero-bg.png')",
    progress: 100,
    accent: "from-sky-500 to-emerald-500",
  },
  {
    id: 5,
    title: "Share a creator referral link",
    reward: "Earn ₦150",
    time: "45 seconds",
    users: "633 joined",
    urgency: "300 spots left",
    tag: "New",
    status: ["all"],
    image:
      "linear-gradient(135deg, rgba(255,206,84,.76), rgba(255,84,112,.42)), url('/qquest-hero-bg.png')",
    progress: 35,
    accent: "from-yellow-500 to-rose-500",
  },
  {
    id: 6,
    title: "Join the creator launch server",
    reward: "Earn ₦200",
    time: "1 minute",
    users: "4.9k joined",
    urgency: "Ends in 6 hours",
    tag: "Trending",
    status: ["all", "completed"],
    image:
      "linear-gradient(135deg, rgba(94,92,255,.7), rgba(15,15,20,.42)), url('/qquest-hero-bg.png')",
    progress: 100,
    accent: "from-indigo-500 to-cyan-500",
  },
];

const sortOptions = ["Suggested", "Highest Paying", "Quick Tasks", "Trending"];
const questTypeOptions = [
  { title: "Follow", description: "Instagram, TikTok, X, and creator pages.", time: "20 sec", emoji: "👥" },
  { title: "Like / Comment", description: "Boost engagement on posts and launches.", time: "30 sec", emoji: "👍" },
  { title: "Watch Video", description: "Drive attention to trailers and explainers.", time: "2 min", emoji: "▶️" },
  { title: "App Download", description: "Get installs and verified onboarding.", time: "5 min", emoji: "📲" },
  { title: "Product Review", description: "Collect feedback and public reviews.", time: "4 min", emoji: "🏆" },
  { title: "Custom Task", description: "Define your own action and proof rules.", time: "Custom", emoji: "⚡" },
];

const adminFeaturedQuest: Quest = {
  id: 9001,
  title: "Earn ₦500 Watching Netflix",
  reward: "Earn ₦150",
  time: "3 minutes",
  users: "4.2k joined",
  urgency: "150 featured slots",
  tag: "Sponsored",
  status: ["all"],
  image: "linear-gradient(135deg, rgba(15,15,20,.76), rgba(16,185,129,.26)), url('/qquest-hero-bg.png')",
  progress: 45,
  accent: "from-emerald-300 to-cyan-300",
  questType: "Watch Video",
  budget: 22500,
  rewardPerUser: qquestRewardPerUser,
  estimatedUsers: 150,
  serviceFee: 2250,
  location: "Nigeria",
  audienceType: "General",
  proofRequirement: "Screenshot upload",
  instructions: "Watch the featured campaign video, complete the required action, and submit proof for review.",
  link: "https://qquest.app/featured/netflix",
  source: "admin-featured",
};

function campaignToQuest(form: CreateQquestState, estimatedUsers: number, serviceFee: number): Quest {
  const tag: QuestTag = "New";
  return {
    id: Date.now(),
    title: form.title || `${form.questType} Qquest`,
    reward: `Earn ₦${qquestRewardPerUser.toLocaleString()}`,
    time: questTypeOptions.find((option) => option.title === form.questType)?.time || "Custom",
    users: "0 joined",
    urgency: `${estimatedUsers.toLocaleString()} spots left`,
    tag,
    status: ["all", "mine"],
    image: "linear-gradient(135deg, rgba(31,241,176,.7), rgba(41,64,255,.44)), url('/qquest-hero-bg.png')",
    progress: 0,
    accent: "from-emerald-500 to-cyan-500",
    questType: form.questType,
    budget: Math.max(minimumCampaignBudget, form.budget),
    rewardPerUser: qquestRewardPerUser,
    estimatedUsers,
    serviceFee,
    location: form.location,
    audienceType: form.audienceType,
    proofRequirement: form.proofRequirement,
    instructions: form.instructions,
    link: form.link,
    source: "created",
  };
}

function QuestCard({ quest, onOpen }: { quest: Quest; onOpen: (quest: Quest) => void }) {
  const reward = quest.rewardPerUser ?? (Number(quest.reward.replace(/\D/g, "")) || qquestRewardPerUser);
  const reach = quest.estimatedUsers ? `${quest.estimatedUsers.toLocaleString()} target users` : quest.users;
  const budget = quest.budget ? `Budget ₦${quest.budget.toLocaleString()}` : quest.urgency;

  return (
    <button
      onClick={() => onOpen(quest)}
      className="group overflow-hidden rounded-[1.5rem] border border-black/5 bg-white text-left shadow-[0_18px_44px_rgba(15,15,20,.07)] transition duration-300 hover:-translate-y-1.5 hover:border-emerald-300/70 hover:shadow-[0_24px_60px_rgba(16,185,129,.16)]"
    >
      <div className="relative h-40 bg-cover bg-center" style={{ backgroundImage: quest.image }}>
        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-black uppercase tracking-[.16em] text-zinc-900 shadow-sm backdrop-blur-md">
          {quest.tag}
        </span>
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      <div className="space-y-4 p-5">
        <div>
          <h3 className="min-h-12 text-base font-black leading-snug text-zinc-950">{quest.title}</h3>
          <p className={`mt-2 bg-gradient-to-r ${quest.accent} bg-clip-text text-xl font-black text-transparent`}>
            Earn ₦{reward.toLocaleString()}
          </p>
          <p className="mt-1 text-xs font-black uppercase tracking-[.12em] text-zinc-400">{quest.questType || "Qquest"} · {quest.location || "Nigeria"}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs font-bold text-zinc-500">
          <span className="flex items-center gap-1.5">
            <Clock3 size={14} />
            {quest.time}
          </span>
          <span className="flex items-center gap-1.5">
            <Users size={14} />
            {reach}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-black text-zinc-500">
            <span>{budget}</span>
            <span>{quest.progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
            <div className={`h-full rounded-full bg-gradient-to-r ${quest.accent}`} style={{ width: `${quest.progress}%` }} />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-zinc-50 p-1.5">
          <span className="pl-3 text-xs font-black uppercase tracking-[.14em] text-zinc-400">{quest.proofRequirement || "Proof review"}</span>
          <span className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-black text-white transition group-hover:scale-105">
            Start Quest
          </span>
        </div>
      </div>
    </button>
  );
}

function CreateQuestModal({ onClose, onLaunch }: { onClose: () => void; onLaunch: (quest: Quest) => void }) {
  const [step, setStep] = useState<CreateQquestStep>(1);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isLaunched, setIsLaunched] = useState(false);
  const [launchedQuest, setLaunchedQuest] = useState<Quest | null>(null);
  const [form, setForm] = useState<CreateQquestState>({
    questType: "Follow",
    budget: 15000,
    rewardPerUser: qquestRewardPerUser,
    autoOptimize: true,
    title: "Follow @joinqueue on Instagram",
    instructions: "Open the Qquest link, complete the action, and submit proof.",
    link: "",
    proofRequirement: "Screenshot upload",
    location: "Nigeria",
    audienceType: "General",
    coverImageName: "",
  });

  const normalizedBudget = Math.max(minimumCampaignBudget, form.budget);
  const estimatedUsers = Math.max(50, Math.floor(normalizedBudget / qquestRewardPerUser));
  const platformFee = Math.min(Math.round(normalizedBudget * 0.1), serviceFeeCap);
  const totalCost = normalizedBudget + platformFee;
  const progress = (step / 6) * 100;
  const updateForm = (patch: Partial<CreateQquestState>) => setForm((current) => ({ ...current, ...patch }));
  const goNext = () => setStep((current) => Math.min(6, current + 1) as CreateQquestStep);
  const goBack = () => setStep((current) => Math.max(1, current - 1) as CreateQquestStep);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/65 p-3 backdrop-blur-sm">
      <div className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-[#0f0f14] text-white shadow-[0_30px_100px_rgba(0,0,0,.5)]">
        <div className="border-b border-white/10 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black tracking-tight">{isLaunched ? "Qquest Active" : "Create Qquest"}</h2>
              <p className="mt-1 text-sm font-bold text-white/45">Turn money into real users instantly.</p>
            </div>
            <button onClick={onClose} className="rounded-xl bg-white/10 p-2 text-white/60 transition hover:bg-white/15 hover:text-white" aria-label="Close create qquest">
              <X size={20} />
            </button>
          </div>
          {!isLaunched ? (
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-[10px] font-black uppercase tracking-[.14em] text-white/35">
                <span>Step {step} of 6</span>
                <span>{step < 5 ? `Step ${step}` : step === 5 ? "Review" : "Payment"}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-[#F26522] transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : null}
        </div>

        <div className="overflow-y-auto p-5">
          {isLaunched ? (
            <PostLaunchState quest={launchedQuest} estimatedUsers={estimatedUsers} onClose={onClose} />
          ) : (
            <div className="transition-all duration-300">
              {step === 1 && <QuestTypeSelector value={form.questType} onChange={(questType) => updateForm({ questType })} />}
              {step === 2 && <BudgetCalculator form={form} estimatedUsers={estimatedUsers} onChange={updateForm} />}
              {step === 3 && <QuestDetailsForm form={form} onChange={updateForm} />}
              {step === 4 && <TargetingForm form={form} onChange={updateForm} />}
              {step === 5 && <ReviewSummary form={form} estimatedUsers={estimatedUsers} platformFee={platformFee} totalCost={totalCost} onEdit={(targetStep) => setStep(targetStep)} />}
              {step === 6 && (
                <div className="space-y-5">
                  <ReviewSummary form={form} estimatedUsers={estimatedUsers} platformFee={platformFee} totalCost={totalCost} onEdit={(targetStep) => setStep(targetStep)} compact />
                  <div className="rounded-2xl border border-[#F26522]/30 bg-[#F26522]/10 p-5">
                    <h3 className="text-xl font-black text-orange-100">Fund your Qquest to go live</h3>
                    <p className="mt-2 text-sm font-bold leading-6 text-orange-100/65">Your campaign is ready. Payment reserves rewards for workers before the Qquest becomes active.</p>
                    <button onClick={() => setIsPaymentOpen(true)} className="mt-5 w-full rounded-2xl bg-white px-5 py-4 text-sm font-black text-zinc-950 shadow-[0_0_32px_rgba(16,185,129,.18)] transition hover:scale-[1.01]">
                      Promote Qquest
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {!isLaunched && step < 6 ? (
          <div className="grid grid-cols-2 gap-3 border-t border-white/10 p-4">
            <button onClick={goBack} disabled={step === 1} className="rounded-2xl bg-white/10 px-5 py-4 text-sm font-black text-white transition hover:bg-white/15 disabled:opacity-40">
              Back
            </button>
            <button onClick={goNext} className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-zinc-950 shadow-[0_0_26px_rgba(34,211,238,.18)] transition hover:scale-[1.01]">
              Continue
            </button>
          </div>
        ) : null}
      </div>

      {isPaymentOpen && (
        <PaymentModal
          totalCost={totalCost}
          onClose={() => setIsPaymentOpen(false)}
          onPaid={() => {
            const quest = campaignToQuest(form, estimatedUsers, platformFee);
            setLaunchedQuest(quest);
            onLaunch(quest);
            setIsPaymentOpen(false);
            setIsLaunched(true);
          }}
        />
      )}
    </div>
  );
}

function QuestTypeSelector({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-2xl font-black">Select Quest Type</h3>
        <p className="mt-2 text-sm font-bold text-white/45">Choose the action you want people to complete.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {questTypeOptions.map((option) => {
          const active = value === option.title;
          return (
            <button
              key={option.title}
              onClick={() => onChange(option.title)}
              className={`group rounded-2xl border p-4 text-left transition hover:-translate-y-1 ${active ? "border-[#F26522] bg-[#F26522]/12 shadow-[0_0_34px_rgba(242,101,34,.18)]" : "border-white/10 bg-white/6 hover:border-[#F26522]/45"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className={`grid h-11 w-11 place-items-center rounded-xl text-xl ${active ? "bg-[#F26522] text-white" : "bg-white/10 text-white"}`}>
                  <span aria-hidden="true">{option.emoji}</span>
                </div>
                <span className="rounded-full bg-white/8 px-3 py-1 text-xs font-black text-white/55">{option.time}</span>
              </div>
              <h4 className="mt-4 font-black">{option.title}</h4>
              <p className="mt-2 text-sm font-bold leading-6 text-white/45">{option.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BudgetCalculator({
  form,
  estimatedUsers,
  onChange,
}: {
  form: CreateQquestState;
  estimatedUsers: number;
  onChange: (patch: Partial<CreateQquestState>) => void;
}) {
  const setBudget = (budget: number) => {
    const nextBudget = Math.max(minimumCampaignBudget, budget);
    onChange({
      budget: nextBudget,
      rewardPerUser: qquestRewardPerUser,
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-2xl font-black">Budget + Reach Calculator</h3>
        <p className="mt-2 text-sm font-bold text-white/45">Always know what your money is doing.</p>
      </div>
      <div className="rounded-2xl border border-[#F26522]/25 bg-[#F26522]/10 p-5 shadow-[0_0_42px_rgba(242,101,34,.08)]">
        <label className="block">
          <span className="text-xs font-black uppercase tracking-[.16em] text-white/35">Total Budget</span>
          <div className="mt-3 flex items-center rounded-2xl bg-white/10 px-4 py-3">
            <span className="text-2xl font-black text-white/45">₦</span>
            <input value={form.budget} onChange={(event) => setBudget(Number(event.target.value) || 0)} className="w-full bg-transparent px-2 text-4xl font-black text-white outline-none" type="number" min={minimumCampaignBudget} />
          </div>
          <p className="mt-3 text-xs font-black uppercase tracking-[.14em] text-orange-100/60">Minimum budget is ₦{minimumCampaignBudget.toLocaleString()}</p>
        </label>
        <input value={form.budget} onChange={(event) => setBudget(Number(event.target.value))} className="mt-5 w-full accent-[#F26522]" type="range" min={minimumCampaignBudget} max={100000} step={500} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white/7 p-4">
          <p className="text-xs font-black uppercase tracking-[.16em] text-white/35">Reward per user</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-3xl font-black">₦{qquestRewardPerUser.toLocaleString()}</span>
          </div>
          <p className="mt-2 text-xs font-bold text-white/35">Fixed platform reward</p>
        </div>
        <div className="rounded-2xl bg-white/7 p-4 shadow-[0_0_36px_rgba(16,185,129,.08)]">
          <p className="text-xs font-black uppercase tracking-[.16em] text-white/35">Estimated users</p>
          <p className="mt-3 text-4xl font-black text-[#F26522] transition-all duration-500">{estimatedUsers.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl bg-[#F26522] p-4 text-white">
          <p className="text-xs font-black uppercase tracking-[.16em] opacity-60">Service fee</p>
          <p className="mt-3 text-2xl font-black">10%</p>
          <p className="mt-1 text-xs font-bold opacity-60">Capped at ₦{serviceFeeCap.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

function QuestDetailsForm({ form, onChange }: { form: CreateQquestState; onChange: (patch: Partial<CreateQquestState>) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-2xl font-black">Quest Details</h3>
        <p className="mt-2 text-sm font-bold text-white/45">Add the action link, instructions, and proof rule.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <DarkField label="Quest Title" value={form.title} onChange={(title) => onChange({ title })} placeholder="Follow @joinqueue on Instagram" />
        <DarkField label="Qquest Link" value={form.link} onChange={(link) => onChange({ link })} placeholder="https://instagram.com/joinqueue" />
        <label className="space-y-2 sm:col-span-2">
          <span className="text-xs font-black uppercase tracking-[.16em] text-white/35">Task Instructions</span>
          <textarea value={form.instructions} onChange={(event) => onChange({ instructions: event.target.value })} className="min-h-28 w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-white/25" placeholder="Tell users exactly what to do." />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-black uppercase tracking-[.16em] text-white/35">Proof Requirement</span>
          <select value={form.proofRequirement} onChange={(event) => onChange({ proofRequirement: event.target.value as ProofRequirement })} className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm font-black text-white outline-none">
            {["Screenshot upload", "Username input", "None"].map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <DarkField label="Cover Image" value={form.coverImageName} onChange={(coverImageName) => onChange({ coverImageName })} placeholder="Optional image name" />
      </div>
    </div>
  );
}

function TargetingForm({ form, onChange }: { form: CreateQquestState; onChange: (patch: Partial<CreateQquestState>) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-2xl font-black">Targeting</h3>
        <p className="mt-2 text-sm font-bold text-white/45">Optional, but useful for sharper campaigns.</p>
      </div>
      <DarkField label="Location" value={form.location} onChange={(location) => onChange({ location })} placeholder="Nigeria" />
      <div>
        <p className="mb-3 text-xs font-black uppercase tracking-[.16em] text-white/35">Audience Type</p>
        <div className="grid gap-3 sm:grid-cols-4">
          {(["Students", "Creators", "Gamers", "General"] as AudienceType[]).map((audienceType) => (
            <button key={audienceType} onClick={() => onChange({ audienceType })} className={`rounded-2xl px-4 py-4 text-sm font-black transition hover:-translate-y-1 ${form.audienceType === audienceType ? "bg-[#F26522] text-white shadow-[0_0_30px_rgba(242,101,34,.18)]" : "bg-white/7 text-white/65"}`}>
              {audienceType}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReviewSummary({
  form,
  estimatedUsers,
  platformFee,
  totalCost,
  onEdit,
  compact = false,
}: {
  form: CreateQquestState;
  estimatedUsers: number;
  platformFee: number;
  totalCost: number;
  onEdit: (step: CreateQquestStep) => void;
  compact?: boolean;
}) {
  const displayBudget = Math.max(minimumCampaignBudget, form.budget);
  return (
    <div className="space-y-5">
      {!compact ? (
        <div>
          <h3 className="text-2xl font-black">Review Summary</h3>
          <p className="mt-2 text-sm font-bold text-white/45">Ready to Launch</p>
        </div>
      ) : null}
      <div className="rounded-2xl border border-[#F26522]/25 bg-white/7 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="rounded-full bg-[#F26522] px-3 py-1 text-xs font-black text-white">Ready to Launch</span>
            <h4 className="mt-4 text-xl font-black">{form.title}</h4>
            <p className="mt-2 text-sm font-bold text-white/45">{form.questType} · {form.location} · {form.audienceType}</p>
          </div>
          <button onClick={() => onEdit(3)} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-black text-white/70">Edit</button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <SummaryItem label="Total Budget" value={`₦${displayBudget.toLocaleString()}`} />
          <SummaryItem label="Reward per user" value={`₦${qquestRewardPerUser.toLocaleString()}`} />
          <SummaryItem label="Estimated users" value={`${estimatedUsers.toLocaleString()} users`} />
          <SummaryItem label="Platform Fee" value={`₦${platformFee.toLocaleString()}`} />
        </div>
        <div className="mt-4 rounded-2xl bg-zinc-950 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-black text-white/45">Total Cost</span>
            <span className="text-2xl font-black text-white">₦{totalCost.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentModal({ totalCost, onClose, onPaid }: { totalCost: number; onClose: () => void; onPaid: () => void }) {
  const [method, setMethod] = useState<"wallet" | "gateway">("wallet");

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-[#0f0f14] p-5 text-white shadow-[0_28px_90px_rgba(0,0,0,.55)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-black">Fund your Qquest to go live</h3>
            <p className="mt-2 text-sm font-bold text-white/45">Reserve ₦{totalCost.toLocaleString()} for campaign delivery.</p>
          </div>
          <button onClick={onClose} className="rounded-xl bg-white/10 p-2 text-white/65"><X size={18} /></button>
        </div>
        <div className="mt-5 grid gap-3">
          {[
            ["wallet", "Pay from wallet"],
            ["gateway", "Pay via bank/payment gateway"],
          ].map(([id, label]) => (
            <button key={id} onClick={() => setMethod(id as "wallet" | "gateway")} className={`rounded-2xl border px-4 py-4 text-left text-sm font-black transition ${method === id ? "border-[#F26522] bg-[#F26522]/10 text-orange-100" : "border-white/10 bg-white/7 text-white/60"}`}>
              {label}
            </button>
          ))}
        </div>
        <button onClick={onPaid} className="mt-5 w-full rounded-2xl bg-white px-5 py-4 text-sm font-black text-zinc-950 transition hover:scale-[1.01]">
          Pay and Launch
        </button>
      </div>
    </div>
  );
}

function PostLaunchState({ quest, estimatedUsers, onClose }: { quest: Quest | null; estimatedUsers: number; onClose: () => void }) {
  const completed = Math.max(1, Math.round(estimatedUsers * 0.45));
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[#F26522]/25 bg-[#F26522]/10 p-5 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#F26522] text-white animate-pulse">
          <CheckCircle2 size={30} />
        </div>
        <h3 className="mt-4 text-2xl font-black">{quest?.title || "Quest"} status = Active</h3>
        <p className="mt-2 text-sm font-bold text-orange-100/65">Your Qquest is live, funded, and now appears in the Qquest card list.</p>
      </div>
      <div className="rounded-2xl bg-white/7 p-5">
        <div className="flex items-center justify-between text-sm font-black">
          <span>{completed} / {estimatedUsers} users completed</span>
          <span className="rounded-full bg-[#F26522] px-3 py-1 text-xs text-white">Active</span>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-[#F26522] transition-all duration-700" style={{ width: "45%" }} />
        </div>
      </div>
      <button onClick={onClose} className="w-full rounded-2xl bg-white px-5 py-4 text-sm font-black text-zinc-950">Done</button>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/7 p-4">
      <p className="text-xs font-black uppercase tracking-[.16em] text-white/35">{label}</p>
      <p className="mt-2 text-xl font-black">{value}</p>
    </div>
  );
}

function DarkField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-black uppercase tracking-[.16em] text-white/35">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm font-black text-white outline-none placeholder:text-white/25" placeholder={placeholder} />
    </label>
  );
}

function Field({
  label,
  placeholder,
  wide = false,
  value,
  readOnly = false,
  type = "text",
  min,
  help,
  onChange,
}: {
  label: string;
  placeholder?: string;
  wide?: boolean;
  value?: string;
  readOnly?: boolean;
  type?: string;
  min?: number;
  help?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <label className={`space-y-2 ${wide ? "sm:col-span-2" : ""}`}>
      <span className="text-xs font-black uppercase tracking-[.14em] text-zinc-400">{label}</span>
      <input
        className={`w-full rounded-2xl border border-black/10 px-4 py-3 text-sm font-black text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-950 focus:bg-white focus:shadow-[0_0_0_4px_rgba(24,24,27,.08)] ${
          readOnly ? "bg-zinc-50 text-zinc-500" : "bg-white"
        }`}
        placeholder={placeholder}
        value={value}
        readOnly={readOnly}
        type={type}
        min={min}
        onChange={(event) => onChange?.(event.target.value)}
      />
      {help ? <span className="block text-xs font-bold text-zinc-400">{help}</span> : null}
    </label>
  );
}

function CostRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={`text-sm ${strong ? "font-black text-zinc-950" : "font-bold text-zinc-500"}`}>{label}</span>
      <span className={`text-sm ${strong ? "font-black text-zinc-950" : "font-black text-zinc-700"}`}>{value}</span>
    </div>
  );
}

function QuestDetailModal({
  quest,
  isStarted,
  onBack,
  onStart,
}: {
  quest: Quest;
  isStarted: boolean;
  onBack: () => void;
  onStart: () => void;
}) {
  const [isProofOpen, setIsProofOpen] = useState(false);
  const [proofValue, setProofValue] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const startQuest = () => {
    onStart();
    setIsProofOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 p-3 backdrop-blur-sm">
      <div className="flex max-h-[94vh] w-full max-w-xl flex-col overflow-hidden rounded-[1.5rem] bg-white shadow-[0_30px_90px_rgba(15,15,20,.22)] sm:rounded-[2rem]">
        <div className="flex shrink-0 items-center justify-between border-b border-black/5 bg-white px-4 py-3">
          <button onClick={onBack} className="inline-flex items-center gap-2 rounded-2xl bg-zinc-100 px-3 py-2 text-xs font-black text-zinc-800 transition hover:bg-zinc-200">
            <ArrowLeft size={17} /> Back
          </button>
          <button onClick={onBack} className="inline-flex items-center gap-2 rounded-2xl bg-zinc-950 px-3 py-2 text-xs font-black text-white transition hover:scale-[1.02]">
            <X size={16} /> Cancel
          </button>
        </div>
        <div className="relative h-48 shrink-0 bg-cover bg-center sm:h-56" style={{ backgroundImage: quest.image }}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-5 left-5 right-5">
            <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-black uppercase tracking-[.16em] text-zinc-950">
              {quest.tag}
            </span>
            <h2 className="mt-3 text-2xl font-black text-white">{quest.title}</h2>
          </div>
        </div>
        <div className="space-y-4 overflow-y-auto p-4 sm:p-6">
          <p className={`bg-gradient-to-r ${quest.accent} bg-clip-text text-3xl font-black text-transparent`}>Earn ₦{(quest.rewardPerUser ?? qquestRewardPerUser).toLocaleString()}</p>
          <div className="grid grid-cols-2 gap-3 rounded-2xl bg-zinc-50 p-3 text-xs font-black text-zinc-500">
            <div>
              <p className="uppercase tracking-[.14em] text-zinc-400">Type</p>
              <p className="mt-1 text-zinc-950">{quest.questType || "Qquest"}</p>
            </div>
            <div>
              <p className="uppercase tracking-[.14em] text-zinc-400">Proof</p>
              <p className="mt-1 text-zinc-950">{quest.proofRequirement || "Proof review"}</p>
            </div>
            <div>
              <p className="uppercase tracking-[.14em] text-zinc-400">Campaign budget</p>
              <p className="mt-1 text-zinc-950">{quest.budget ? `₦${quest.budget.toLocaleString()}` : quest.urgency}</p>
            </div>
            <div>
              <p className="uppercase tracking-[.14em] text-zinc-400">Target reach</p>
              <p className="mt-1 text-zinc-950">{quest.estimatedUsers ? `${quest.estimatedUsers.toLocaleString()} users` : quest.users}</p>
            </div>
            <div>
              <p className="uppercase tracking-[.14em] text-zinc-400">Location</p>
              <p className="mt-1 text-zinc-950">{quest.location || "Nigeria"}</p>
            </div>
            <div>
              <p className="uppercase tracking-[.14em] text-zinc-400">Audience</p>
              <p className="mt-1 text-zinc-950">{quest.audienceType || "General"}</p>
            </div>
            <div>
              <p className="uppercase tracking-[.14em] text-zinc-400">Service fee</p>
              <p className="mt-1 text-zinc-950">{quest.serviceFee ? `₦${quest.serviceFee.toLocaleString()}` : "Included"}</p>
            </div>
            <div>
              <p className="uppercase tracking-[.14em] text-zinc-400">Status</p>
              <p className="mt-1 text-zinc-950">{isStarted ? "Active" : quest.source === "admin-featured" ? "Featured" : "Available"}</p>
            </div>
          </div>
          {quest.instructions ? (
            <div className="rounded-2xl bg-zinc-50 p-4">
              <p className="text-xs font-black uppercase tracking-[.14em] text-zinc-400">Campaign details</p>
              <p className="mt-2 text-sm font-bold leading-6 text-zinc-600">{quest.instructions}</p>
              {quest.link ? <p className="mt-2 break-all text-xs font-black text-zinc-950">{quest.link}</p> : null}
            </div>
          ) : null}
          <div className="grid grid-cols-3 gap-3">
            {[quest.time, quest.users, quest.urgency].map((item) => (
              <div key={item} className="rounded-2xl bg-zinc-50 p-3 text-center text-xs font-black text-zinc-500">
                {item}
              </div>
            ))}
          </div>
          {isProofOpen ? (
            <div className="space-y-4 rounded-[1.5rem] bg-zinc-950 p-4 text-white">
              {isSubmitted ? (
                <div className="text-center">
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-300 text-zinc-950 animate-pulse">
                    <CheckCircle2 size={26} />
                  </div>
                  <h3 className="mt-4 text-lg font-black">Proof submitted</h3>
                  <p className="mt-2 text-sm font-bold text-white/50">Your reward will be reviewed and released after approval.</p>
                  <button onClick={onBack} className="mt-5 w-full rounded-2xl bg-white px-5 py-4 text-sm font-black text-zinc-950">
                    Back to Qquests
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <h3 className="text-lg font-black">Submit Proof</h3>
                    <p className="mt-1 text-sm font-bold text-white/45">Paste your username, note, or screenshot reference for review.</p>
                  </div>
                  <textarea
                    value={proofValue}
                    onChange={(event) => setProofValue(event.target.value)}
                    className="min-h-28 w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm font-bold outline-none placeholder:text-white/25"
                    placeholder="@username or proof note"
                  />
                  <button
                    onClick={() => setIsSubmitted(true)}
                    disabled={!proofValue.trim()}
                    className="w-full rounded-2xl bg-white px-5 py-4 text-sm font-black text-zinc-950 transition hover:scale-[1.01] disabled:opacity-40"
                  >
                    Submit Proof
                  </button>
                </>
              )}
            </div>
          ) : isStarted ? (
            <div className="space-y-4 rounded-[1.5rem] bg-emerald-50 p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-emerald-600 shadow-sm">
                  <CheckCircle2 size={19} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-emerald-950">Quest started</h3>
                  <p className="text-xs font-bold text-emerald-700/70">Complete the action, then submit proof from your active quests.</p>
                </div>
              </div>
              <button onClick={() => setIsProofOpen(true)} className="w-full rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black text-white transition hover:-translate-y-0.5">
                Continue to Proof
              </button>
            </div>
          ) : (
            <button
              onClick={startQuest}
              className="w-full rounded-2xl bg-zinc-950 px-5 py-4 text-sm font-black text-white transition hover:-translate-y-0.5"
            >
              Start Quest
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-[1.5rem] bg-white p-5 shadow-[0_12px_36px_rgba(15,15,20,.06)]">
      <p className="text-xs font-black uppercase tracking-[.16em] text-zinc-400">{label}</p>
      <p className="mt-3 text-3xl font-black tracking-tight text-zinc-950">{value}</p>
      <p className="mt-2 text-sm font-bold text-zinc-500">{detail}</p>
    </div>
  );
}

function SectionHeader({ title, action }: { title: string; action?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-xl font-black tracking-tight text-zinc-950">{title}</h2>
      {action ? <button className="text-sm font-black text-zinc-500 transition hover:text-zinc-950">{action}</button> : null}
    </div>
  );
}

function WalletHeaderAction({
  account,
  balance,
  onConnect,
  onWithdraw,
}: {
  account: ConnectedAccount | null;
  balance: number;
  onConnect: () => void;
  onWithdraw: () => void;
}) {
  if (!account) {
    return (
      <button
        onClick={onConnect}
        className="rounded-2xl bg-zinc-950 px-3 py-3 text-xs font-black text-white shadow-[0_12px_30px_rgba(15,15,20,.16)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(16,185,129,.2)] sm:px-4"
      >
        <span className="sm:hidden">Connect</span>
        <span className="hidden sm:inline">Connect Account for Withdrawal</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-2xl bg-zinc-950 p-1.5 text-white shadow-[0_12px_30px_rgba(15,15,20,.16)]">
      <div className="px-2 text-xs font-black sm:px-3"><span className="hidden sm:inline">Balance: </span>₦{balance.toLocaleString()}</div>
      <button onClick={onWithdraw} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-zinc-950 transition hover:scale-[1.03]">
        Withdraw
      </button>
    </div>
  );
}

function WalletCard({
  account,
  balance,
  onConnect,
  onWithdraw,
}: {
  account: ConnectedAccount | null;
  balance: number;
  onConnect: () => void;
  onWithdraw: () => void;
}) {
  return (
    <section className="overflow-hidden rounded-2xl bg-[#0f0f14] p-5 text-white shadow-[0_24px_70px_rgba(15,15,20,.28)]">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[.18em] text-white/40">Wallet</p>
          <h2 className="mt-4 text-4xl font-black tracking-tight">₦{balance.toLocaleString()}</h2>
          <p className="mt-2 text-sm font-bold text-emerald-300 animate-pulse">+₦100 earned</p>
        </div>
        {account ? (
          <div className="rounded-2xl bg-white/8 p-4 text-sm font-bold text-white/70">
            <p className="font-black text-white">{account.accountName}</p>
            <p className="mt-1">{account.bankName} · {account.accountNumber.slice(-4).padStart(account.accountNumber.length, "*")}</p>
            <p className="mt-1 text-xs uppercase tracking-[.16em] text-white/35">QIC {account.qic}</p>
          </div>
        ) : null}
      </div>

      {!account ? (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/6 p-4">
          <h3 className="text-xl font-black">Connect your account to receive payments</h3>
          <p className="mt-2 text-sm font-bold leading-6 text-white/55">Link your bank account to withdraw your earnings securely.</p>
          <button onClick={onConnect} className="mt-5 rounded-2xl bg-white px-5 py-3 text-sm font-black text-zinc-950 transition hover:scale-[1.02]">
            Connect Account
          </button>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button onClick={onWithdraw} className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-zinc-950 transition hover:scale-[1.02]">
            Withdraw
          </button>
          <div className="rounded-2xl bg-white/8 px-5 py-3 text-sm font-black text-white/60">Minimum withdrawal: ₦{minimumWithdrawal.toLocaleString()}</div>
        </div>
      )}
    </section>
  );
}

function ConnectAccountModal({
  onClose,
  onConnected,
}: {
  onClose: () => void;
  onConnected: (account: ConnectedAccount) => void;
}) {
  const [bankName, setBankName] = useState(banks[0]);
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [qic, setQic] = useState("QIC-42850");
  const [status, setStatus] = useState<ConnectStatus>("idle");

  const verifyAccount = () => {
    if (accountNumber.replace(/\D/g, "").length < 10 || !accountName.trim() || !qic.trim()) {
      setStatus("error");
      return;
    }

    setStatus("loading");
    window.setTimeout(() => {
      setStatus("success");
      window.setTimeout(() => onConnected({ bankName, accountNumber, accountName, qic }), 700);
    }, 850);
  };

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-[#0f0f14] text-white shadow-[0_28px_90px_rgba(0,0,0,.45)]">
        <div className="flex items-center justify-between border-b border-white/10 p-5">
          <div>
            <h2 className="text-xl font-black">Connect Account</h2>
            <p className="mt-1 text-sm font-bold text-white/45">Verify your bank details for withdrawals.</p>
          </div>
          <button onClick={onClose} className="rounded-xl bg-white/10 p-2 text-white/70 transition hover:bg-white/15 hover:text-white" aria-label="Close connect account">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4 p-5">
          <label className="space-y-2 block">
            <span className="text-xs font-black uppercase tracking-[.16em] text-white/35">Bank Name</span>
            <select value={bankName} onChange={(event) => setBankName(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm font-black outline-none">
              {banks.map((bank) => <option key={bank}>{bank}</option>)}
            </select>
          </label>
          <label className="space-y-2 block">
            <span className="text-xs font-black uppercase tracking-[.16em] text-white/35">Account Number</span>
            <input value={accountNumber} onChange={(event) => setAccountNumber(event.target.value.replace(/\D/g, "").slice(0, 10))} className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm font-black outline-none" placeholder="0123456789" />
          </label>
          <label className="space-y-2 block">
            <span className="text-xs font-black uppercase tracking-[.16em] text-white/35">Account Name</span>
            <input value={accountName} onChange={(event) => setAccountName(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm font-black outline-none" placeholder="John Doe" />
          </label>
          <label className="space-y-2 block">
            <span className="text-xs font-black uppercase tracking-[.16em] text-white/35">QIC</span>
            <input value={qic} onChange={(event) => setQic(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm font-black outline-none" />
          </label>

          {status === "loading" ? <div className="rounded-2xl bg-white/8 p-4 text-sm font-black text-white/70">Verifying your account...</div> : null}
          {status === "success" ? <div className="rounded-2xl bg-emerald-400/15 p-4 text-sm font-black text-emerald-200">Account Connected Successfully</div> : null}
          {status === "error" ? <div className="rounded-2xl bg-red-400/15 p-4 text-sm font-black text-red-200">Invalid details. Check your account number, account name, and QIC.</div> : null}

          <button onClick={verifyAccount} disabled={status === "loading"} className="w-full rounded-2xl bg-white px-5 py-4 text-sm font-black text-zinc-950 transition hover:scale-[1.01] disabled:opacity-60">
            Verify & Connect
          </button>
        </div>
      </div>
    </div>
  );
}

function WithdrawModal({
  account,
  balance,
  onClose,
}: {
  account: ConnectedAccount;
  balance: number;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<WithdrawStep>("form");
  const numericAmount = Number(amount) || 0;
  const receiveAmount = Math.max(0, numericAmount - withdrawalFee);
  const amountAway = Math.max(0, minimumWithdrawal - numericAmount);

  const proceed = () => {
    if (numericAmount < minimumWithdrawal) {
      setStep("below-minimum");
      return;
    }
    setStep("confirm");
  };

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-[#0f0f14] text-white shadow-[0_28px_90px_rgba(0,0,0,.45)]">
        <div className="flex items-center justify-between border-b border-white/10 p-5">
          <h2 className="text-xl font-black">{step === "success" ? "Withdrawal Complete" : "Withdraw Funds"}</h2>
          <button onClick={onClose} className="rounded-xl bg-white/10 p-2 text-white/70 transition hover:bg-white/15 hover:text-white" aria-label="Close withdrawal">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-5 p-5">
          {step === "form" ? (
            <>
              <div className="rounded-2xl bg-white/8 p-4">
                <p className="text-xs font-black uppercase tracking-[.16em] text-white/35">Available Balance</p>
                <p className="mt-2 text-3xl font-black">₦{balance.toLocaleString()}</p>
              </div>
              <label className="space-y-2 block">
                <span className="text-xs font-black uppercase tracking-[.16em] text-white/35">Enter Amount</span>
                <input value={amount} onChange={(event) => setAmount(event.target.value.replace(/\D/g, ""))} className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm font-black outline-none" placeholder="1000" />
              </label>
              <div className="rounded-2xl bg-white/8 p-4 text-sm font-bold text-white/65">
                <div className="flex justify-between"><span>Transaction Fee</span><span>₦{withdrawalFee}</span></div>
                <div className="mt-2 flex justify-between text-white"><span>You will receive</span><span>₦{receiveAmount.toLocaleString()}</span></div>
              </div>
              <button onClick={proceed} className="w-full rounded-2xl bg-white px-5 py-4 text-sm font-black text-zinc-950 transition hover:scale-[1.01]">
                Withdraw to Bank
              </button>
            </>
          ) : null}

          {step === "below-minimum" ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-amber-400/15 p-5 text-amber-100">
                <h3 className="text-lg font-black">You need ₦1,000 to withdraw.</h3>
                <p className="mt-2 text-sm font-bold text-amber-100/70">You’re ₦{amountAway.toLocaleString()} away.</p>
              </div>
              <button onClick={() => setStep("form")} className="w-full rounded-2xl bg-white/10 px-5 py-4 text-sm font-black text-white">Edit Amount</button>
              <button onClick={onClose} className="w-full rounded-2xl bg-white px-5 py-4 text-sm font-black text-zinc-950">Find More Qquests</button>
            </div>
          ) : null}

          {step === "confirm" ? (
            <div className="space-y-5">
              <div className="rounded-2xl bg-white/8 p-5">
                <p className="text-lg font-black">Send ₦{numericAmount.toLocaleString()} to {account.bankName} ({account.accountName})?</p>
                <p className="mt-2 text-sm font-bold text-white/45">Transaction fee: ₦{withdrawalFee}. You receive ₦{receiveAmount.toLocaleString()}.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setStep("form")} className="rounded-2xl bg-white/10 px-5 py-4 text-sm font-black text-white">Cancel</button>
                <button onClick={() => setStep("success")} className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-zinc-950">Confirm</button>
              </div>
            </div>
          ) : null}

          {step === "success" ? (
            <div className="space-y-5 text-center">
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-400/15 text-emerald-200 animate-pulse">
                <CheckCircle2 size={36} />
              </div>
              <div>
                <h3 className="text-2xl font-black">Withdrawal successful. Your money is on the way.</h3>
                <p className="mt-2 text-sm font-bold text-white/45">Processing within 24 hours.</p>
              </div>
              <button onClick={onClose} className="w-full rounded-2xl bg-white px-5 py-4 text-sm font-black text-zinc-950">Done</button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function TransactionList() {
  return (
    <section className="rounded-2xl bg-[#0f0f14] p-5 text-white shadow-[0_18px_50px_rgba(15,15,20,.2)]">
      <h2 className="text-xl font-black tracking-tight text-white">Transaction History</h2>
      <div className="mt-4 space-y-2">
        {historyItems.map((item) => (
          <div key={`${item.title}-${item.date}`} className="flex items-center justify-between gap-4 rounded-2xl bg-white/6 p-3 transition hover:bg-white/10">
            <div>
              <h3 className="text-sm font-black text-white">{item.title}</h3>
              <p className="mt-1 text-xs font-bold text-white/35">{item.date} · {item.status}</p>
            </div>
            <span className={`text-sm font-black ${item.amount.startsWith("+") ? "text-emerald-300" : "text-white"}`}>{item.amount}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function DashboardHome({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Wallet" value={`₦${walletBalance.toLocaleString()}`} detail="Available balance" />
        <StatCard label="Quest earnings" value="₦7,450" detail="This month" />
        <StatCard label="Active slots" value="4" detail="2 renew this week" />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
        <div className="overflow-hidden rounded-[2rem] bg-zinc-950 shadow-[0_22px_60px_rgba(15,15,20,.14)]">
          <div className="relative min-h-[330px] p-6 sm:p-8">
            <div className="absolute inset-0 bg-cover bg-center opacity-65" style={{ backgroundImage: "url('/qquest-hero-bg.png')" }} />
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/78 to-zinc-950/20" />
            <div className="relative max-w-xl">
              <h2 className="text-4xl font-black leading-tight text-white sm:text-5xl">Earn, save, and keep your circles moving.</h2>
              <p className="mt-4 text-base font-bold leading-7 text-white/70">Your best next move is a quick quest, then a marketplace renewal before tonight.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <button onClick={onCreate} className="rounded-2xl bg-white px-5 py-3.5 text-sm font-black text-zinc-950 transition hover:-translate-y-0.5">
                  Create Quest
                </button>
                <button className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3.5 text-sm font-black text-white transition hover:-translate-y-0.5">
                  Start Earning
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] bg-white p-5 shadow-[0_12px_36px_rgba(15,15,20,.06)]">
          <SectionHeader title="Today" />
          <div className="mt-5 space-y-3">
            {["Complete PulsePay proof", "Renew Netflix slot", "Invite 2 friends"].map((item, index) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl bg-zinc-50 p-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-white text-emerald-600 shadow-sm">
                  {index === 0 ? <CheckCircle2 size={17} /> : <Zap size={17} />}
                </div>
                <p className="text-sm font-black text-zinc-800">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <Panel title="Earning streak" value="6 days" detail="Three more completed quests unlock a 15% reward boost." />
        <Panel title="Marketplace health" value="92%" detail="All active subscriptions are verified and paid up." />
      </section>
    </div>
  );
}

function Panel({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <div className="rounded-[2rem] bg-white p-6 shadow-[0_12px_36px_rgba(15,15,20,.06)]">
      <p className="text-sm font-black text-zinc-500">{title}</p>
      <p className="mt-3 text-4xl font-black tracking-tight text-zinc-950">{value}</p>
      <p className="mt-3 text-sm font-bold leading-6 text-zinc-500">{detail}</p>
    </div>
  );
}

function MarketplacePage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-white p-5 shadow-[0_12px_36px_rgba(15,15,20,.06)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Subscription Marketplace</h2>
            <p className="mt-2 text-sm font-bold text-zinc-500">Verified circles with open slots and instant access.</p>
          </div>
          <button className="rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-black text-white">List a Slot</button>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {marketplaceItems.map((item) => (
          <div key={item.name} className="overflow-hidden rounded-[1.5rem] bg-white shadow-[0_12px_36px_rgba(15,15,20,.06)]">
            <div className={`h-28 bg-gradient-to-br ${item.accent}`} />
            <div className="p-5">
              <h3 className="text-base font-black text-zinc-950">{item.name}</h3>
              <p className="mt-2 text-2xl font-black text-zinc-950">{item.price}</p>
              <p className="mt-1 text-sm font-bold text-zinc-400">{item.detail}</p>
              <button className="mt-5 w-full rounded-2xl bg-zinc-950 py-3 text-sm font-black text-white">Join Circle</button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function NotificationsPage() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Notifications" action="Mark all read" />
      <section className="space-y-3">
        {notifications.map((item) => (
          <div key={item.title} className="flex gap-4 rounded-[1.5rem] bg-white p-4 shadow-[0_10px_30px_rgba(15,15,20,.05)]">
            <div className={`mt-1 h-3 w-3 rounded-full ${item.tone === "emerald" ? "bg-emerald-500" : item.tone === "amber" ? "bg-amber-400" : "bg-zinc-300"}`} />
            <div className="min-w-0 flex-1">
              <h3 className="font-black text-zinc-950">{item.title}</h3>
              <p className="mt-1 text-sm font-bold text-zinc-500">{item.detail}</p>
            </div>
            <span className="shrink-0 text-xs font-black text-zinc-400">{item.time}</span>
          </div>
        ))}
      </section>
    </div>
  );
}

function WalletPage({
  account,
  balance,
  onConnect,
  onWithdraw,
}: {
  account: ConnectedAccount | null;
  balance: number;
  onConnect: () => void;
  onWithdraw: () => void;
}) {
  return (
    <div className="rounded-[2rem] bg-[#09090d] p-4 shadow-[0_24px_80px_rgba(15,15,20,.22)] sm:p-5">
      <div className="grid gap-5 lg:grid-cols-[.85fr_1.15fr]">
        <WalletCard account={account} balance={balance} onConnect={onConnect} onWithdraw={onWithdraw} />
        <section className="rounded-2xl border border-white/8 bg-[#0f0f14] p-5 text-white">
          <h2 className="text-xl font-black tracking-tight">Withdrawal Rules</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/7 p-4">
              <p className="text-xs font-black uppercase tracking-[.16em] text-white/35">Minimum</p>
              <p className="mt-2 text-2xl font-black">₦{minimumWithdrawal.toLocaleString()}</p>
            </div>
            <div className="rounded-2xl bg-white/7 p-4">
              <p className="text-xs font-black uppercase tracking-[.16em] text-white/35">Flat fee</p>
              <p className="mt-2 text-2xl font-black">₦{withdrawalFee}</p>
            </div>
          </div>
          <p className="mt-5 text-sm font-bold leading-6 text-white/45">Connect your Nigerian bank account once, then withdraw completed Qquest earnings directly to that account.</p>
        </section>
        <div className="lg:col-span-2">
          <TransactionList />
        </div>
      </div>
    </div>
  );
}

function ReferralsPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-white p-6 shadow-[0_12px_36px_rgba(15,15,20,.06)]">
        <p className="text-xs font-black uppercase tracking-[.18em] text-zinc-400">Your referral code</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="rounded-2xl bg-zinc-100 px-5 py-4 text-2xl font-black tracking-[.18em] text-zinc-950">JOIN-Q-428</div>
          <button className="rounded-2xl bg-zinc-950 px-5 py-4 text-sm font-black text-white">Copy Link</button>
        </div>
      </section>
      <section className="grid gap-5 md:grid-cols-3">
        <StatCard label="Invites" value="48" detail="All time" />
        <StatCard label="Converted" value="31" detail="Active members" />
        <StatCard label="Bonus earned" value="₦12,400" detail="Referral rewards" />
      </section>
    </div>
  );
}

function HistoryPage() {
  return (
    <div className="space-y-6">
      <SectionHeader title="History" action="Download" />
      <section className="rounded-[2rem] bg-white p-4 shadow-[0_12px_36px_rgba(15,15,20,.06)]">
        <div className="space-y-2">
          {historyItems.map((item) => (
            <TransactionRow key={item.title} {...item} />
          ))}
        </div>
      </section>
    </div>
  );
}

function TransactionRow({ title, amount, status, date }: { title: string; amount: string; status: string; date: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl p-3 transition hover:bg-zinc-50">
      <div>
        <h3 className="text-sm font-black text-zinc-950">{title}</h3>
        <p className="mt-1 text-xs font-bold text-zinc-400">{date} · {status}</p>
      </div>
      <span className={`text-sm font-black ${amount.startsWith("+") ? "text-emerald-600" : "text-zinc-950"}`}>{amount}</span>
    </div>
  );
}

function SupportPage() {
  return (
    <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
      <section className="rounded-[2rem] bg-white p-6 shadow-[0_12px_36px_rgba(15,15,20,.06)]">
        <h2 className="text-2xl font-black">Support</h2>
        <p className="mt-3 text-sm font-bold leading-6 text-zinc-500">Get help with quests, subscriptions, wallet funding, and proof reviews.</p>
        <div className="mt-6 space-y-3">
          {["Quest proof pending", "Marketplace access", "Wallet funding", "Account safety"].map((item) => (
            <button key={item} className="flex w-full items-center justify-between rounded-2xl bg-zinc-50 px-4 py-3 text-sm font-black text-zinc-700">
              {item}
              <ChevronDown size={16} />
            </button>
          ))}
        </div>
      </section>
      <section className="rounded-[2rem] bg-zinc-950 p-6 text-white shadow-[0_22px_60px_rgba(15,15,20,.16)]">
        <p className="text-xs font-black uppercase tracking-[.18em] text-white/45">Live support</p>
        <h2 className="mt-4 text-4xl font-black tracking-tight">We usually reply in under 10 minutes.</h2>
        <button className="mt-8 rounded-2xl bg-white px-5 py-3 text-sm font-black text-zinc-950">Start Chat</button>
      </section>
    </div>
  );
}

function ProfilePage() {
  return (
    <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
      <section className="rounded-[2rem] bg-white p-6 text-center shadow-[0_12px_36px_rgba(15,15,20,.06)]">
        <div className="mx-auto grid h-24 w-24 place-items-center rounded-[2rem] bg-zinc-950 text-3xl font-black text-white">Q</div>
        <h2 className="mt-5 text-2xl font-black">Q Member</h2>
        <p className="mt-1 text-sm font-bold text-zinc-400">@member</p>
        <button className="mt-6 rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-black text-white">Edit Profile</button>
      </section>
      <section className="grid gap-5 md:grid-cols-2">
        <Panel title="Q Score" value="780" detail="Trusted member with strong completion history." />
        <Panel title="Verification" value="Active" detail="Wallet, profile, and marketplace access are ready." />
      </section>
    </div>
  );
}

export default function QquestPage() {
  const [activePage, setActivePage] = useState<NavPage>("quest");
  const [activeTab, setActiveTab] = useState<QuestStatus>("all");
  const [sort, setSort] = useState("Suggested");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<QuestTag | "All">("All");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isConnectAccountOpen, setIsConnectAccountOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [startedQuestIds, setStartedQuestIds] = useState<number[]>([]);
  const [connectedAccount, setConnectedAccount] = useState<ConnectedAccount | null>(null);
  const [createdQuests, setCreatedQuests] = useState<Quest[]>([]);

  const allQuests = useMemo(() => [adminFeaturedQuest, ...createdQuests, ...quests], [createdQuests]);
  const visibleQuests = useMemo(() => {
    const rewardValue = (quest: Quest) => Number(quest.reward.replace(/\D/g, "")) || 0;
    const filtered = allQuests
      .filter((quest) => activeTab === "mine" ? quest.status.includes("mine") || startedQuestIds.includes(quest.id) : quest.status.includes(activeTab))
      .filter((quest) => selectedTag === "All" || quest.tag === selectedTag)
      .filter((quest) => quest.title.toLowerCase().includes(searchQuery.trim().toLowerCase()));

    if (sort === "Highest Paying") return [...filtered].sort((a, b) => rewardValue(b) - rewardValue(a));
    if (sort === "Quick Tasks") return [...filtered].sort((a, b) => Number.parseInt(a.time) - Number.parseInt(b.time));
    if (sort === "Trending") return filtered.filter((quest) => quest.tag === "Trending").concat(filtered.filter((quest) => quest.tag !== "Trending"));
    return filtered;
  }, [activeTab, allQuests, searchQuery, selectedTag, sort, startedQuestIds]);
  const activeTitle = pageTitles[activePage];
  const openQuestDetail = (quest: Quest) => {
    setSelectedQuest(quest);
    window.history.pushState({ qquestModal: true }, "", window.location.href);
  };
  const closeQuestDetail = () => {
    setSelectedQuest(null);
    if (window.history.state?.qquestModal) {
      window.history.back();
      return;
    }
  };
  const startSelectedQuest = () => {
    if (!selectedQuest) return;
    setStartedQuestIds((current) => current.includes(selectedQuest.id) ? current : [...current, selectedQuest.id]);
  };
  const startQuest = (quest: Quest) => {
    setStartedQuestIds((current) => current.includes(quest.id) ? current : [...current, quest.id]);
    setActiveTab("mine");
    openQuestDetail(quest);
  };
  const handleLaunchedQuest = (quest: Quest) => {
    setCreatedQuests((current) => [quest, ...current]);
    setActiveTab("mine");
  };
  const renderUtilityPage = () => {
    switch (activePage) {
      case "dashboard":
        return <DashboardHome onCreate={() => setIsCreateOpen(true)} />;
      case "marketplace":
        return <MarketplacePage />;
      case "notifications":
        return <NotificationsPage />;
      case "wallet":
        return (
          <WalletPage
            account={connectedAccount}
            balance={walletBalance}
            onConnect={() => setIsConnectAccountOpen(true)}
            onWithdraw={() => connectedAccount ? setIsWithdrawOpen(true) : setIsConnectAccountOpen(true)}
          />
        );
      case "referrals":
        return <ReferralsPage />;
      case "history":
        return <HistoryPage />;
      case "support":
        return <SupportPage />;
      case "profile":
        return <ProfilePage />;
      default:
        return null;
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setSelectedQuest(null);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return (
    <div className="min-h-screen bg-[#f4f5f8] text-zinc-950">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col bg-white p-6 shadow-[4px_0_24px_rgba(0,0,0,0.03)] xl:flex">
        <div className="mb-10 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-emerald-300 to-cyan-300 text-lg font-black text-zinc-950 shadow-[0_10px_24px_rgba(16,185,129,.2)]">
            Q
          </div>
          <div>
            <p className="text-xl font-black tracking-tight">jointheq</p>
            <p className="text-xs font-black uppercase tracking-[.18em] text-zinc-400">member</p>
          </div>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.id === activePage;
            return (
              <button
                key={item.label}
                onClick={() => setActivePage(item.id)}
                className={`flex w-full items-center gap-3 rounded-full px-4 py-3 text-sm font-black transition duration-300 ${
                  active ? "bg-zinc-950 text-white shadow-[0_10px_24px_rgba(0,0,0,.16)]" : "text-zinc-500 hover:bg-black/5 hover:text-zinc-950"
                }`}
              >
                <Icon size={19} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto rounded-[1.5rem] bg-zinc-50 p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-emerald-600 shadow-sm">
              <Zap size={18} />
            </div>
            <div>
              <p className="text-sm font-black">Streak boost</p>
              <p className="text-xs font-bold text-zinc-400">3 quests from +15%</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="xl:pl-72">
        <header className="sticky top-0 z-20 border-b border-black/5 bg-white/85 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Logo className="h-9 w-9 xl:hidden" />
              <h1 className="truncate text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl">{activeTitle}</h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsCreateOpen(true)}
                className="hidden items-center gap-2 rounded-full bg-zinc-950 px-4 py-3 text-sm font-black text-white shadow-[0_10px_24px_rgba(0,0,0,.16)] transition hover:-translate-y-0.5 hover:bg-black sm:flex"
              >
                <Plus size={18} />
                Create Quest
              </button>
              <WalletHeaderAction
                account={connectedAccount}
                balance={walletBalance}
                onConnect={() => setIsConnectAccountOpen(true)}
                onWithdraw={() => setIsWithdrawOpen(true)}
              />
              <button
                onClick={() => setIsMobileMenuOpen((current) => !current)}
                className="grid h-11 w-11 place-items-center rounded-full bg-zinc-100 text-zinc-900 transition hover:bg-zinc-200 xl:hidden"
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
          {isMobileMenuOpen ? (
            <nav className="mt-4 grid gap-2 rounded-[1.5rem] bg-white p-3 shadow-[0_18px_48px_rgba(15,15,20,.12)] xl:hidden">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = item.id === activePage;
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      setActivePage(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 rounded-full px-4 py-3 text-sm font-black transition ${
                      active ? "bg-zinc-950 text-white" : "text-zinc-500 hover:bg-black/5 hover:text-zinc-950"
                    }`}
                  >
                    <Icon size={19} />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          ) : null}
        </header>

        <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {activePage === "quest" ? (
            <>
          <section className="relative overflow-hidden rounded-[2rem] bg-zinc-950 shadow-[0_22px_60px_rgba(15,15,20,.16)]">
            <div className="absolute inset-0 bg-cover bg-center opacity-80" style={{ backgroundImage: adminFeaturedQuest.image }} />
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/72 to-zinc-950/15" />
            <div className="relative grid min-h-[360px] items-end p-6 sm:p-8 lg:grid-cols-[1.1fr_.9fr] lg:p-10">
              <div className="max-w-2xl pb-2">
                <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-[11px] font-black uppercase tracking-[.18em] text-white backdrop-blur-md">
                  Admin Featured
                </span>
                <h2 className="mt-5 max-w-xl text-4xl font-black leading-[1.02] tracking-tight text-white sm:text-6xl">
                  {adminFeaturedQuest.title}
                </h2>
                <p className="mt-4 max-w-lg text-base font-bold leading-7 text-white/72 sm:text-lg">
                  {adminFeaturedQuest.instructions}
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <button onClick={() => startQuest(adminFeaturedQuest)} className="rounded-2xl bg-white px-5 py-3.5 text-sm font-black text-zinc-950 shadow-[0_18px_50px_rgba(255,255,255,.13)] transition hover:-translate-y-0.5">
                    Start Quest
                  </button>
                  <button onClick={() => openQuestDetail(adminFeaturedQuest)} className="rounded-2xl border border-white/25 bg-white/10 px-5 py-3.5 text-sm font-black text-white backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/16">
                    View Details
                  </button>
                </div>
              </div>

              <div className="mt-8 hidden justify-end lg:flex">
                <div className="w-full max-w-sm rounded-[1.5rem] bg-white/12 p-4 shadow-2xl backdrop-blur-xl">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-[.18em] text-white/55">Live Pool</span>
                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-black text-white">4,281 online</span>
                  </div>
                  <div className="space-y-3">
                    {["Joined saver circle", "Verified watch time", "Payout queued"].map((item, index) => (
                      <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/12 p-3">
                        <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 text-white">
                          {index === 2 ? <Wallet size={17} /> : <CheckCircle2 size={17} />}
                        </div>
                        <div>
                          <p className="text-sm font-black text-white">{item}</p>
                          <p className="text-xs font-bold text-white/50">{index + 1} min ago</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex rounded-full bg-white p-1 shadow-sm">
              {[
                ["all", "All Quests"],
                ["mine", "My Quests"],
                ["completed", "Completed"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as QuestStatus)}
                  className={`rounded-full px-4 py-2.5 text-sm font-black transition ${
                    activeTab === id ? "bg-zinc-950 text-white" : "text-zinc-400 hover:text-zinc-950"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="relative flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  setIsSearchOpen((current) => !current);
                  setIsFilterOpen(false);
                }}
                className={`grid h-11 w-11 place-items-center rounded-full bg-white shadow-sm transition hover:scale-105 ${isSearchOpen || searchQuery ? "text-zinc-950 ring-2 ring-zinc-950" : "text-zinc-500 hover:text-zinc-950"}`}
                aria-label="Search quests"
              >
                <Search size={18} />
              </button>
              {isSearchOpen ? (
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  autoFocus
                  className="h-11 w-full rounded-full bg-white px-4 text-sm font-black text-zinc-900 shadow-sm outline-none ring-2 ring-zinc-950/8 placeholder:text-zinc-400 sm:w-56"
                  placeholder="Search Qquests"
                />
              ) : null}
              <label className="relative">
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                  className="h-11 appearance-none rounded-full bg-white px-4 pr-10 text-sm font-black text-zinc-900 outline-none shadow-sm transition hover:bg-zinc-50"
                >
                  {sortOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              </label>
              <button
                onClick={() => {
                  setIsFilterOpen((current) => !current);
                  setIsSearchOpen(false);
                }}
                className={`grid h-11 w-11 place-items-center rounded-full bg-white shadow-sm transition hover:scale-105 ${isFilterOpen || selectedTag !== "All" ? "text-zinc-950 ring-2 ring-zinc-950" : "text-zinc-500 hover:text-zinc-950"}`}
                aria-label="Filter quests"
              >
                <Filter size={18} />
              </button>
              {isFilterOpen ? (
                <div className="absolute left-0 top-14 z-10 w-72 rounded-2xl bg-white p-3 shadow-[0_18px_48px_rgba(15,15,20,.14)]">
                  <p className="px-2 pb-2 text-xs font-black uppercase tracking-[.16em] text-zinc-400">Filter by type</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(["All", "Sponsored", "Trending", "New"] as const).map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          setSelectedTag(tag);
                          setIsFilterOpen(false);
                        }}
                        className={`rounded-xl px-3 py-2 text-sm font-black transition ${selectedTag === tag ? "bg-zinc-950 text-white" : "bg-zinc-50 text-zinc-500 hover:text-zinc-950"}`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  {(selectedTag !== "All" || searchQuery) ? (
                    <button
                      onClick={() => {
                        setSelectedTag("All");
                        setSearchQuery("");
                        setIsFilterOpen(false);
                      }}
                      className="mt-3 w-full rounded-xl bg-zinc-100 px-3 py-2 text-sm font-black text-zinc-700"
                    >
                      Clear filters
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </section>

          {visibleQuests.length ? (
            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {visibleQuests.map((quest) => (
                <QuestCard key={quest.id} quest={quest} onOpen={openQuestDetail} />
              ))}
            </section>
          ) : (
            <section className="grid min-h-[360px] place-items-center rounded-[2rem] bg-white p-8 text-center shadow-sm">
              <div className="max-w-sm">
                <div className="mx-auto mb-6 grid h-24 w-24 place-items-center rounded-[1.75rem] bg-zinc-50 text-zinc-950">
                  <Compass size={42} />
                </div>
                <h2 className="text-2xl font-black">No Quests yet</h2>
                <p className="mt-2 text-sm font-bold text-zinc-500">Start earning or create your first quest</p>
                <button onClick={() => setActiveTab("all")} className="mt-6 rounded-full bg-zinc-950 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5">
                  Start Earning
                </button>
              </div>
            </section>
          )}
            </>
          ) : (
            renderUtilityPage()
          )}
        </div>
      </main>

      <button
        onClick={() => setIsCreateOpen(true)}
        className="fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-full bg-zinc-950 px-5 py-4 text-sm font-black text-white shadow-[0_18px_42px_rgba(15,15,20,.2)] transition hover:-translate-y-1 sm:hidden"
      >
        <Plus size={18} />
        Create Quest
      </button>

      {isCreateOpen && <CreateQuestModal onClose={() => setIsCreateOpen(false)} onLaunch={handleLaunchedQuest} />}
      {isConnectAccountOpen && (
        <ConnectAccountModal
          onClose={() => setIsConnectAccountOpen(false)}
          onConnected={(account) => {
            setConnectedAccount(account);
            setIsConnectAccountOpen(false);
          }}
        />
      )}
      {isWithdrawOpen && connectedAccount && (
        <WithdrawModal
          account={connectedAccount}
          balance={walletBalance}
          onClose={() => setIsWithdrawOpen(false)}
        />
      )}
      {selectedQuest && (
        <QuestDetailModal
          quest={selectedQuest}
          isStarted={startedQuestIds.includes(selectedQuest.id)}
          onBack={closeQuestDetail}
          onStart={startSelectedQuest}
        />
      )}
    </div>
  );
}
