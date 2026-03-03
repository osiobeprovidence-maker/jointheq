import { useState, useEffect, FormEvent } from "react";
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Logo } from './Logo';
import { Eye, EyeOff } from 'lucide-react';

export function ConsoleLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already logged in
    fetch('/api/console/status')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          navigate('/console/dashboard');
        }
      });
  }, [navigate]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/console/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        navigate('/console/dashboard');
      } else {
        setError(data.error || 'Invalid credentials.');
      }
    } catch (err) {
      setError('Invalid credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <Logo className="w-12 h-12 mx-auto mb-4" />
          <h1 className="text-2xl font-bold tracking-tight text-white">Q Console</h1>
          <p className="text-white/40 text-sm mt-1">Infrastructure Management</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-white/50 px-1">Email</label>
            <input
              type="email"
              placeholder="admin@jointheq.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-all focus:ring-1 focus:ring-white/20"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-white/50 px-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-all focus:ring-1 focus:ring-white/20"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-red-400 text-xs text-center font-medium bg-red-400/10 py-2 rounded-lg border border-red-400/20"
            >
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white text-black font-bold rounded-xl px-4 py-3 hover:bg-white/90 transition-all disabled:opacity-50 active:scale-[0.98]"
          >
            {isLoading ? 'Verifying...' : 'Login'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[10px] text-white/20 uppercase tracking-[0.2em]">Authorized Personnel Only</p>
        </div>
      </motion.div>
    </div>
  );
}

export function ConsoleDashboard() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/console/status')
      .then(res => res.json())
      .then(data => {
        if (!data.authenticated) {
          navigate('/console');
        } else {
          setIsAdmin(true);
        }
      })
      .catch(() => navigate('/console'));
  }, [navigate]);

  const handleLogout = async () => {
    await fetch('/api/console/logout', { method: 'POST' });
    navigate('/console');
  };

  if (isAdmin === null) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 sm:p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-4">
            <Logo className="w-10 h-10" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">Q Console</h1>
              <div className="flex items-center gap-2 text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-0.5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                System Active
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-sm font-medium text-white/60 hover:text-white transition-all"
          >
            Sign Out
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard title="Total Users" value="1,284" detail="+12% this week" />
          <StatCard title="Active Slots" value="452" detail="94% utilization" />
          <StatCard title="Revenue (MTD)" value="₦32.4M" detail="+8.2% vs last month" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <h3 className="text-lg font-bold mb-6">Recent Activity</h3>
            <div className="space-y-6">
              <ActivityItem user="osiobe@q.com" action="Joined Netflix Premium" time="2 mins ago" />
              <ActivityItem user="sarah@mail.com" action="Renewed YouTube Slot" time="15 mins ago" />
              <ActivityItem user="mike@dev.io" action="Funded Wallet ₦5,000" time="1 hour ago" />
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <h3 className="text-lg font-bold mb-6">System Health</h3>
            <div className="space-y-6">
              <HealthItem label="API Endpoints" status="Operational" />
              <HealthItem label="Database Cluster" status="Optimal" />
              <HealthItem label="WebSocket Server" status="Operational" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, detail }: { title: string, value: string, detail: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] transition-all group">
      <div className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">{title}</div>
      <div className="text-3xl font-bold mb-1 tracking-tight">{value}</div>
      <div className="text-[10px] text-white/30 font-medium">{detail}</div>
    </div>
  );
}

function ActivityItem({ user, action, time }: { user: string, action: string, time: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex flex-col">
        <span className="text-sm font-bold">{user}</span>
        <span className="text-xs text-white/40">{action}</span>
      </div>
      <span className="text-[10px] text-white/20 font-medium tabular-nums">{time}</span>
    </div>
  );
}

function HealthItem({ label, status }: { label: string, status: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-4 last:border-0 last:pb-0">
      <span className="text-sm text-white/60">{label}</span>
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
        <span className="text-xs font-bold text-emerald-500 tabular-nums uppercase tracking-widest">{status}</span>
      </div>
    </div>
  );
}
