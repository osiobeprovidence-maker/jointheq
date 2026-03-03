import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  Users, 
  LayoutDashboard, 
  ShoppingBag, 
  Settings, 
  ChevronRight, 
  Plus, 
  ArrowUpRight, 
  Clock, 
  ShieldCheck,
  Zap,
  Gift,
  LogOut,
  Menu,
  X,
  Sparkles,
  Trophy,
  MessageCircle,
  Tv,
  Smartphone,
  Laptop,
  Monitor,
  Send,
  Image as ImageIcon,
  Trash2,
  User as UserIcon,
  Database,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { User, Subscription, UserSlot, Campaign, Device, Message, LunarMemory, LunarStatus } from './types';
import Markdown from 'react-markdown';
import LandingPage from './LandingPage';
import { Logo } from './Logo';

import { Routes, Route } from 'react-router-dom';
import { ConsoleLogin, ConsoleDashboard } from './Console';

// Mock User ID for the demo
const MOCK_USER_ID = 1;

function MainApp() {
  const [user, setUser] = useState<User | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [activeSlots, setActiveSlots] = useState<UserSlot[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'marketplace' | 'wallet' | 'referrals' | 'campaigns' | 'profile' | 'support' | 'admin'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [useBootsForPayment, setUseBootsForPayment] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [isUpdatingPhone, setIsUpdatingPhone] = useState(false);
  const [isLoggedOut, setIsLoggedOut] = useState(true);
  
  // New State
  const [devices, setDevices] = useState<Device[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatImage, setChatImage] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceType, setNewDeviceType] = useState('Phone');
  
  // Admin Chat State
  const [chatUsers, setChatUsers] = useState<{id: number, full_name: string, email: string}[]>([]);
  const [selectedChatUserId, setSelectedChatUserId] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoggedOut) {
      fetchInitialData();
      setupWebSocket();
    }
  }, [isLoggedOut]);

  const setupWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}`);
    
    socket.onopen = () => {
      socket.send(JSON.stringify({ type: 'auth', userId: MOCK_USER_ID }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'message') {
        setMessages(prev => [...prev, data.data]);
      }
    };

    setWs(socket);
    return () => socket.close();
  };

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const userRes = await fetch(`/api/user/${MOCK_USER_ID}`);
      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData);
      }

      const subsRes = await fetch('/api/subscriptions');
      const subsData = await subsRes.json();
      setSubscriptions(subsData);

      const slotsRes = await fetch(`/api/user/${MOCK_USER_ID}/slots`);
      const slotsData = await slotsRes.json();
      setActiveSlots(slotsData);

      const campaignsRes = await fetch('/api/campaigns');
      const campaignsData = await campaignsRes.json();
      setCampaigns(campaignsData);

      const devicesRes = await fetch(`/api/user/${MOCK_USER_ID}/devices`);
      const devicesData = await devicesRes.json();
      setDevices(devicesData);

      const chatRes = await fetch(`/api/chat/history/${MOCK_USER_ID}`);
      const chatData = await chatRes.json();
      setMessages(chatData);

      if (user?.is_admin) {
        const chatUsersRes = await fetch('/api/admin/chat/users');
        const chatUsersData = await chatUsersRes.json();
        setChatUsers(chatUsersData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fundWallet = async (amount: number) => {
    try {
      const res = await fetch('/api/wallet/fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: MOCK_USER_ID, amount })
      });
      if (res.ok) {
        fetchInitialData();
      }
    } catch (error) {
      console.error("Error funding wallet:", error);
    }
  };

  const joinSlot = async (slotTypeId: number) => {
    try {
      const res = await fetch('/api/slots/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: MOCK_USER_ID, slotTypeId, useBoots: useBootsForPayment })
      });
      const data = await res.json();
      if (res.ok) {
        alert("Successfully joined slot!");
        fetchInitialData();
        setActiveTab('dashboard');
      } else {
        alert(data.error || "Failed to join slot");
      }
    } catch (error) {
      console.error("Error joining slot:", error);
    }
  };

  const updatePhone = async () => {
    if (!newPhone) return;
    setIsUpdatingPhone(true);
    try {
      const res = await fetch(`/api/user/${MOCK_USER_ID}/update-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: newPhone })
      });
      if (res.ok) {
        alert("Phone number updated successfully!");
        fetchInitialData();
        setNewPhone('');
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update phone number");
      }
    } catch (error) {
      console.error("Error updating phone:", error);
    } finally {
      setIsUpdatingPhone(false);
    }
  };

  const updateAllocation = async (slotId: number, allocation: string) => {
    try {
      const res = await fetch(`/api/slots/${slotId}/allocation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allocation })
      });
      if (res.ok) {
        fetchInitialData();
      }
    } catch (error) {
      console.error("Error updating allocation:", error);
    }
  };

  const addDevice = async () => {
    if (!newDeviceName) return;
    try {
      const res = await fetch(`/api/user/${MOCK_USER_ID}/devices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newDeviceName, type: newDeviceType })
      });
      if (res.ok) {
        fetchInitialData();
        setNewDeviceName('');
      }
    } catch (error) {
      console.error("Error adding device:", error);
    }
  };

  const deleteDevice = async (id: number) => {
    try {
      const res = await fetch(`/api/devices/${id}`, { method: 'DELETE' });
      if (res.ok) fetchInitialData();
    } catch (error) {
      console.error("Error deleting device:", error);
    }
  };

  const sendMessage = () => {
    if (!ws || (!chatInput && !chatImage)) return;
    ws.send(JSON.stringify({
      type: 'chat',
      senderId: MOCK_USER_ID,
      receiverId: user?.is_admin ? selectedChatUserId : null,
      content: chatInput,
      imageData: chatImage,
      isFromAdmin: user?.is_admin || false
    }));
    setChatInput('');
    setChatImage(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setChatImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F4] flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-black border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (isLoggedOut) {
    return (
      <LandingPage onLogin={() => {
        setIsLoggedOut(false);
        fetchInitialData();
      }} />
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F4] text-[#141414] font-sans">
      {/* Sidebar / Navigation */}
      <nav className="fixed top-0 left-0 h-full w-64 bg-white border-r border-black/5 hidden lg:flex flex-col p-6 z-50">
        <div className="flex items-center gap-3 mb-10">
          <Logo className="w-10 h-10" />
          <span className="text-xl font-bold tracking-tight">jointheq</span>
        </div>

        <div className="space-y-2 flex-1">
          <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<ShoppingBag size={20} />} label="Marketplace" active={activeTab === 'marketplace'} onClick={() => setActiveTab('marketplace')} />
          <NavItem icon={<Sparkles size={20} />} label="Campaigns" active={activeTab === 'campaigns'} onClick={() => setActiveTab('campaigns')} />
          <NavItem icon={<Wallet size={20} />} label="Wallet" active={activeTab === 'wallet'} onClick={() => setActiveTab('wallet')} />
          <NavItem icon={<Users size={20} />} label="Referrals" active={activeTab === 'referrals'} onClick={() => setActiveTab('referrals')} />
          <NavItem icon={<MessageCircle size={20} />} label="Support" active={activeTab === 'support'} onClick={() => setActiveTab('support')} />
          {user?.is_admin ? (
            <NavItem icon={<Lock size={20} />} label="Admin" active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} />
          ) : null}
          <NavItem icon={<UserIcon size={20} />} label="Profile" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
        </div>

        <div className="pt-6 border-t border-black/5">
          <div className="bg-[#F5F5F4] p-4 rounded-2xl mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider opacity-50">Q Score</span>
              <ShieldCheck size={16} className="text-emerald-500" />
            </div>
            <div className="text-2xl font-bold">{user?.q_score || 0}</div>
            <div className="w-full bg-black/5 h-1.5 rounded-full mt-2 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${user?.q_score || 0}%` }}
                className="bg-black h-full"
              />
            </div>
          </div>
          <button onClick={() => setIsLoggedOut(true)} className="flex items-center gap-3 w-full p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors">
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </nav>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 w-full bg-white border-bottom border-black/5 p-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-2">
          <Logo className="w-8 h-8" />
          <span className="font-bold">jointheq</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsLoggedOut(true)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">
            <LogOut size={20} />
          </button>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden fixed top-16 left-0 w-full bg-white border-b border-black/5 p-4 z-40 space-y-2"
          >
            <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} />
            <NavItem icon={<ShoppingBag size={20} />} label="Marketplace" active={activeTab === 'marketplace'} onClick={() => { setActiveTab('marketplace'); setIsMobileMenuOpen(false); }} />
            <NavItem icon={<Sparkles size={20} />} label="Campaigns" active={activeTab === 'campaigns'} onClick={() => { setActiveTab('campaigns'); setIsMobileMenuOpen(false); }} />
            <NavItem icon={<Wallet size={20} />} label="Wallet" active={activeTab === 'wallet'} onClick={() => { setActiveTab('wallet'); setIsMobileMenuOpen(false); }} />
            <NavItem icon={<Users size={20} />} label="Referrals" active={activeTab === 'referrals'} onClick={() => { setActiveTab('referrals'); setIsMobileMenuOpen(false); }} />
            <NavItem icon={<MessageCircle size={20} />} label="Support" active={activeTab === 'support'} onClick={() => { setActiveTab('support'); setIsMobileMenuOpen(false); }} />
            {user?.is_admin ? (
              <NavItem icon={<Lock size={20} />} label="Admin" active={activeTab === 'admin'} onClick={() => { setActiveTab('admin'); setIsMobileMenuOpen(false); }} />
            ) : null}
            <NavItem icon={<UserIcon size={20} />} label="Profile" active={activeTab === 'profile'} onClick={() => { setActiveTab('profile'); setIsMobileMenuOpen(false); }} />
            <NavItem icon={<LogOut size={20} />} label="Logout" active={false} onClick={() => setIsLoggedOut(true)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="lg:ml-64 pt-20 lg:pt-0 min-h-screen overflow-x-hidden">
        <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.full_name || 'User'}</h1>
                  <p className="text-black/50 mt-1">Here's what's happening with your subscriptions.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                      <Wallet size={20} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider opacity-50">Coins</div>
                      <div className="text-xl font-bold">₦{user?.wallet_balance?.toLocaleString() || 0}</div>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider opacity-50">Boots</div>
                      <div className="text-xl font-bold">{user?.boot_balance?.toLocaleString() || 0}</div>
                    </div>
                  </div>
                </div>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                  title="Active Slots" 
                  value={activeSlots.length.toString()} 
                  icon={<Zap size={20} />} 
                  color="bg-blue-500"
                />
                <StatCard 
                  title="Monthly Spend" 
                  value={`₦${activeSlots.reduce((acc, s) => acc + s.price, 0).toLocaleString()}`} 
                  icon={<TrendingUp size={20} />} 
                  color="bg-purple-500"
                />
                <StatCard 
                  title="Q Rank" 
                  value={getRank(user?.q_score || 0)} 
                  icon={<ShieldCheck size={20} />} 
                  color="bg-emerald-500"
                />
              </div>

              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Your Active Slots</h2>
                  <button onClick={() => setActiveTab('marketplace')} className="text-sm font-semibold text-black/50 hover:text-black flex items-center gap-1">
                    Browse More <ChevronRight size={16} />
                  </button>
                </div>
                
                {activeSlots.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeSlots.map((slot) => (
                      <ActiveSlotCard 
                        key={slot.id} 
                        slot={slot} 
                        onUpdateAllocation={(val) => updateAllocation(slot.id, val)} 
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white border border-dashed border-black/20 rounded-3xl p-12 text-center">
                    <div className="w-16 h-16 bg-[#F5F5F4] rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShoppingBag size={24} className="opacity-20" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">No active subscriptions</h3>
                    <p className="text-black/50 mb-6 max-w-xs mx-auto">Join a subscription slot to start saving on your favorite premium services.</p>
                    <button 
                      onClick={() => setActiveTab('marketplace')}
                      className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform"
                    >
                      Explore Marketplace
                    </button>
                  </div>
                )}
              </section>
            </motion.div>
          )}

          {activeTab === 'marketplace' && (
            <motion.div 
              key="marketplace"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Marketplace</h1>
                  <p className="text-xs sm:text-sm text-black/50 mt-1">Find the perfect slot for your favorite subscriptions.</p>
                </div>
                <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-black/5 shadow-sm overflow-x-auto no-scrollbar">
                  <button 
                    onClick={() => setUseBootsForPayment(false)}
                    className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${!useBootsForPayment ? 'bg-black text-white shadow-md' : 'text-black/50 hover:bg-black/5'}`}
                  >
                    100% Coins
                  </button>
                  <button 
                    onClick={() => setUseBootsForPayment(true)}
                    className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${useBootsForPayment ? 'bg-black text-white shadow-md' : 'text-black/50 hover:bg-black/5'}`}
                  >
                    50/50 Split
                  </button>
                </div>
              </header>

              <div className="grid grid-cols-1 gap-10">
                {subscriptions.map((sub) => (
                  <section key={sub.id}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-white border border-black/5 rounded-2xl flex items-center justify-center shadow-sm">
                        <span className="font-bold text-lg">{sub.name[0]}</span>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">{sub.name}</h2>
                        <p className="text-sm text-black/50">{sub.description}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {sub.slot_types.map((slot) => (
                        <MarketplaceSlotCard 
                          key={slot.id} 
                          slot={slot} 
                          onJoin={() => joinSlot(slot.id)}
                          userQScore={user?.q_score || 0}
                          useBoots={useBootsForPayment}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'campaigns' && (
            <motion.div 
              key="campaigns"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <header>
                <h1 className="text-3xl font-bold tracking-tight">Active Campaigns</h1>
                <p className="text-black/50 mt-1">Earn Boots by participating in time-limited events.</p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="bg-white border border-black/5 rounded-[2.5rem] overflow-hidden shadow-sm">
                    <div className="bg-gradient-to-br from-pink-500 to-rose-500 p-6 sm:p-10 text-white relative overflow-hidden">
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest">
                            Live Campaign
                          </div>
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-bold mb-2">{campaign.name}</h2>
                        <p className="text-white/80 max-w-sm text-xs sm:text-sm">{campaign.description}</p>
                      </div>
                    </div>
                    <div className="p-8 space-y-8">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-[#F5F5F4] rounded-2xl">
                          <div className="text-xs font-semibold uppercase opacity-50 mb-1">Reward</div>
                          <div className="text-xl font-bold">100 Boots</div>
                        </div>
                        <div className="p-4 bg-[#F5F5F4] rounded-2xl">
                          <div className="text-xs font-semibold uppercase opacity-50 mb-1">Qualified</div>
                          <div className="text-xl font-bold">3 Referrals</div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-bold">Easter Jar Progress</span>
                          <span className="text-sm font-bold">2 / 3</span>
                        </div>
                        <div className="relative h-48 w-full bg-[#F5F5F4] rounded-3xl overflow-hidden border-4 border-white shadow-inner">
                          {/* Visual Jar Representation */}
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: '66%' }}
                            className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-rose-400 to-pink-300"
                          >
                            <div className="absolute top-0 left-0 w-full h-4 bg-white/20" />
                          </motion.div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Trophy size={48} className="text-black/5" />
                          </div>
                        </div>
                        <p className="text-xs text-center text-black/40 italic">Invite 1 more qualified friend to unlock 200 Boots!</p>
                      </div>

                      <button className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:scale-[1.02] transition-all">
                        Invite Friends
                      </button>
                    </div>
                  </div>
                ))}

                <div className="bg-white border border-black/5 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center">
                    <TrendingUp size={40} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Behavior Rewards</h3>
                    <p className="text-black/50 mt-2">Earn Boots automatically for being a great Q member.</p>
                  </div>
                  <div className="w-full space-y-3 text-left">
                    <div className="p-4 bg-[#F5F5F4] rounded-2xl flex items-center justify-between">
                      <span className="text-sm font-medium">3 On-time Renewals</span>
                      <span className="font-bold text-emerald-600">+50 Boots</span>
                    </div>
                    <div className="p-4 bg-[#F5F5F4] rounded-2xl flex items-center justify-between">
                      <span className="text-sm font-medium">Reach Elite Rank</span>
                      <span className="font-bold text-emerald-600">+200 Boots</span>
                    </div>
                    <div className="p-4 bg-[#F5F5F4] rounded-2xl flex items-center justify-between">
                      <span className="text-sm font-medium">Early Payment</span>
                      <span className="font-bold text-emerald-600">+20 Boots</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          {activeTab === 'wallet' && (
            <motion.div 
              key="wallet"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <header>
                <h1 className="text-3xl font-bold tracking-tight">Wallet</h1>
                <p className="text-black/50 mt-1">Manage your coins and funding methods.</p>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-black text-white p-8 rounded-[2.5rem] relative overflow-hidden">
                    <div className="relative z-10">
                      <div className="text-white/60 text-sm font-medium mb-1">Coin Balance</div>
                      <div className="text-4xl font-bold mb-8">₦{user?.wallet_balance?.toLocaleString() || 0}</div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-mono tracking-widest opacity-50">Q-WALLET-8821</div>
                        <Wallet size={24} className="opacity-50" />
                      </div>
                    </div>
                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                  </div>

                  <div className="bg-blue-600 text-white p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] relative overflow-hidden">
                    <div className="relative z-10">
                      <div className="text-white/60 text-xs sm:text-sm font-medium mb-1">Boot Balance</div>
                      <div className="text-2xl sm:text-4xl font-bold mb-8">{user?.boot_balance?.toLocaleString() || 0} Boots</div>
                      <div className="flex items-center justify-between">
                        <div className="text-[10px] sm:text-xs font-mono tracking-widest opacity-50">Q-REWARDS-9942</div>
                      </div>
                    </div>
                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                  </div>

                  <div className="bg-white border border-black/5 p-6 rounded-3xl space-y-4">
                    <h3 className="font-bold">Fund Wallet</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[1000, 2500, 5000, 10000].map((amount) => (
                        <button 
                          key={amount}
                          onClick={() => fundWallet(amount)}
                          className="p-4 border border-black/5 rounded-2xl hover:bg-black hover:text-white transition-all font-bold"
                        >
                          +₦{amount.toLocaleString()}
                        </button>
                      ))}
                    </div>
                    <button className="w-full p-4 bg-[#F5F5F4] rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black/5 transition-colors">
                      <Plus size={20} /> Custom Amount
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-8">
                  <div className="bg-white border border-black/5 rounded-3xl overflow-hidden">
                    <div className="p-6 border-b border-black/5 flex items-center justify-between">
                      <h3 className="font-bold">Coin History</h3>
                      <button className="text-sm font-semibold text-black/50">View All</button>
                    </div>
                    <div className="divide-y divide-black/5">
                      <TransactionItem 
                        title="Wallet Funding" 
                        date="Today, 10:45 AM" 
                        amount={2500} 
                        type="funding" 
                      />
                      <TransactionItem 
                        title="Netflix Profile Slot" 
                        date="Yesterday, 2:15 PM" 
                        amount={-2500} 
                        type="payment" 
                      />
                    </div>
                  </div>

                  <div className="bg-white border border-black/5 rounded-3xl overflow-hidden">
                    <div className="p-6 border-b border-black/5 flex items-center justify-between">
                      <h3 className="font-bold">Boot History</h3>
                      <button className="text-sm font-semibold text-black/50">View All</button>
                    </div>
                    <div className="divide-y divide-black/5">
                      <TransactionItem 
                        title="Easter Jar Reward" 
                        date="Today, 11:30 AM" 
                        amount={100} 
                        type="funding" 
                        isBoot={true}
                      />
                      <TransactionItem 
                        title="On-time Renewal Reward" 
                        date="Feb 22, 2026" 
                        amount={50} 
                        type="funding" 
                        isBoot={true}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'referrals' && (
            <motion.div 
              key="referrals"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <header>
                <h1 className="text-3xl font-bold tracking-tight">Referrals</h1>
                <p className="text-black/50 mt-1">Invite friends and earn rewards.</p>
              </header>

              <div className="bg-white border border-black/5 p-10 rounded-[2.5rem] text-center max-w-2xl mx-auto">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Gift size={40} />
                </div>
                <h2 className="text-2xl font-bold mb-2">Share the Q Experience</h2>
                <p className="text-black/50 mb-8">Get 500 Coins for every friend who joins their first slot. Your friends get 200 Coins to start!</p>
                
                <div className="bg-[#F5F5F4] p-4 rounded-2xl flex items-center justify-between mb-8">
                  <code className="font-mono font-bold text-lg">{user?.referral_code || 'Q-USER-123'}</code>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(user?.referral_code || '');
                      alert("Copied to clipboard!");
                    }}
                    className="bg-black text-white px-4 py-2 rounded-xl text-sm font-bold"
                  >
                    Copy Link
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-[#F5F5F4] rounded-2xl">
                    <div className="text-2xl font-bold">12</div>
                    <div className="text-xs font-semibold uppercase opacity-50">Invites</div>
                  </div>
                  <div className="p-4 bg-[#F5F5F4] rounded-2xl">
                    <div className="text-2xl font-bold">8</div>
                    <div className="text-xs font-semibold uppercase opacity-50">Active</div>
                  </div>
                  <div className="p-4 bg-[#F5F5F4] rounded-2xl">
                    <div className="text-2xl font-bold">₦4,000</div>
                    <div className="text-xs font-semibold uppercase opacity-50">Earned</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'admin' && user?.is_admin && (
            <motion.div 
              key="admin"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <header>
                <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                <p className="text-black/50 mt-1">Manage platform data.</p>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              </div>
            </motion.div>
          )}
          {activeTab === 'support' && (
            <motion.div 
              key="support"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-[calc(100vh-120px)] flex flex-col"
            >
              <header className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{user?.is_admin ? 'Admin Support Center' : 'Support Chat'}</h1>
                <p className="text-xs sm:text-sm text-black/50 mt-1">
                  {user?.is_admin ? 'Manage user inquiries and provide assistance.' : 'Talk to our team in real-time. We\'re here to help!'}
                </p>
              </header>

              <div className="flex-1 flex gap-4 sm:gap-6 overflow-hidden relative">
                {user?.is_admin && (
                  <div className={`${selectedChatUserId ? 'hidden md:flex' : 'flex'} w-full md:w-64 bg-white border border-black/5 rounded-[2rem] sm:rounded-[2.5rem] flex-col overflow-hidden shadow-sm`}>
                    <div className="p-4 border-b border-black/5 font-bold text-xs sm:text-sm uppercase tracking-wider opacity-50 flex justify-between items-center">
                      <span>Active Users</span>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {chatUsers.map(u => (
                        <button 
                          key={u.id}
                          onClick={() => setSelectedChatUserId(u.id)}
                          className={`w-full p-4 text-left hover:bg-black/5 transition-colors border-b border-black/5 ${selectedChatUserId === u.id ? 'bg-black/5 border-l-4 border-l-black' : ''}`}
                        >
                          <div className="font-bold text-sm">{u.full_name}</div>
                          <div className="text-[10px] opacity-50 truncate">{u.email}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className={`${user?.is_admin && !selectedChatUserId ? 'hidden md:flex' : 'flex'} flex-1 bg-white border border-black/5 rounded-[2rem] sm:rounded-[2.5rem] flex flex-col overflow-hidden shadow-sm relative`}>
                  {user?.is_admin && selectedChatUserId && (
                    <button 
                      onClick={() => setSelectedChatUserId(null)}
                      className="md:hidden absolute top-4 left-4 z-10 p-2 bg-black/5 rounded-full"
                    >
                      <ChevronRight className="rotate-180" size={16} />
                    </button>
                  )}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                    {(!user?.is_admin || selectedChatUserId) ? (
                      <>
                        {messages.filter(m => !user?.is_admin || m.sender_id === selectedChatUserId || m.receiver_id === selectedChatUserId).length === 0 && (
                          <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                            <MessageCircle size={48} className="mb-4" />
                            <p className="font-bold text-lg">No messages yet</p>
                            <p className="text-sm">Start a conversation.</p>
                          </div>
                        )}
                        {messages.filter(m => !user?.is_admin || m.sender_id === selectedChatUserId || m.receiver_id === selectedChatUserId).map((msg) => (
                          <div 
                            key={msg.id} 
                            className={`flex ${msg.is_from_admin === (user?.is_admin ? true : false) ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[85%] sm:max-w-[80%] rounded-2xl sm:rounded-3xl p-3 sm:p-4 ${
                              msg.is_from_admin === (user?.is_admin ? true : false)
                                ? 'bg-black text-white rounded-tr-none' 
                                : 'bg-[#F5F5F4] text-black rounded-tl-none'
                            }`}>
                              {msg.image_data && (
                                <img src={msg.image_data} alt="Uploaded" className="rounded-xl sm:rounded-2xl mb-2 max-w-full h-auto" />
                              )}
                              <p className="text-xs sm:text-sm leading-relaxed">{msg.content}</p>
                              <div className={`text-[9px] sm:text-[10px] mt-1 opacity-50 ${msg.is_from_admin === (user?.is_admin ? true : false) ? 'text-right' : 'text-left'}`}>
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                        <Users size={48} className="mb-4" />
                        <p className="font-bold text-lg">Select a user</p>
                        <p className="text-sm">Choose a user from the list to start chatting.</p>
                      </div>
                    )}
                  </div>

                  {(!user?.is_admin || selectedChatUserId) && (
                    <div className="p-3 sm:p-4 bg-[#F5F5F4] border-t border-black/5">
                      {chatImage && (
                        <div className="mb-3 sm:mb-4 relative inline-block">
                          <img src={chatImage} alt="Preview" className="h-16 w-16 sm:h-20 sm:w-20 object-cover rounded-xl border-2 border-white shadow-sm" />
                          <button 
                            onClick={() => setChatImage(null)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <label className="p-2.5 sm:p-3 bg-white rounded-xl sm:rounded-2xl cursor-pointer hover:bg-black/5 transition-colors shadow-sm">
                          <ImageIcon size={18} className="text-black/50 sm:w-5 sm:h-5" />
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </label>
                        <input 
                          type="text" 
                          placeholder="Type your message..." 
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                          className="flex-1 p-3 sm:p-4 bg-white rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/5 text-sm"
                        />
                        <button 
                          onClick={sendMessage}
                          disabled={!chatInput && !chatImage}
                          className="p-3 sm:p-4 bg-black text-white rounded-xl sm:rounded-2xl hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-md"
                        >
                          <Send size={18} className="sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
          {activeTab === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <header>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">User Profile</h1>
                <p className="text-xs sm:text-sm text-black/50 mt-1">Manage your personal information and security.</p>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white border border-black/5 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] text-center shadow-sm">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden border-4 border-white shadow-sm">
                      <UserIcon size={40} className="sm:w-12 sm:h-12" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold">{user?.full_name}</h2>
                    <p className="text-xs sm:text-sm text-black/50">{user?.email}</p>
                    <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-emerald-100 text-emerald-600 rounded-full text-xs font-bold">
                      <ShieldCheck size={14} className="sm:w-4 sm:h-4" />
                      {getRank(user?.q_score || 0)} Member
                    </div>
                  </div>

                  <div className="bg-white border border-black/5 p-6 rounded-3xl space-y-4 shadow-sm">
                    <h3 className="font-bold flex items-center gap-2">
                      <Tv size={18} className="text-purple-500" />
                      Your Devices
                    </h3>
                    <div className="space-y-3">
                      {devices.map(device => (
                        <div key={device.id} className="flex items-center justify-between p-3 bg-[#F5F5F4] rounded-2xl">
                          <div className="flex items-center gap-3">
                            {device.type === 'TV' && <Tv size={16} />}
                            {device.type === 'Phone' && <Smartphone size={16} />}
                            {device.type === 'Laptop' && <Laptop size={16} />}
                            {device.type === 'Desktop' && <Monitor size={16} />}
                            <div>
                              <div className="text-sm font-bold">{device.name}</div>
                              <div className="text-[10px] opacity-50 uppercase">{device.type}</div>
                            </div>
                          </div>
                          <button onClick={() => deleteDevice(device.id)} className="text-red-500 p-1 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      
                      <div className="pt-2 space-y-2">
                        <input 
                          type="text" 
                          placeholder="Device Name (e.g. Living Room TV)" 
                          value={newDeviceName}
                          onChange={(e) => setNewDeviceName(e.target.value)}
                          className="w-full p-3 bg-[#F5F5F4] rounded-xl text-sm focus:outline-none"
                        />
                        <div className="flex gap-2">
                          <select 
                            value={newDeviceType}
                            onChange={(e) => setNewDeviceType(e.target.value)}
                            className="flex-1 p-3 bg-[#F5F5F4] rounded-xl text-sm focus:outline-none"
                          >
                            <option value="Phone">Phone</option>
                            <option value="TV">TV</option>
                            <option value="Laptop">Laptop</option>
                            <option value="Desktop">Desktop</option>
                          </select>
                          <button 
                            onClick={addDevice}
                            className="bg-black text-white px-4 rounded-xl font-bold text-sm"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-8">
                  <div className="bg-white border border-black/5 p-8 rounded-[2.5rem] shadow-sm">
                    <h3 className="text-xl font-bold mb-6">Contact Information</h3>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider opacity-50 mb-2">Email Address</label>
                        <div className="p-4 bg-[#F5F5F4] rounded-2xl font-medium text-black/70">
                          {user?.email}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider opacity-50 mb-2">Phone Number</label>
                        <div className="flex flex-col md:flex-row gap-3">
                          <input 
                            type="tel" 
                            placeholder={user?.phone || "Enter phone number"}
                            value={newPhone}
                            onChange={(e) => setNewPhone(e.target.value)}
                            className="flex-1 p-4 bg-[#F5F5F4] rounded-2xl font-medium focus:outline-none focus:ring-2 focus:ring-black/5"
                          />
                          <button 
                            onClick={updatePhone}
                            disabled={isUpdatingPhone || !newPhone}
                            className="px-8 py-4 bg-black text-white rounded-2xl font-bold hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isUpdatingPhone ? 'Updating...' : 'Update Phone'}
                          </button>
                        </div>
                        {user?.phone && (
                          <p className="mt-2 text-xs text-black/40 italic">Current: {user.phone}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-black/5 p-8 rounded-[2.5rem] shadow-sm">
                    <h3 className="text-xl font-bold mb-6">Account Security</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border border-black/5 rounded-2xl">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                            <ShieldCheck size={20} />
                          </div>
                          <div>
                            <div className="font-bold">Two-Factor Authentication</div>
                            <div className="text-xs text-black/50">Secure your account with 2FA</div>
                          </div>
                        </div>
                        <button className="text-sm font-bold text-blue-600">Enable</button>
                      </div>
                      <div className="flex items-center justify-between p-4 border border-black/5 rounded-2xl opacity-50">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                            <Clock size={20} />
                          </div>
                          <div>
                            <div className="font-bold">Login History</div>
                            <div className="text-xs text-black/50">View your recent login activity</div>
                          </div>
                        </div>
                        <button className="text-sm font-bold">View</button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-red-100 p-8 rounded-[2.5rem] shadow-sm">
                    <h3 className="text-xl font-bold mb-6 text-red-600">Danger Zone</h3>
                    <div className="space-y-4">
                      <p className="text-sm text-black/60 mb-4">
                        Logging out will end your current session. You will need to log in again to access your dashboard.
                      </p>
                      <button 
                        onClick={() => setIsLoggedOut(true)}
                        className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <LogOut size={20} />
                        Log Out
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all ${
        active 
          ? 'bg-black text-white shadow-lg shadow-black/10' 
          : 'text-black/50 hover:bg-black/5 hover:text-black'
      }`}
    >
      {icon}
      <span className="font-semibold">{label}</span>
    </button>
  );
}

function StatCard({ title, value, icon, color }: { title: string, value: string, icon: React.ReactNode, color: string }) {
  return (
    <div className="bg-white border border-black/5 p-6 rounded-3xl shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 ${color} text-white rounded-xl flex items-center justify-center`}>
          {icon}
        </div>
        <ArrowUpRight size={16} className="text-black/20" />
      </div>
      <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider opacity-50 mb-1">{title}</div>
      <div className="text-xl sm:text-2xl font-bold">{value}</div>
    </div>
  );
}

interface ActiveSlotCardProps {
  slot: UserSlot;
  onUpdateAllocation: (val: string) => void | Promise<void>;
  key?: React.Key;
}

function ActiveSlotCard({ slot, onUpdateAllocation }: ActiveSlotCardProps) {
  const daysLeft = Math.ceil((new Date(slot.renewal_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const [isEditing, setIsEditing] = useState(false);
  const [allocation, setAllocation] = useState(slot.allocation || '');
  
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white border border-black/5 p-6 rounded-3xl shadow-sm"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="w-12 h-12 bg-[#F5F5F4] rounded-2xl flex items-center justify-center font-bold">
          {slot.sub_name[0]}
        </div>
        <div className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-xs font-bold uppercase tracking-wider">
          Active
        </div>
      </div>
      <h3 className="font-bold text-lg mb-1">{slot.sub_name}</h3>
      <p className="text-sm text-black/50 mb-4">{slot.slot_name}</p>
      
      <div className="mb-6">
        <div className="text-[10px] font-bold uppercase opacity-30 mb-1">Your Allocation</div>
        {isEditing ? (
          <div className="flex gap-2">
            <input 
              type="text" 
              value={allocation}
              onChange={(e) => setAllocation(e.target.value)}
              placeholder="e.g. Profile 1"
              className="flex-1 p-2 bg-[#F5F5F4] rounded-lg text-xs focus:outline-none"
            />
            <button 
              onClick={() => {
                onUpdateAllocation(allocation);
                setIsEditing(false);
              }}
              className="bg-black text-white px-3 py-1 rounded-lg text-xs font-bold"
            >
              Save
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-2 bg-[#F5F5F4] rounded-lg">
            <span className="text-xs font-medium">{slot.allocation || 'Not set'}</span>
            <button onClick={() => setIsEditing(true)} className="text-[10px] font-bold text-blue-600">Edit</button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-black/50 flex items-center gap-1"><Clock size={14} /> Renewal in</span>
          <span className="font-bold">{daysLeft} days</span>
        </div>
        <div className="w-full bg-[#F5F5F4] h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-black h-full" 
            style={{ width: `${(daysLeft / 30) * 100}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
}

function MarketplaceSlotCard({ slot, onJoin, userQScore, useBoots }: { slot: any, onJoin: () => void | Promise<void>, userQScore: number, useBoots: boolean, key?: React.Key }) {
  const isEligible = userQScore >= slot.min_q_score;

  return (
    <div className="bg-white border border-black/5 p-4 sm:p-6 rounded-3xl shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-base sm:text-lg">{slot.name}</h3>
        <div className="text-right">
          {useBoots ? (
            <>
              <div className="text-lg font-bold">₦{(slot.price / 2).toLocaleString()} <span className="text-[10px] opacity-40">Coins</span></div>
              <div className="text-sm font-bold text-rose-500">+ {(slot.price / 2).toLocaleString()} <span className="text-[10px] opacity-60">Boots</span></div>
            </>
          ) : (
            <div className="text-xl font-bold">₦{slot.price.toLocaleString()}</div>
          )}
        </div>
      </div>
      
      <div className="space-y-3 mb-8 flex-1">
        <div className="flex items-center gap-2 text-sm text-black/60">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>{slot.device_limit} Devices</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-black/60">
          <Zap size={14} className="text-blue-500" />
          <span>{slot.downloads_enabled ? 'Downloads Enabled' : 'Streaming Only'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-black/60">
          <TrendingUp size={14} className="text-purple-500" />
          <span>Min Q Score: {slot.min_q_score}</span>
        </div>
      </div>

      <button 
        onClick={onJoin}
        disabled={!isEligible}
        className={`w-full py-4 rounded-2xl font-bold transition-all ${
          isEligible 
            ? 'bg-black text-white hover:scale-[1.02]' 
            : 'bg-black/5 text-black/30 cursor-not-allowed'
        }`}
      >
        {isEligible ? 'Join Slot' : `Requires ${slot.min_q_score} Q Score`}
      </button>
    </div>
  );
}

function TransactionItem({ title, date, amount, type, isBoot }: { title: string, date: string, amount: number, type: 'funding' | 'payment', isBoot?: boolean }) {
  return (
    <div className="p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          type === 'funding' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
        }`}>
          {type === 'funding' ? <Plus size={20} /> : <ShoppingBag size={20} />}
        </div>
        <div>
          <div className="font-bold">{title}</div>
          <div className="text-xs text-black/50">{date}</div>
        </div>
      </div>
      <div className={`font-bold ${type === 'funding' ? 'text-emerald-600' : 'text-black'}`}>
        {amount > 0 ? '+' : ''}{isBoot ? '' : '₦'}{amount.toLocaleString()}{isBoot ? ' Boots' : ''}
      </div>
    </div>
  );
}

function MetricBar({ label, value }: { label: string, value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs font-semibold mb-1">
        <span className="opacity-50 uppercase tracking-wider">{label}</span>
        <span>{value}%</span>
      </div>
      <div className="w-full bg-black/5 h-1.5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          className="bg-black h-full"
        />
      </div>
    </div>
  );
}

function getRank(score: number) {
  if (score >= 85) return 'Elite';
  if (score >= 70) return 'Priority';
  if (score >= 50) return 'Standard';
  return 'Risk';
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainApp />} />
      <Route path="/console" element={<ConsoleLogin />} />
      <Route path="/console/dashboard" element={<ConsoleDashboard />} />
    </Routes>
  );
}
