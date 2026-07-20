import { useState, type ReactNode } from "react";
import {
  Bell,
  Clock,
  CreditCard,
  Headphones,
  Layers,
  LayoutDashboard,
  Menu,
  Shield,
  ShieldCheck,
  ShoppingBag,
  User,
  UserMinus,
  Users,
  Wallet,
  X,
  Gift,
  TrendingUp,
  Award,
  Handshake,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export type AdminMenuKey =
  | "dashboard"
  | "marketplace"
  | "leave_requests"
  | "payments"
  | "review_payments"
  | "user_listings"
  | "users"
  | "support"
  | "security"
  | "admins"
  | "notifications"
  | "queues"
  | "login_logs"
  | "migrations"
  | "enhanced"
  | "referral_campaigns"
  | "qhustle"
  | "raffle"
  | "partnerships"
  | "standard_referrals";

type AdminShellProps = {
  activeItem: AdminMenuKey;
  children: ReactNode;
  currentUser?: any;
  subtitle: string;
  title: string;
};

export type AdminMenuItem = {
  id: AdminMenuKey;
  label: string;
  path: string;
  sub?: string;
  icon: ReactNode;
};

export const adminMenuItems: AdminMenuItem[] = [
  { id: "dashboard", label: "Dashboard", sub: "Platform Command Center", path: "/admin?tab=dashboard", icon: <LayoutDashboard size={18} /> },
  { id: "marketplace", label: "Marketplace", sub: "Subscription Inventory", path: "/admin?tab=marketplace", icon: <ShoppingBag size={18} /> },
  { id: "leave_requests", label: "Leave Requests", sub: "Cancellations", path: "/admin?tab=leave_requests", icon: <UserMinus size={18} /> },
  { id: "payments", label: "Payments", sub: "Transaction History", path: "/admin?tab=payments", icon: <CreditCard size={18} /> },
  { id: "review_payments", label: "Payments Review", sub: "Finance Operations", path: "/admin/payments", icon: <Wallet size={18} /> },
  { id: "user_listings", label: "Listing Review", sub: "Content Moderation", path: "/admin/listings", icon: <Layers size={18} /> },
  { id: "users", label: "Users", sub: "User Management", path: "/admin?tab=users", icon: <Users size={18} /> },
  { id: "support", label: "Support", sub: "Customer Experience", path: "/admin?tab=support", icon: <Headphones size={18} /> },
  { id: "security", label: "Security", sub: "Fraud & Anti-Spam", path: "/admin?tab=security", icon: <ShieldCheck size={18} /> },
  { id: "admins", label: "Admins", sub: "Workforce & Tasks", path: "/admin?tab=admins", icon: <Shield size={18} /> },
  { id: "notifications", label: "Notifications", sub: "Push Updates", path: "/admin?tab=notifications", icon: <Bell size={18} /> },
  { id: "queues", label: "Queues", sub: "Queue Requests", path: "/admin?tab=queues", icon: <Users size={18} /> },
  { id: "login_logs", label: "Login Logs", sub: "User Sign-in Activity", path: "/admin?tab=login_logs", icon: <Clock size={18} /> },
  { id: "referral_campaigns", label: "Referral Campaigns", sub: "Marketing & Rewards", path: "/admin?tab=referral_campaigns", icon: <Gift size={18} /> },
  { id: "qhustle", label: "Q Hustle", sub: "Referral & Earnings", path: "/admin?tab=qhustle", icon: <TrendingUp size={18} /> },
  { id: "raffle", label: "Raffle", sub: "Spotify Giveaways", path: "/admin?tab=raffle", icon: <Award size={18} /> },
  { id: "partnerships", label: "Partnerships", sub: "Partner & Affiliate Mgmt", path: "/admin?tab=partnerships", icon: <Handshake size={18} /> },
  { id: "standard_referrals", label: "Standard Referral", sub: "Boots Reward Config", path: "/admin?tab=standard_referrals", icon: <Gift size={18} /> },
];

export const adminMenuSections: { label: string; items: AdminMenuKey[] }[] = [
  { label: "Overview", items: ["dashboard"] },
  { label: "Subscriptions", items: ["marketplace", "leave_requests"] },
  { label: "Finance", items: ["payments", "review_payments"] },
  { label: "Reviews", items: ["user_listings"] },
  { label: "People & Trust", items: ["users", "support", "security", "admins", "login_logs"] },
  { label: "Engagement", items: ["notifications", "queues"] },
  { label: "Marketing", items: ["referral_campaigns", "qhustle", "raffle", "partnerships", "standard_referrals"] },
];

const menuItemById = new Map(adminMenuItems.map((item) => [item.id, item]));

export function AdminShell({ activeItem, children, currentUser: suppliedUser, subtitle, title }: AdminShellProps) {
  const navigate = useNavigate();
  const currentUser = suppliedUser;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigateTo = (path: string) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  const menu = (mobile = false) => (
    <nav className="flex-1 space-y-2 overflow-y-auto p-3">
      {adminMenuSections.map((section) => (
        <div key={section.label} className="space-y-1">
          <div className="px-3 pt-1.5 text-[9px] font-black uppercase tracking-widest text-white/30">{section.label}</div>
          {section.items.map((itemId) => {
            const item = menuItemById.get(itemId);
            if (!item) return null;
            const active = item.id === activeItem;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateTo(item.path)}
                className={`group w-full rounded-2xl px-3 py-2 text-left transition-all ${
                  active
                    ? "bg-white text-zinc-900 shadow-lg shadow-black/15"
                    : mobile
                      ? "text-white/75 hover:bg-white/10 hover:text-white"
                      : "text-white/55 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${active ? "bg-zinc-100" : "bg-white/5 group-hover:bg-white/10"}`}>
                    {item.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-bold">{item.label}</span>
                    {active && item.sub ? <span className="block truncate text-[10px] font-bold text-zinc-400">{item.sub}</span> : null}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );

  const avatar = currentUser?.profile_image_url ? (
    <img src={currentUser.profile_image_url} alt="Admin profile" className="h-full w-full object-cover" />
  ) : (
    <User size={15} />
  );

  return (
    <div className="h-screen bg-[#f5f5f7] font-['Inter',sans-serif] text-zinc-950 overflow-hidden">
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col bg-zinc-950 text-white md:flex">
        <div className="border-b border-white/5 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-lg font-black">Q</div>
            <div>
              <div className="text-sm font-black">JoinTheQ</div>
              <div className="text-[10px] uppercase tracking-widest text-white/40">Admin Control</div>
            </div>
          </div>
        </div>
        {menu()}
      </aside>

      <header className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between bg-zinc-950 px-4 text-white shadow-lg md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 font-black">Q</div>
          <span className="text-sm font-black">Admin Control</span>
        </div>
        <button type="button" onClick={() => setMobileMenuOpen((open) => !open)} className="rounded-xl bg-white/10 p-2" aria-label="Toggle admin menu">
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button type="button" aria-label="Close admin menu" className="absolute inset-0 bg-black/40" onClick={() => setMobileMenuOpen(false)} />
          <aside className="absolute bottom-0 left-0 top-16 flex w-[88%] max-w-[320px] flex-col bg-zinc-950 text-white overflow-y-auto">{menu(true)}</aside>
        </div>
      ) : null}

      <main className="h-screen pt-16 md:ml-64 md:pt-0 overflow-y-auto">
        <div className="sticky top-0 z-30 hidden items-center justify-between border-b border-black/5 bg-white px-8 py-5 md:flex">
          <div>
            <h1 className="text-xl font-black">{title}</h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full border border-black/5 bg-zinc-50 px-4 py-2.5 text-xs font-bold text-gray-500 shadow-sm">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              System Active
            </div>
            <div className="flex items-center gap-2 rounded-full bg-zinc-950 p-1.5 pr-4 text-white shadow-xl shadow-black/10">
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white/20">{avatar}</div>
              <span className="max-w-32 truncate text-xs font-bold">@{currentUser?.username || currentUser?.full_name || "admin"}</span>
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
