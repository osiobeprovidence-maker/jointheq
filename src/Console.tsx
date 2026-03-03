import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

import { Logo } from './Logo';

export function ConsoleLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locked) return;

    try {
      const res = await fetch('/api/console/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('console_token', data.token);
        navigate('/console/dashboard');
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        if (newAttempts >= 5) {
          setLocked(true);
          setError('Invalid credentials.');
          setTimeout(() => {
            setLocked(false);
            setAttempts(0);
          }, 15 * 60 * 1000); // 15 minutes lock
        } else {
          setError('Invalid credentials.');
        }
      }
    } catch (err) {
      setError('Invalid credentials.');
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
          <h1 className="text-xl font-medium tracking-tight text-white/90">Console Access</h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input 
              type="email" 
              placeholder="Email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
              required
              disabled={locked}
            />
          </div>
          <div>
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
              required
              disabled={locked}
            />
          </div>
          
          {error && (
            <div className="text-red-400 text-sm text-center font-medium">
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={locked}
            className="w-full bg-white text-black font-medium rounded-lg px-4 py-3 hover:bg-white/90 transition-colors disabled:opacity-50"
          >
            {locked ? 'Locked' : 'Login'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export function ConsoleDashboard() {
  const navigate = useNavigate();

  React.useEffect(() => {
    const token = localStorage.getItem('console_token');
    if (!token) {
      navigate('/console');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('console_token');
    navigate('/console');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-12 border-b border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <Logo className="w-8 h-8" />
            <h1 className="text-xl font-medium">Console Dashboard</h1>
          </div>
          <button 
            onClick={handleLogout}
            className="text-sm text-white/50 hover:text-white transition-colors"
          >
            Logout
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
            <div className="text-white/50 text-sm mb-2">System Status</div>
            <div className="text-2xl font-medium flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              Operational
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
            <div className="text-white/50 text-sm mb-2">Active Sessions</div>
            <div className="text-2xl font-medium">1</div>
          </div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
            <div className="text-white/50 text-sm mb-2">Security Level</div>
            <div className="text-2xl font-medium">Maximum</div>
          </div>
        </div>
      </div>
    </div>
  );
}
