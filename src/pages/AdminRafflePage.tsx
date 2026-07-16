import { useState, useCallback, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { auth } from "../lib/auth";
import { uploadCampaignImage, validateImage } from "../lib/storage";
import { AdminShell } from "../components/admin/AdminShell";
import {
  Plus, Award, Ticket, Users, Gift, Sparkles,
  CheckCircle2, XCircle, Clock, Search, Edit3,
  Eye, Loader2, Copy, ChevronDown,
  Music, Ban, RefreshCw,
  AlertCircle, X, ChevronRight, Palette, Image,
  ListOrdered, DollarSign, BarChart3, Medal,
  Upload, ImageIcon, ToggleLeft, ToggleRight,
  Calendar, Clock as ClockIcon, HelpCircle, Trash2,
  ThumbsUp,
  Save, ArrowLeft, LayoutGrid, Settings,
  Sliders, Bell, Repeat2,
} from "lucide-react";
import toast from "react-hot-toast";

type RaffleStatus = "draft" | "published" | "closed" | "completed";

type EditTab = "overview" | "schedule" | "prizes" | "tickets" | "eligibility" | "notifications" | "automation" | "analytics";

const PRESET_COLORS = [
  "#1DB954", "#191414", "#FF6B6B", "#4ECDC4", "#45B7D1",
  "#FFA07A", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9",
  "#F1948A", "#82E0AA", "#F8C471", "#AED6F1", "#D7BDE2",
  "#A3E4D7", "#FADBD8", "#D5F5E3", "#FCF3CF", "#D6EAF8",
];

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => i + 1);

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: "bg-zinc-100", text: "text-zinc-600", label: "Draft" },
  published: { bg: "bg-emerald-100", text: "text-emerald-600", label: "Published" },
  closed: { bg: "bg-amber-100", text: "text-amber-600", label: "Closed" },
  completed: { bg: "bg-blue-100", text: "text-blue-600", label: "Completed" },
};

function RaffleStatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.draft;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

function Toggle({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 cursor-pointer hover:bg-zinc-100 transition-colors">
      <div>
        <span className="text-xs font-bold">{label}</span>
        {desc && <p className="text-[10px] text-zinc-500 font-medium">{desc}</p>}
      </div>
      <button type="button" onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${checked ? "bg-emerald-500" : "bg-zinc-300"}`}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </label>
  );
}

function BannerUpload({ currentUrl, onUpload, onRemove }: { currentUrl?: string; onUpload: (url: string) => void; onRemove: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const resolveUploadUrl = useMutation(api.storage.resolveUploadUrl);

  const hasImage = preview || currentUrl;

  const handleFile = useCallback(async (file: File | null) => {
    setError(null);
    if (!file) return;
    const validationError = validateImage(file);
    if (validationError) { setError(validationError); return; }
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const url = await uploadCampaignImage(
        file,
        () => generateUploadUrl(),
        (args) => resolveUploadUrl(args),
        setProgress,
      );
      onUpload(url);
      setUploading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setPreview(null);
      setUploading(false);
    }
  }, [generateUploadUrl, resolveUploadUrl, onUpload]);

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Banner Image</label>
      {hasImage && !uploading ? (
        <div className="relative rounded-xl border border-black/10 overflow-hidden group">
          <img src={preview || currentUrl} alt="Banner" className="w-full h-40 object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button type="button" onClick={() => inputRef.current?.click()} className="h-9 px-4 rounded-xl bg-white text-zinc-900 text-[10px] font-black">Replace</button>
            <button type="button" onClick={() => { if (preview) URL.revokeObjectURL(preview); setPreview(null); onRemove(); }} className="h-9 w-9 rounded-xl bg-red-500 text-white flex items-center justify-center"><X size={14} /></button>
          </div>
        </div>
      ) : uploading ? (
        <div className="rounded-xl border border-black/10 bg-zinc-50 p-6 text-center">
          <div className="w-8 h-8 rounded-full border-2 border-zinc-300 border-t-zinc-900 animate-spin mx-auto mb-2" />
          <div className="text-xs font-bold text-zinc-700">Uploading... {progress}%</div>
          <div className="w-full h-1.5 bg-zinc-200 rounded-full overflow-hidden mt-2">
            <div className="h-full bg-zinc-900 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : (
        <div onClick={() => inputRef.current?.click()} className="rounded-xl border-2 border-dashed border-black/10 hover:border-black/30 bg-zinc-50 cursor-pointer p-8 text-center">
          <ImageIcon size={28} className="mx-auto mb-2 text-zinc-300" />
          <div className="text-sm font-bold text-zinc-500">Click to upload banner</div>
          <div className="text-[10px] font-semibold text-zinc-400 mt-1">JPG, PNG, WebP (max 5MB)</div>
        </div>
      )}
      {error && <div className="flex items-center gap-1.5 text-red-500 text-[10px] font-black"><AlertCircle size={12} /> {error}</div>}
      <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp" onChange={e => handleFile(e.target.files?.[0] ?? null)} className="hidden" />
    </div>
  );
}

const TABS: { id: EditTab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <Settings size={14} /> },
  { id: "schedule", label: "Schedule", icon: <Calendar size={14} /> },
  { id: "prizes", label: "Prizes", icon: <Award size={14} /> },
  { id: "tickets", label: "Ticket Rules", icon: <Ticket size={14} /> },
  { id: "eligibility", label: "Eligibility", icon: <ThumbsUp size={14} /> },
  { id: "notifications", label: "Notifications", icon: <Bell size={14} /> },
  { id: "automation", label: "Automation", icon: <Sliders size={14} /> },
  { id: "analytics", label: "Analytics", icon: <BarChart3 size={14} /> },
];

export default function AdminRafflePage() {
  const { raffleId } = useParams<{ raffleId: string }>();
  const navigate = useNavigate();
  const user = auth.getCurrentUser();
  const adminId = (user?._id || "") as Id<"users">;
  const isCreateMode = !raffleId;

  const [activeTab, setActiveTab] = useState<EditTab>("overview");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Queries (edit mode only)
  const allRaffles = useQuery(api.raffle.getAllRaffles, isCreateMode ? "skip" : undefined);
  const raffle = isCreateMode ? null : (allRaffles || []).find((r: any) => r._id === raffleId);

  const entries = useQuery(
    api.raffle.getAllEntries,
    raffle?._id ? { raffleId: raffle._id } : "skip"
  );
  const winners = useQuery(
    api.raffle.getRaffleWinners,
    raffle?._id ? { raffleId: raffle._id } : "skip"
  );
  const stats = useQuery(
    api.raffle.getRaffleStats,
    raffle?._id ? { raffleId: raffle._id } : "skip"
  );
  const leaderboard = useQuery(
    api.raffle.getLeaderboard,
    raffle?._id ? { raffleId: raffle._id, limit: 5 } : "skip"
  );
  const activities = useQuery(
    api.raffle.getRaffleActivities,
    raffle?._id ? { raffleId: raffle._id } : "skip"
  );
  const bonusTasks = useQuery(
    api.raffle.getBonusTasks,
    raffle?._id ? { raffleId: raffle._id, includeInactive: true } : "skip"
  );
  const bonusStats = useQuery(
    api.raffle.getRaffleBonusStats,
    raffle?._id ? { raffleId: raffle._id } : "skip"
  );

  const createRaffleFn = useMutation(api.raffle.createRaffle);
  const updateRaffleFn = useMutation(api.raffle.updateRaffle);
  const updateStatusFn = useMutation(api.raffle.updateRaffleStatus);
  const drawWinnerFn = useAction(api.raffle.drawWinner);
  const publishWinnerFn = useMutation(api.raffle.publishWinner);
  const createBonusTaskMutation = useMutation(api.raffle.createBonusTask);
  const updateBonusTaskMutation = useMutation(api.raffle.updateBonusTask);
  const deleteBonusTaskMutation = useMutation(api.raffle.deleteBonusTask);

  // ─── Form State ───
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<RaffleStatus>("draft");
  const [heroImageUrl, setHeroImageUrl] = useState<string | undefined>();
  const [accentColor, setAccentColor] = useState("#1DB954");

  const [prizeAmount, setPrizeAmount] = useState("");
  const [numWinners, setNumWinners] = useState("1");
  const [prizes, setPrizes] = useState<{ amount: string; label: string }[]>([]);

  const [frequency, setFrequency] = useState<"weekly" | "monthly" | "one_time">("one_time");
  const [drawDay, setDrawDay] = useState<number>(6);
  const [drawTime, setDrawTime] = useState("20:00");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [drawDate, setDrawDate] = useState("");

  const [autoDraw, setAutoDraw] = useState(false);
  const [autoPublish, setAutoPublish] = useState(true);
  const [autoNotify, setAutoNotify] = useState(true);
  const [autoGenerateNext, setAutoGenerateNext] = useState(false);
  const [autoLockEntries, setAutoLockEntries] = useState(false);

  const [referralReward, setReferralReward] = useState("2");
  const [referralEnabled, setReferralEnabled] = useState(true);
  const [maxReferralTickets, setMaxReferralTickets] = useState("");
  const [maxReferralsPerUser, setMaxReferralsPerUser] = useState("");

  const [eligibilityRules, setEligibilityRules] = useState<{ field: string; operator: string; value: string }[]>([]);

  const [notifOnEntry, setNotifOnEntry] = useState(true);
  const [notifOnReferral, setNotifOnReferral] = useState(true);
  const [notifOnWinner, setNotifOnWinner] = useState(true);
  const [notifOnReminder, setNotifOnReminder] = useState(true);
  const [notifOnClaimed, setNotifOnClaimed] = useState(true);

  const [publishAfterCreate, setPublishAfterCreate] = useState(false);

  // Bonus task editor state
  const [showBonusTaskEditor, setShowBonusTaskEditor] = useState(false);
  const [editingBonusTask, setEditingBonusTask] = useState<any>(null);

  // Load raffle data in edit mode
  useEffect(() => {
    if (!raffle) return;
    setTitle(raffle.title || "");
    setSlug(raffle.slug || "");
    setDescription(raffle.description || "");
    setStatus(raffle.status || "draft");
    setHeroImageUrl(raffle.banner);
    setAccentColor(raffle.accentColor || "#1DB954");
    setPrizeAmount(String(raffle.prizeAmount || ""));
    setNumWinners(String(raffle.numberOfWinners || 1));
    setPrizes((raffle.prizes || []).map((p: any) => ({ amount: String(p.amount), label: p.label })));
    setFrequency(raffle.frequency || "one_time");
    setDrawDay(raffle.drawDay ?? 6);
    setDrawTime(raffle.drawTime || "20:00");
    setStartDate(raffle.startDate ? new Date(raffle.startDate).toISOString().slice(0, 10) : "");
    setEndDate(raffle.endDate ? new Date(raffle.endDate).toISOString().slice(0, 10) : "");
    setDrawDate(raffle.drawDate ? new Date(raffle.drawDate).toISOString().slice(0, 16) : "");
    setAutoDraw(raffle.autoDraw ?? false);
    setAutoPublish(raffle.autoPublish ?? true);
    setAutoNotify(raffle.autoNotify ?? true);
    setAutoGenerateNext(raffle.autoGenerateNext ?? false);
    setAutoLockEntries(raffle.autoLockEntries ?? false);
    setReferralReward(String(raffle.referralReward || 2));
    setReferralEnabled(raffle.referralEnabled ?? true);
    setMaxReferralTickets(String(raffle.maxReferralTickets || ""));
    setMaxReferralsPerUser(String(raffle.maxReferralsPerUser || ""));
    setEligibilityRules(raffle.eligibilityRules || []);
    setNotifOnEntry(raffle.notificationSettings?.onEntry ?? true);
    setNotifOnReferral(raffle.notificationSettings?.onReferral ?? true);
    setNotifOnWinner(raffle.notificationSettings?.onWinnerAnnounce ?? true);
    setNotifOnReminder(raffle.notificationSettings?.onDrawReminder ?? true);
    setNotifOnClaimed(raffle.notificationSettings?.onPrizeClaimed ?? true);
    setDirty(false);
  }, [raffle]);

  const markDirty = useCallback(() => setDirty(true), []);

  const addPrizeTier = () => { setPrizes(prev => [...prev, { amount: "", label: "" }]); markDirty(); };
  const removePrizeTier = (i: number) => { setPrizes(prev => prev.filter((_, idx) => idx !== i)); markDirty(); };
  const updatePrize = (i: number, field: "amount" | "label", value: string) => { setPrizes(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p)); markDirty(); };

  const addRule = () => { setEligibilityRules(prev => [...prev, { field: "has_spotify", operator: "eq", value: "true" }]); markDirty(); };
  const removeRule = (i: number) => { setEligibilityRules(prev => prev.filter((_, idx) => idx !== i)); markDirty(); };
  const updateRule = (i: number, field: "field" | "operator" | "value", value: string) => { setEligibilityRules(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r)); markDirty(); };

  const handleSlugFromTitle = (val: string) => {
    setTitle(val);
    markDirty();
    const autoSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    if (!slug || slug === title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")) {
      setSlug(autoSlug);
    }
  };

  // ─── Draw/Publish Actions ───
  const handleDrawWinner = useCallback(async () => {
    if (!raffle) return;
    if (!confirm("Draw winner for this raffle? This will complete the raffle.")) return;
    try {
      const result = await drawWinnerFn({ raffleId: raffle._id, adminId });
      toast.success(`Winner drawn! ${result.winner.name} won ₦${result.winner.prize.toLocaleString()}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to draw winner");
    }
  }, [raffle, adminId, drawWinnerFn]);

  const handlePublishWinner = useCallback(async () => {
    if (!raffle) return;
    try {
      await publishWinnerFn({ adminId, raffleId: raffle._id });
      toast.success("Winner published!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to publish winner");
    }
  }, [raffle, adminId, publishWinnerFn]);

  const handleUpdateStatus = useCallback(async (newStatus: string) => {
    if (!raffle) return;
    try {
      await updateStatusFn({ adminId, raffleId: raffle._id, status: newStatus });
      toast.success(`Status changed to ${newStatus}`);
      setStatus(newStatus as RaffleStatus);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update status");
    }
  }, [raffle, adminId, updateStatusFn]);

  // ─── Save ───
  const handleSave = useCallback(async () => {
    if (!title.trim() || !slug.trim() || !prizeAmount) {
      setError("Please fill in all required fields (title, slug, prize amount)");
      toast.error("Please fill in all required fields");
      return;
    }
    setSaving(true);
    setError(null);
    setSaveStatus("saving");
    try {
      const formattedPrizes = prizes.filter(p => p.amount && p.label).map(p => ({ amount: Number(p.amount), label: p.label }));

      if (isCreateMode) {
        const args: any = {
          adminId,
          title: title.trim(),
          slug: slug.trim(),
          banner: heroImageUrl,
          accentColor,
          description: description.trim(),
          prizeAmount: Number(prizeAmount),
          prizes: formattedPrizes.length > 0 ? formattedPrizes : undefined,
          drawDate: frequency === "one_time" ? new Date(drawDate).getTime() : new Date(startDate).getTime(),
          eligibilityType: "spotify_subscription",
          referralReward: Number(referralReward) || 2,
          frequency,
          drawDay: frequency !== "one_time" ? drawDay : undefined,
          drawTime: frequency !== "one_time" ? drawTime : undefined,
          startDate: frequency !== "one_time" ? new Date(startDate).getTime() : undefined,
          endDate: endDate ? new Date(endDate).getTime() : undefined,
          autoDraw,
          autoPublish,
          autoNotify,
          autoGenerateNext,
          autoLockEntries,
          numberOfWinners: Number(numWinners) || 1,
          prizeBreakdown: formattedPrizes.length > 0 ? formattedPrizes.map((p, i) => ({ position: i + 1, label: p.label, amount: p.amount })) : undefined,
        };

        const result = await createRaffleFn(args);
        if (result.success === false) {
          setError(result.error || "Failed to create raffle");
          setSaveStatus("error");
          return;
        }

        if (publishAfterCreate) {
          await updateStatusFn({ raffleId: result.raffleId, status: "published" });
        }

        toast.success("Raffle created!");
        setSaveStatus("saved");
        navigate(`/admin/raffle/edit/${result.raffleId}`, { replace: true });
      } else if (raffle) {
        const args: any = {
          adminId,
          raffleId: raffle._id,
          title: title.trim(),
          slug: slug.trim(),
          banner: heroImageUrl,
          accentColor,
          description: description.trim(),
          prizeAmount: Number(prizeAmount),
          prizes: formattedPrizes.length > 0 ? formattedPrizes : undefined,
          drawDate: frequency === "one_time" ? new Date(drawDate).getTime() : (raffle.drawDate || Date.now()),
          status,
          eligibilityType: "spotify_subscription",
          referralReward: Number(referralReward) || 2,
          frequency,
          drawDay: frequency !== "one_time" ? drawDay : undefined,
          drawTime: frequency !== "one_time" ? drawTime : undefined,
          startDate: frequency !== "one_time" ? new Date(startDate).getTime() : undefined,
          endDate: endDate ? new Date(endDate).getTime() : undefined,
          autoDraw,
          autoPublish,
          autoNotify,
          autoGenerateNext,
          autoLockEntries,
          numberOfWinners: Number(numWinners) || 1,
          prizeBreakdown: formattedPrizes.length > 0 ? formattedPrizes.map((p, i) => ({ position: i + 1, label: p.label, amount: p.amount })) : undefined,
          referralEnabled,
          maxReferralTickets: maxReferralTickets ? Number(maxReferralTickets) : undefined,
          maxReferralsPerUser: maxReferralsPerUser ? Number(maxReferralsPerUser) : undefined,
          eligibilityRules: eligibilityRules.length > 0 ? eligibilityRules : undefined,
          notificationSettings: {
            onEntry: notifOnEntry,
            onReferral: notifOnReferral,
            onWinnerAnnounce: notifOnWinner,
            onDrawReminder: notifOnReminder,
            onPrizeClaimed: notifOnClaimed,
          },
        };

        const result = await updateRaffleFn(args);
        if (result.success === false) {
          setError(result.error || "Failed to update raffle");
          setSaveStatus("error");
          return;
        }

        toast.success("Raffle saved!");
        setSaveStatus("saved");
        setDirty(false);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to save raffle");
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }, [title, slug, bannerUrl, accentColor, description, prizeAmount, prizes, drawDate, status, frequency, drawDay, drawTime, startDate, endDate, referralReward, numWinners, autoDraw, autoPublish, autoNotify, autoGenerateNext, autoLockEntries, referralEnabled, maxReferralTickets, maxReferralsPerUser, eligibilityRules, notifOnEntry, notifOnReferral, notifOnWinner, notifOnReminder, notifOnClaimed, publishAfterCreate, raffle, raffleId, adminId, createRaffleFn, updateRaffleFn, updateStatusFn, isCreateMode, navigate]);

  // ─── Bonus Task handlers ───
  const handleCreateBonusTask = useCallback(async (data: any) => {
    if (!raffle) return;
    try {
      await createBonusTaskMutation({ ...data, raffleId: raffle._id, createdBy: adminId });
      toast.success("Bonus task created");
      setShowBonusTaskEditor(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to create bonus task");
    }
  }, [raffle, adminId, createBonusTaskMutation]);

  const handleUpdateBonusTask = useCallback(async (taskId: any, data: any) => {
    try {
      await updateBonusTaskMutation({ taskId, ...data });
      toast.success("Bonus task updated");
      setEditingBonusTask(null);
      setShowBonusTaskEditor(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update bonus task");
    }
  }, [updateBonusTaskMutation]);

  const handleDeleteBonusTask = useCallback(async (taskId: any) => {
    if (!confirm("Delete this bonus task? This cannot be undone.")) return;
    try {
      await deleteBonusTaskMutation({ taskId });
      toast.success("Bonus task deleted");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete bonus task");
    }
  }, [deleteBonusTaskMutation]);

  const handleToggleTaskActive = useCallback(async (task: any) => {
    try {
      await updateBonusTaskMutation({ taskId: task._id, isActive: !task.isActive });
      toast.success(`Task ${task.isActive ? "disabled" : "enabled"}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to toggle task");
    }
  }, [updateBonusTaskMutation]);

  // ─── Computed ───
  const prizePoolTotal = prizes.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const prizePoolValid = !prizes.length || prizePoolTotal <= Number(prizeAmount);
  const totalTickets = (entries || []).reduce((sum: number, e: any) => sum + e.ticketCount, 0);
  const totalReferrals = (entries || []).filter((e: any) => e.referralSource).length;

  return (
    <AdminShell activeItem="raffle" title={isCreateMode ? "Create Raffle" : `Edit Raffle`} subtitle={isCreateMode ? "New campaign" : raffle ? `/${raffle.slug}` : "Loading..."}>
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb + Header */}
        <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 mb-4">
          <button onClick={() => navigate("/admin?tab=raffle")} className="hover:text-zinc-900 transition-colors">Raffles</button>
          <ChevronRight size={12} />
          <span className="text-zinc-900">{isCreateMode ? "New Raffle" : raffle?.title || "Loading..."}</span>
        </div>

        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black">{isCreateMode ? "Create Raffle" : raffle?.title || "Edit Raffle"}</h1>
            <p className="text-sm text-zinc-500 font-medium mt-1">
              {isCreateMode ? "Configure your Spotify raffle campaign" : `Manage all aspects of your raffle campaign`}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!isCreateMode && raffle && <RaffleStatusBadge status={raffle.status} />}
            <a href={`/raffle/${raffle?.slug || slug}`} target="_blank" rel="noopener noreferrer"
              className="h-9 px-4 rounded-xl border border-black/5 text-xs font-bold text-zinc-500 hover:bg-zinc-50 transition-all flex items-center gap-1.5">
              <Eye size={14} /> Preview
            </a>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-2xl bg-red-50 text-red-600 text-xs font-bold">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {/* Main Layout: Tabs | Content | Preview */}
        <div className="flex gap-6">
          {/* ─── Vertical Tabs ─── */}
          <div className="hidden md:flex flex-col gap-1 w-48 shrink-0">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 h-10 px-3 rounded-xl text-xs font-bold text-left transition-all ${
                  activeTab === tab.id
                    ? "bg-zinc-900 text-white shadow-sm"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                }`}>
                <span className="shrink-0">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Mobile tab bar (horizontal scroll) */}
          <div className="md:hidden overflow-x-auto -mx-4 px-4 mb-4 pb-2">
            <div className="flex gap-1 min-w-max">
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 h-9 px-3 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-500"
                  }`}>
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* ─── Tab Content ─── */}
          <div className="flex-1 min-w-0">
            <div className="bg-white border border-black/5 rounded-[2rem] p-6 space-y-6">
              {activeTab === "overview" && (
                <div className="space-y-5">
                  <div>
                    <h4 className="text-sm font-black flex items-center gap-2"><Settings size={16} /> Overview</h4>
                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                      Set the name, URL slug, status, and visual identity for your raffle campaign.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="text-xs font-bold text-zinc-700">Title *</label>
                      <p className="text-[10px] text-zinc-400 font-medium mt-0.5 mb-1.5">The public name of your raffle campaign.</p>
                      <input value={title} onChange={e => { setTitle(e.target.value); markDirty(); }}
                        className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900" />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="text-xs font-bold text-zinc-700">Slug *</label>
                      <p className="text-[10px] text-zinc-400 font-medium mt-0.5 mb-1.5">URL-friendly identifier.</p>
                      <input value={slug} onChange={e => { setSlug(e.target.value); markDirty(); }}
                        className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-zinc-700">Status</label>
                      <p className="text-[10px] text-zinc-400 font-medium mt-0.5 mb-1.5">Controls visibility to participants.</p>
                      <select value={status} onChange={e => { setStatus(e.target.value as RaffleStatus); markDirty(); }}
                        className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900">
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="closed">Closed</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-700">Description</label>
                    <p className="text-[10px] text-zinc-400 font-medium mt-0.5 mb-1.5">A short summary participants will see.</p>
                    <textarea value={description} onChange={e => { setDescription(e.target.value); markDirty(); }} rows={2}
                      className="w-full rounded-2xl border border-black/5 bg-zinc-50 px-4 py-3 text-sm font-bold outline-none focus:border-zinc-900 resize-none" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <BannerUpload currentUrl={heroImageUrl} onUpload={(url) => { setHeroImageUrl(url); markDirty(); }} onRemove={() => { setHeroImageUrl(undefined); markDirty(); }} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-700">Accent Color</label>
                      <p className="text-[10px] text-zinc-400 font-medium mt-0.5 mb-1.5">Theme color for your campaign visuals.</p>
                      <input type="color" value={accentColor} onChange={e => { setAccentColor(e.target.value); markDirty(); }}
                        className="w-full h-10 rounded-xl border border-black/5 cursor-pointer" />
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {PRESET_COLORS.slice(0, 8).map(c => (
                          <button key={c} type="button" onClick={() => { setAccentColor(c); markDirty(); }}
                            className={`w-5 h-5 rounded-full border-2 transition-all ${accentColor === c ? "border-zinc-900 scale-110" : "border-transparent"}`}
                            style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "schedule" && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-black flex items-center gap-2"><Calendar size={16} /> Schedule</h4>
                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                      Set the draw frequency and timing for your raffle campaign.
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Draw Frequency</label>
                    <div className="flex gap-2 mt-1">
                      {(["one_time", "weekly", "monthly"] as const).map(f => (
                        <button key={f} type="button" onClick={() => { setFrequency(f); markDirty(); }}
                          className={`flex-1 h-10 rounded-xl text-xs font-black transition-all ${
                            frequency === f ? "bg-zinc-900 text-white" : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
                          }`}>
                          {f === "one_time" ? "One-Time" : f === "weekly" ? "Weekly" : "Monthly"}
                        </button>
                      ))}
                    </div>
                  </div>
                  {frequency === "one_time" ? (
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Draw Date *</label>
                      <input value={drawDate} onChange={e => { setDrawDate(e.target.value); markDirty(); }} type="datetime-local"
                        className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900 mt-1" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Start Date *</label>
                        <input value={startDate} onChange={e => { setStartDate(e.target.value); markDirty(); }} type="date"
                          className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900 mt-1" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">End Date (optional)</label>
                        <input value={endDate} onChange={e => { setEndDate(e.target.value); markDirty(); }} type="date"
                          className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900 mt-1" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Draw Time</label>
                        <input value={drawTime} onChange={e => { setDrawTime(e.target.value); markDirty(); }} type="time"
                          className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900 mt-1" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                          {frequency === "weekly" ? "Draw Day" : "Draw on Day"}
                        </label>
                        {frequency === "weekly" ? (
                          <select value={drawDay} onChange={e => { setDrawDay(Number(e.target.value)); markDirty(); }}
                            className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900 mt-1">
                            {DAYS_OF_WEEK.map((day, i) => <option key={i} value={i}>{day}</option>)}
                          </select>
                        ) : (
                          <select value={drawDay} onChange={e => { setDrawDay(Number(e.target.value)); markDirty(); }}
                            className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900 mt-1">
                            {DAY_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        )}
                      </div>
                    </div>
                  )}
                  {!isCreateMode && raffle?.nextDrawDate && (
                    <p className="text-[10px] font-bold text-emerald-600">Next draw: {new Date(raffle.nextDrawDate).toLocaleString()}</p>
                  )}
                </div>
              )}

              {activeTab === "prizes" && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-black flex items-center gap-2"><Award size={16} /> Prize Configuration</h4>
                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                      Configure how prize money will be distributed to winners.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-zinc-700">Total Prize Pool *</label>
                      <p className="text-[10px] text-zinc-400 font-medium mt-0.5 mb-1.5">Total amount distributed across all winners.</p>
                      <input value={prizeAmount} onChange={e => { setPrizeAmount(e.target.value); markDirty(); }} type="number" min="1"
                        placeholder="Enter total prize amount"
                        className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900 placeholder:text-zinc-300" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-700">Number of Winners</label>
                      <p className="text-[10px] text-zinc-400 font-medium mt-0.5 mb-1.5">How many participants will receive a prize.</p>
                      <input value={numWinners} onChange={e => { setNumWinners(e.target.value); markDirty(); }} type="number" min="1"
                        placeholder="Enter number of winners"
                        className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900 placeholder:text-zinc-300" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <label className="text-xs font-bold text-zinc-700">Prize Tiers</label>
                        <p className="text-[10px] text-zinc-400 font-medium mt-0.5">Create custom prize amounts for each winner instead of splitting the prize pool equally.</p>
                      </div>
                      <button type="button" onClick={addPrizeTier}
                        className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 flex items-center gap-1 shrink-0">
                        <Plus size={12} /> Add Tier
                      </button>
                    </div>
                    <div className="space-y-2">
                      {prizes.map((p, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input value={p.label} onChange={e => updatePrize(i, "label", e.target.value)}
                            placeholder={`${i === 0 ? "🥇 First Prize" : i === 1 ? "🥈 Second Prize" : i === 2 ? "🥉 Third Prize" : `${i + 1}th Prize`}`}
                            className="flex-1 h-10 rounded-xl border border-black/5 bg-zinc-50 px-3 text-xs font-bold outline-none focus:border-zinc-900 placeholder:text-zinc-300" />
                          <input value={p.amount} onChange={e => updatePrize(i, "amount", e.target.value)}
                            type="number" min="1" placeholder="Amount"
                            className="w-28 h-10 rounded-xl border border-black/5 bg-zinc-50 px-3 text-xs font-bold outline-none focus:border-zinc-900 placeholder:text-zinc-300" />
                          <button type="button" onClick={() => removePrizeTier(i)}
                            className="h-10 w-10 rounded-xl hover:bg-red-50 text-red-400 hover:text-red-600 flex items-center justify-center"><X size={14} /></button>
                        </div>
                      ))}
                      {prizes.length === 0 && (
                        <div className="bg-zinc-50 rounded-xl p-3 text-xs text-zinc-400 font-medium leading-relaxed">
                          <span className="font-bold text-zinc-500">Example:</span> 🥇 First Prize → ₦20,000 · 🥈 Second Prize → ₦10,000 · 🥉 Third Prize → ₦5,000
                        </div>
                      )}
                    </div>
                    {prizes.length > 0 && !prizePoolValid && (
                      <p className="text-[10px] font-bold text-red-500 mt-1">Tier total (₦{prizePoolTotal.toLocaleString()}) exceeds prize pool (₦{Number(prizeAmount).toLocaleString()})</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "tickets" && (
                <div className="space-y-5">
                  <div>
                    <h4 className="text-sm font-black flex items-center gap-2"><Ticket size={16} /> Ticket Rules</h4>
                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                      Configure how participants earn tickets through referrals and bonus tasks.
                    </p>
                  </div>

                  {/* Referral Settings */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-black uppercase tracking-widest text-zinc-400">Referral Rewards</h5>
                    <Toggle label="Enable Referrals" desc="Allow participants to earn bonus tickets through successful referrals." checked={referralEnabled} onChange={(v) => { setReferralEnabled(v); markDirty(); }} />
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-bold text-zinc-700">Tickets Per Referral</label>
                        <p className="text-[10px] text-zinc-400 font-medium mt-0.5 mb-1.5">Tickets awarded for every successful referral.</p>
                        <input value={referralReward} onChange={e => { setReferralReward(e.target.value); markDirty(); }} type="number" min="1"
                          className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900 disabled:opacity-50" disabled={!referralEnabled} />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-zinc-700">Max Referral Tickets</label>
                        <p className="text-[10px] text-zinc-400 font-medium mt-0.5 mb-1.5">Maximum bonus tickets from referrals. Leave empty for unlimited.</p>
                        <input value={maxReferralTickets} onChange={e => { setMaxReferralTickets(e.target.value); markDirty(); }} type="number" min="1" placeholder="Unlimited"
                          className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900 placeholder:text-zinc-300 disabled:opacity-50" disabled={!referralEnabled} />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-zinc-700">Max Referrals/User</label>
                        <p className="text-[10px] text-zinc-400 font-medium mt-0.5 mb-1.5">Limit referrals counted per participant. Leave empty for unlimited.</p>
                        <input value={maxReferralsPerUser} onChange={e => { setMaxReferralsPerUser(e.target.value); markDirty(); }} type="number" min="1" placeholder="Unlimited"
                          className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900 placeholder:text-zinc-300 disabled:opacity-50" disabled={!referralEnabled} />
                      </div>
                    </div>
                    {referralEnabled && (
                      <div className="bg-gradient-to-br from-zinc-50 to-zinc-100/50 rounded-2xl p-4 border border-black/5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Ticket Summary</p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">🎵</span>
                            <span className="text-zinc-600">Purchase Eligible Subscription</span>
                            <span className="ml-auto font-black text-emerald-600">+1 Ticket</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center shrink-0">👥</span>
                            <span className="text-zinc-600">Successfully Refer a Friend</span>
                            <span className="ml-auto font-black text-emerald-600">+{referralReward} Ticket{Number(referralReward) !== 1 ? "s" : ""}</span>
                          </div>
                          {maxReferralTickets && (
                            <div className="text-[10px] text-amber-600 font-bold flex items-center gap-1">📊 Max {maxReferralTickets} referral tickets cap</div>
                          )}
                          {maxReferralsPerUser && (
                            <div className="text-[10px] text-amber-600 font-bold flex items-center gap-1">👤 Max {maxReferralsPerUser} referrals per user</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bonus Tasks */}
                  <div className="border-t border-black/5 pt-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-xs font-black uppercase tracking-widest text-zinc-400">Bonus Tasks ({bonusTasks?.length ?? 0})</h5>
                        <p className="text-[10px] text-zinc-500 font-medium mt-0.5">Additional ways for participants to earn tickets.</p>
                      </div>
                      <button onClick={() => { setEditingBonusTask(null); setShowBonusTaskEditor(true); }}
                        className="inline-flex items-center gap-1 h-8 px-3 rounded-lg bg-zinc-900 text-white text-[10px] font-black hover:bg-zinc-800">
                        <Plus size={12} /> New Task
                      </button>
                    </div>
                    {!bonusTasks ? (
                      <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-zinc-300" /></div>
                    ) : bonusTasks.length === 0 ? (
                      <p className="text-xs text-zinc-400 font-medium text-center py-4">No bonus tasks created yet</p>
                    ) : (
                      <div className="space-y-2">
                        {bonusTasks.map((task: any) => (
                          <div key={task._id} className="bg-zinc-50 rounded-xl p-3 flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${task.isActive ? "bg-zinc-200" : "bg-zinc-100"}`}>
                              <Gift size={14} className="text-zinc-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold truncate">{task.name}</span>
                                {task.type === "daily" ? (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-100 text-violet-600 font-black">Daily</span>
                                ) : (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-600 font-black">Permanent</span>
                                )}
                                {task.isActive ? (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-600 font-black">Active</span>
                                ) : (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-400 font-black">Disabled</span>
                                )}
                              </div>
                              <p className="text-[10px] text-zinc-500 truncate">{task.description}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-black text-emerald-600">+{task.rewardTickets} tickets</span>
                                <span className="text-[9px] text-zinc-400">{task.verificationMethod.replace(/_/g, ' ')}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleToggleTaskActive(task)}
                                className="w-7 h-7 rounded-lg hover:bg-white flex items-center justify-center text-zinc-400 hover:text-zinc-600"
                                title={task.isActive ? "Disable" : "Enable"}>
                                {task.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                              </button>
                              <button onClick={() => { setEditingBonusTask(task); setShowBonusTaskEditor(true); }}
                                className="w-7 h-7 rounded-lg hover:bg-white flex items-center justify-center text-zinc-400 hover:text-zinc-600">
                                <Edit3 size={12} />
                              </button>
                              <button onClick={() => handleDeleteBonusTask(task._id)}
                                className="w-7 h-7 rounded-lg hover:bg-white flex items-center justify-center text-red-400 hover:text-red-600">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {bonusStats && (
                      <p className="text-[10px] text-zinc-500 font-medium">
                        {bonusStats.totalCompletions} completions · {bonusStats.totalBonusTickets} bonus tickets awarded
                      </p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "eligibility" && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-black flex items-center gap-2"><ThumbsUp size={16} /> Eligibility Rules</h4>
                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                      Only participants who meet all of the following conditions will be entered into the raffle.
                    </p>
                  </div>
                  {eligibilityRules.length > 0 && (
                    <div className="bg-emerald-50/50 rounded-2xl p-4 space-y-2 border border-emerald-100">
                      {eligibilityRules.map((rule, i) => {
                        const statement = (() => {
                          switch (rule.field) {
                            case "has_spotify": return "Participant must have an active Spotify subscription.";
                            case "min_subscription_age": return `Subscription must be at least ${rule.value} days old.`;
                            case "account_status": return "Account status must be active.";
                            case "not_disqualified": return "Participant must not be disqualified.";
                            case "country": return `Country / region must be ${rule.value}.`;
                            default: return `${rule.field} ${rule.operator} ${rule.value}`;
                          }
                        })();
                        return (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <span className="text-emerald-600 shrink-0">✅</span>
                            <span className="text-zinc-700 font-medium flex-1">{statement}</span>
                            <button type="button" onClick={() => removeRule(i)}
                              className="shrink-0 w-6 h-6 rounded-lg hover:bg-emerald-100 text-zinc-400 hover:text-red-500 flex items-center justify-center transition-colors"><X size={12} /></button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div className="space-y-3">
                    {eligibilityRules.map((rule, i) => (
                      <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-zinc-50 border border-black/5">
                        <select value={rule.field} onChange={e => { updateRule(i, "field", e.target.value); }}
                          className="flex-1 h-9 rounded-lg border border-black/5 bg-white px-2.5 text-xs font-bold outline-none focus:border-zinc-900">
                          <option value="has_spotify">Has Spotify Subscription</option>
                          <option value="min_subscription_age">Min Subscription Age</option>
                          <option value="account_status">Account Status</option>
                          <option value="not_disqualified">Not Disqualified</option>
                          <option value="country">Country / Region</option>
                        </select>
                        <select value={rule.operator} onChange={e => { updateRule(i, "operator", e.target.value); }}
                          className="w-16 h-9 rounded-lg border border-black/5 bg-white px-1 text-xs font-bold outline-none focus:border-zinc-900">
                          <option value="eq">=</option>
                          <option value="neq">≠</option>
                          <option value="gte">≥</option>
                          <option value="lt">&lt;</option>
                        </select>
                        {rule.field === "min_subscription_age" ? (
                          <div className="flex items-center gap-1">
                            <input value={rule.value} onChange={e => { updateRule(i, "value", e.target.value); }} type="number" min="1" placeholder="Days"
                              className="w-16 h-9 rounded-lg border border-black/5 bg-white px-2 text-xs font-bold outline-none focus:border-zinc-900 placeholder:text-zinc-300" />
                            <span className="text-[10px] font-bold text-zinc-400">days</span>
                          </div>
                        ) : rule.field === "country" ? (
                          <input value={rule.value} onChange={e => { updateRule(i, "value", e.target.value); }} placeholder="e.g. NG"
                            className="w-16 h-9 rounded-lg border border-black/5 bg-white px-2 text-xs font-bold outline-none focus:border-zinc-900 placeholder:text-zinc-300" />
                        ) : (
                          <select value={rule.value} onChange={e => { updateRule(i, "value", e.target.value); }}
                            className="flex-1 h-9 rounded-lg border border-black/5 bg-white px-2.5 text-xs font-bold outline-none focus:border-zinc-900">
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                          </select>
                        )}
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={addRule}
                    className="w-full h-10 rounded-xl border-2 border-dashed border-black/10 text-xs font-bold text-zinc-400 hover:text-zinc-600 hover:border-zinc-300 transition-all flex items-center justify-center gap-1">
                    <Plus size={14} /> Add Rule
                  </button>
                </div>
              )}

              {activeTab === "notifications" && (
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-black flex items-center gap-2"><Bell size={16} /> Notifications</h4>
                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                      Configure the notifications participants receive before, during, and after the raffle.
                    </p>
                  </div>
                  <Toggle label="Ticket Earned" desc="Notify participants each time they earn a raffle ticket." checked={notifOnEntry} onChange={(v) => { setNotifOnEntry(v); markDirty(); }} />
                  <Toggle label="Referral Successful" desc="Notify participants when someone joins through their referral link." checked={notifOnReferral} onChange={(v) => { setNotifOnReferral(v); markDirty(); }} />
                  <Toggle label="Winner Announcement" desc="Notify all participants when the winner is officially announced." checked={notifOnWinner} onChange={(v) => { setNotifOnWinner(v); markDirty(); }} />
                  <Toggle label="Reminder Before Draw" desc="Send a friendly reminder before the raffle draw takes place." checked={notifOnReminder} onChange={(v) => { setNotifOnReminder(v); markDirty(); }} />
                  <Toggle label="Prize Distributed" desc="Notify winners when their prize has been successfully distributed." checked={notifOnClaimed} onChange={(v) => { setNotifOnClaimed(v); markDirty(); }} />
                </div>
              )}

              {activeTab === "automation" && (
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-black flex items-center gap-2"><Sliders size={16} /> Automation</h4>
                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                      Automate raffle events so everything runs on autopilot from drawing winners to sending notifications.
                    </p>
                  </div>
                  <Toggle label="Auto Draw Winner" desc="Select winner(s) automatically when draw time arrives." checked={autoDraw} onChange={(v) => { setAutoDraw(v); markDirty(); }} />
                  <Toggle label="Auto Publish Winners" desc="Announce winners publicly without manual approval." checked={autoPublish} onChange={(v) => { setAutoPublish(v); markDirty(); }} />
                  <Toggle label="Auto Notify Winners" desc="Send notifications to winners automatically." checked={autoNotify} onChange={(v) => { setAutoNotify(v); markDirty(); }} />
                  {frequency !== "one_time" && (
                    <Toggle label="Auto Generate Next Draw" desc="Schedule the next round immediately after a draw completes." checked={autoGenerateNext} onChange={(v) => { setAutoGenerateNext(v); markDirty(); }} />
                  )}
                  <Toggle label="Lock Entries Before Draw" desc="Prevent new entries once the draw time is reached." checked={autoLockEntries} onChange={(v) => { setAutoLockEntries(v); markDirty(); }} />
                </div>
              )}

              {activeTab === "analytics" && !isCreateMode && raffle && (
                <div className="space-y-5">
                  <div>
                    <h4 className="text-sm font-black flex items-center gap-2"><BarChart3 size={16} /> Analytics</h4>
                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                      View real-time stats, entries, leaderboard, and activity for this raffle.
                    </p>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-zinc-50 rounded-2xl p-4">
                      <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Participants</div>
                      <div className="text-lg font-black">{stats?.totalParticipants ?? entries?.length ?? 0}</div>
                    </div>
                    <div className="bg-zinc-50 rounded-2xl p-4">
                      <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Total Tickets</div>
                      <div className="text-lg font-black">{stats?.totalTickets ?? totalTickets}</div>
                    </div>
                    <div className="bg-zinc-50 rounded-2xl p-4">
                      <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Referrals</div>
                      <div className="text-lg font-black">{stats?.totalReferrals ?? totalReferrals}</div>
                    </div>
                    <div className="bg-zinc-50 rounded-2xl p-4">
                      <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Days Left</div>
                      <div className="text-lg font-black">{stats?.daysRemaining ?? "-"}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  {raffle.status !== "completed" && (
                    <div className="flex gap-2">
                      {raffle.status === "draft" && (
                        <button onClick={() => handleUpdateStatus("published")}
                          className="flex-1 h-11 rounded-2xl bg-emerald-500 text-white text-xs font-black hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-sm">
                          <CheckCircle2 size={16} /> Publish Raffle
                        </button>
                      )}
                      {raffle.status === "published" && (
                        <>
                          <button onClick={handleDrawWinner}
                            className="flex-1 h-11 rounded-2xl bg-amber-500 text-white text-xs font-black hover:bg-amber-600 transition-all flex items-center justify-center gap-2 shadow-sm">
                            <Sparkles size={16} /> Draw Winner
                          </button>
                          <button onClick={() => handleUpdateStatus("closed")}
                            className="h-11 w-11 rounded-2xl bg-amber-50 text-amber-600 hover:bg-amber-100 transition-all flex items-center justify-center">
                            <Ban size={16} />
                          </button>
                        </>
                      )}
                      {raffle.status === "closed" && (
                        <button onClick={() => handleUpdateStatus("published")}
                          className="flex-1 h-11 rounded-2xl bg-emerald-50 text-emerald-600 text-xs font-black hover:bg-emerald-100 transition-all flex items-center justify-center gap-1.5">
                          <RefreshCw size={14} /> Reopen
                        </button>
                      )}
                    </div>
                  )}

                  {raffle.status === "completed" && !raffle.winnerAnnounced && (
                    <button onClick={handlePublishWinner}
                      className="w-full h-11 rounded-2xl bg-blue-500 text-white text-xs font-black hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-sm">
                      <CheckCircle2 size={16} /> Publish Winner
                    </button>
                  )}

                  {/* Winners */}
                  {winners && winners.length > 0 && (
                    <div className="border-t border-black/5 pt-5">
                      <h5 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3">Winners ({winners.length})</h5>
                      <div className="space-y-2">
                        {winners.map((w: any) => (
                          <div key={w._id} className="bg-zinc-50 rounded-xl p-3 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-black text-xs">#{w.position}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold truncate">User {w.userId.slice(-8)}</p>
                              <p className="text-[10px] text-zinc-500 font-medium">{new Date(w.announcedAt).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-black text-emerald-600">₦{w.prize.toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Leaderboard */}
                  {leaderboard && leaderboard.length > 0 && (
                    <div className="border-t border-black/5 pt-5">
                      <h5 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3 flex items-center gap-1.5">
                        <Medal size={14} /> Top Leaderboard
                      </h5>
                      <div className="space-y-1">
                        {leaderboard.map((entry: any) => (
                          <div key={entry.userId} className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-zinc-50 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-zinc-400 w-4">#{entry.rank}</span>
                              <span className="font-bold">@{entry.username}</span>
                            </div>
                            <span className="font-black text-emerald-600">{entry.ticketCount} tickets</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Entries */}
                  {entries && entries.length > 0 && (
                    <div className="border-t border-black/5 pt-5">
                      <h5 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3">Entries ({entries.length})</h5>
                      <div className="max-h-60 overflow-y-auto space-y-1">
                        {entries.map((e: any) => (
                          <div key={e._id} className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-zinc-50 text-xs">
                            <span className="font-mono font-bold text-zinc-700">{e.raffleNumber || "—"}</span>
                            <span className="text-zinc-500 font-medium">{e.userId.slice(-8)}</span>
                            <span className="font-black">{e.ticketCount} ticket{e.ticketCount !== 1 ? "s" : ""}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Activity */}
                  <div className="border-t border-black/5 pt-5">
                    <h5 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3 flex items-center gap-1.5">
                      Activity Timeline
                    </h5>
                    {!activities ? (
                      <div className="flex items-center justify-center py-4"><Loader2 size={16} className="animate-spin text-zinc-300" /></div>
                    ) : activities.length === 0 ? (
                      <p className="text-xs text-zinc-400 font-medium text-center py-4">No activity yet</p>
                    ) : (
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {activities.map((act: any) => (
                          <div key={act.id} className="flex items-start gap-3 px-3 py-2 rounded-xl hover:bg-zinc-50">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                              act.type === "winner" ? "bg-amber-100 text-amber-600" :
                              act.type === "referral" ? "bg-purple-100 text-purple-600" :
                              "bg-blue-100 text-blue-600"
                            }`}>
                              {act.type === "winner" ? <Medal size={12} /> : act.type === "referral" ? <Gift size={12} /> : <Users size={12} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-bold truncate">{act.action}</p>
                                {act.user && (
                                  <span className="text-[10px] text-zinc-400 font-medium truncate">@{act.user.username || act.user.full_name?.split(" ")[0]}</span>
                                )}
                              </div>
                              <p className="text-[10px] text-zinc-500">{act.description}</p>
                              <p className="text-[9px] text-zinc-400 mt-0.5">{new Date(act.timestamp).toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "analytics" && isCreateMode && (
                <div className="py-12 text-center">
                  <BarChart3 size={40} className="mx-auto text-zinc-300 mb-3" />
                  <p className="text-sm font-bold text-zinc-500">Save the raffle first to view analytics</p>
                  <p className="text-xs text-zinc-400 mt-1">Analytics become available after the raffle is created.</p>
                </div>
              )}
            </div>
          </div>

          {/* ─── Live Preview Panel ─── */}
          <div className="hidden lg:block w-80 shrink-0">
            <div className="sticky top-8 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                <Eye size={12} /> Live Preview
              </p>
              <div className="bg-white border border-black/5 rounded-[2rem] overflow-hidden shadow-sm">
                {heroImageUrl ? (
                  <img src={heroImageUrl} alt="Campaign artwork" className="w-full h-28 object-contain bg-zinc-50" />
                ) : (
                  <div className="w-full h-28 bg-gradient-to-br from-zinc-100 to-zinc-200 flex items-center justify-center">
                    <ImageIcon size={24} className="text-zinc-300" />
                  </div>
                )}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-black text-sm truncate">{title || "Raffle Title"}</h3>
                    {slug && <p className="text-[10px] text-zinc-400 font-medium">/{slug}</p>}
                  </div>
                  {description && (
                    <p className="text-[10px] text-zinc-500 leading-relaxed line-clamp-2">{description}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black" style={{ color: accentColor }}>
                      ₦{Number(prizeAmount).toLocaleString() || "0"}
                    </span>
                    <span className="text-[9px] text-zinc-400 font-bold">Prize Pool</span>
                  </div>
                  {numWinners && (
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                      <Users size={10} /> {numWinners} winner{Number(numWinners) !== 1 ? "s" : ""}
                    </div>
                  )}
                  {referralEnabled && (
                    <div className="bg-zinc-50 rounded-xl px-3 py-2">
                      <div className="text-[9px] font-bold text-zinc-500 flex items-center gap-1">
                        <Gift size={10} /> +{referralReward} tickets per referral
                      </div>
                    </div>
                  )}
                  {frequency === "one_time" && drawDate && (
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                      <Clock size={10} /> Draws {new Date(drawDate).toLocaleDateString()}
                    </div>
                  )}
                  {frequency !== "one_time" && (
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                      <Repeat2 size={10} /> {frequency.charAt(0).toUpperCase() + frequency.slice(1)} draws
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: accentColor }} />
                    <span className="text-[9px] text-zinc-400 font-medium">{accentColor}</span>
                  </div>
                </div>
              </div>
              {/* Prize Tiers Preview */}
              {prizes.filter(p => p.amount && p.label).length > 0 && (
                <div className="bg-white border border-black/5 rounded-[2rem] p-4 space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Prize Tiers</p>
                  {prizes.filter(p => p.amount && p.label).map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="font-bold text-zinc-700">{p.label}</span>
                      <span className="font-black text-emerald-600">₦{Number(p.amount).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
              {/* Quick Actions */}
              {!isCreateMode && raffle && (
                <div className="bg-white border border-black/5 rounded-[2rem] p-4 space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Quick Actions</p>
                  <button onClick={() => navigator.clipboard.writeText(raffle._id)}
                    className="w-full h-8 rounded-xl border border-black/5 text-[10px] font-bold text-zinc-500 hover:bg-zinc-50 transition-all flex items-center justify-center gap-1.5">
                    <Copy size={12} /> Copy Raffle ID
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Sticky Save Bar ─── */}
      <div className={`sticky bottom-0 left-0 right-0 z-30 transition-all duration-300 ${dirty || saveStatus === "saved" || saveStatus === "error" ? "translate-y-0" : "translate-y-full"}`}>
        <div className="bg-white/95 backdrop-blur-lg border-t border-black/5 shadow-lg shadow-black/5 px-4 sm:px-6 lg:px-8 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              {saveStatus === "saved" && (
                <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold">
                  <CheckCircle2 size={14} /> Saved
                </span>
              )}
              {saveStatus === "error" && (
                <span className="flex items-center gap-1.5 text-red-600 text-xs font-bold">
                  <AlertCircle size={14} /> Save failed
                </span>
              )}
              {saveStatus === "saving" && (
                <span className="flex items-center gap-1.5 text-zinc-500 text-xs font-bold">
                  <Loader2 size={14} className="animate-spin" /> Saving...
                </span>
              )}
              {dirty && (
                <span className="text-[10px] text-amber-600 font-bold">Unsaved changes</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => {
                if (isCreateMode) navigate("/admin?tab=raffle");
                else { navigate("/admin?tab=raffle"); }
              }}
                className="h-10 px-5 rounded-xl border border-black/5 text-xs font-bold text-zinc-500 hover:bg-zinc-50 transition-all flex items-center gap-1.5">
                <ArrowLeft size={14} /> {isCreateMode ? "Cancel" : "Back to List"}
              </button>
              <button onClick={handleSave} disabled={saving}
                className="h-10 px-6 rounded-xl bg-zinc-900 text-white text-xs font-black hover:bg-zinc-800 transition-all flex items-center gap-2 disabled:opacity-60 shadow-sm">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {isCreateMode ? (publishAfterCreate ? "Create & Publish" : "Create Raffle") : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Bonus Task Editor Modal ─── */}
      <AnimatePresence>
        {showBonusTaskEditor && (
          <BonusTaskEditor
            task={editingBonusTask}
            onSave={(data: any) => {
              if (editingBonusTask) {
                handleUpdateBonusTask(editingBonusTask._id, data);
              } else {
                handleCreateBonusTask(data);
              }
            }}
            onClose={() => { setShowBonusTaskEditor(false); setEditingBonusTask(null); }}
          />
        )}
      </AnimatePresence>
    </AdminShell>
  );
}

// ─── Bonus Task Editor Modal ───
const PLATFORMS = ["X", "Instagram", "TikTok", "Facebook", "YouTube", "WhatsApp", "Telegram", "Discord", "Spotify", "Website", "Custom"];
const VERIFICATION_METHODS = ["button_click", "link_visit", "profile_completion", "referral_completion", "manual_approval", "admin_approval", "api"];

function BonusTaskEditor({ task, onSave, onClose }: {
  task: any;
  onSave: (data: any) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(task?.name || "");
  const [description, setDescription] = useState(task?.description || "");
  const [platform, setPlatform] = useState(task?.platform || "X");
  const [icon, setIcon] = useState(task?.icon || "");
  const [rewardTickets, setRewardTickets] = useState(String(task?.rewardTickets || ""));
  const [verificationMethod, setVerificationMethod] = useState(task?.verificationMethod || "button_click");
  const [destinationUrl, setDestinationUrl] = useState(task?.destinationUrl || "");
  const [type, setType] = useState(task?.type || "permanent");
  const [activeDate, setActiveDate] = useState(task?.activeDate ? new Date(task.activeDate).toISOString().split("T")[0] : "");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !rewardTickets) {
      setError("Name and reward tickets are required");
      return;
    }
    onSave({
      name: name.trim(),
      description: description.trim(),
      platform,
      icon: icon || undefined,
      rewardTickets: Number(rewardTickets),
      verificationMethod,
      destinationUrl: destinationUrl.trim() || undefined,
      type,
      activeDate: type === "daily" && activeDate ? new Date(activeDate).getTime() : undefined,
    });
  }, [name, description, platform, icon, rewardTickets, verificationMethod, destinationUrl, type, activeDate, onSave]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-black">{task ? "Edit Bonus Task" : "Create Bonus Task"}</h3>
            <p className="text-xs text-zinc-500 font-medium">Configure a bonus ticket challenge</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100"><X size={20} /></button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-2xl bg-red-50 text-red-600 text-xs font-bold">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Task Name *</label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="Follow us on X"
              className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900 mt-1" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Follow our X account and earn bonus tickets"
              rows={2}
              className="w-full rounded-2xl border border-black/5 bg-zinc-50 px-4 py-3 text-sm font-bold outline-none focus:border-zinc-900 mt-1 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Platform</label>
              <select value={platform} onChange={e => setPlatform(e.target.value)}
                className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900 mt-1">
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Reward Tickets *</label>
              <input value={rewardTickets} onChange={e => setRewardTickets(e.target.value)} type="number" min="1"
                placeholder="2"
                className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900 mt-1" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Verification Method</label>
            <select value={verificationMethod} onChange={e => setVerificationMethod(e.target.value)}
              className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900 mt-1">
              {VERIFICATION_METHODS.map(v => <option key={v} value={v}>{v.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Destination URL (optional)</label>
            <input value={destinationUrl} onChange={e => setDestinationUrl(e.target.value)}
              placeholder="https://x.com/jointheq"
              className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900 mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Type</label>
              <select value={type} onChange={e => setType(e.target.value)}
                className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900 mt-1">
                <option value="permanent">Permanent</option>
                <option value="daily">Daily</option>
              </select>
            </div>
            {type === "daily" && (
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Schedule Date</label>
                <input value={activeDate} onChange={e => setActiveDate(e.target.value)}
                  type="date"
                  className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900 mt-1" />
              </div>
            )}
          </div>

          <button type="submit"
            className="w-full h-12 rounded-2xl bg-zinc-900 text-white text-xs font-black hover:bg-zinc-800 transition-all flex items-center justify-center gap-2">
            <CheckCircle2 size={16} />
            {task ? "Save Changes" : "Create Task"}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
