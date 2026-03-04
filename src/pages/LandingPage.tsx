import { useState, useRef, useEffect, ChangeEvent, FormEvent } from "react";
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ShieldCheck, Users, Zap, CheckCircle2, Mail, Lock, User as UserIcon, Phone, XCircle, Hash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { auth } from "../lib/auth";
import { Logo } from '../components/ui/Logo';
import { FloatingQ } from '../components/FloatingQ';

export default function LandingPage() {
  const [activeSection, setActiveSection] = useState<'hero' | 'about' | 'login' | 'signup'>('hero');
  const navigate = useNavigate();
  const pressTimer = useRef<NodeJS.Timeout | null>(null);

  const handlePressStart = () => {
    pressTimer.current = setTimeout(() => {
      navigate('/console');
    }, 2000);
  };

  const handlePressEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
    }
  };

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const createUser = useMutation(api.users.createUser);
  const sendEmail = useAction(api.actions.sendVerificationEmail);
  const verifyUser = useMutation(api.users.verifyUser);
  const login = useMutation(api.users.login);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    password: ''
  });

  const user = useQuery(api.users.getByEmail, formData.email ? { email: formData.email } : "skip");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const referralFromUrl = params.get('ref');

    if (referralFromUrl && !localStorage.getItem('referred_by')) {
      localStorage.setItem('referred_by', referralFromUrl);
    }

    if (params.get('verified') === 'true' || token) {
      if (token) {
        setIsLoading(true);
        verifyUser({ token })
          .then(() => {
            setSuccess('Account verified successfully! You can now log in.');
            setActiveSection('login');
          })
          .catch(err => setError(err.message))
          .finally(() => setIsLoading(false));
      } else {
        setSuccess('Account verified successfully! You can now log in.');
        setActiveSection('login');
      }
      // Clear URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [verifyUser]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const referralCode = `Q-${formData.name.split(' ')[0].toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

      await createUser({
        email: formData.email,
        full_name: formData.name,
        username: formData.username,
        phone: formData.phone,
        password_hash: formData.password,
        verification_token: token,
        verification_token_expires: expires,
        referral_code: referralCode,
        referred_by_code: localStorage.getItem('referred_by') || undefined
      });

      await sendEmail({
        email: formData.email,
        name: formData.name,
        token,
        baseUrl: window.location.origin
      });

      setSuccess('Account created! Please check your email to verify.');
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await login({
        email: formData.email,
        password: formData.password
      });

      if (result.success && result.user) {
        auth.login(result.user as any);

        // If not verified, store verification info for Dashboard to show warning
        if (!result.isVerified && result.daysRemaining !== null) {
          localStorage.setItem('verification_days_remaining', String(result.daysRemaining));
          localStorage.setItem('verification_deadline', String(result.verificationDeadline));
        }

        navigate("/dashboard");
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err: any) {
      setError(err.message || 'Login error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#1A1A1A] font-sans overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-md border-b border-black/5 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 cursor-pointer" onClick={() => setActiveSection('hero')}>
            <Logo className="w-8 h-8 sm:w-10 sm:h-10" />
            <span className="text-lg sm:text-xl font-bold tracking-tight">jointheq</span>
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <button
              onClick={() => setActiveSection('about')}
              className={`text-sm sm:text-base font-semibold transition-colors whitespace-nowrap ${activeSection === 'about' ? 'text-black' : 'text-black/50 hover:text-black'}`}
            >
              About Us
            </button>
            <button
              onClick={() => setActiveSection('login')}
              className="px-4 py-2 sm:px-6 sm:py-2.5 bg-black text-white rounded-xl font-bold text-sm sm:text-base hover:scale-105 transition-transform shadow-lg shadow-black/10 whitespace-nowrap"
            >
              Log In
            </button>
          </div>
        </div>
      </nav>

      <main className="pt-32 sm:pt-40 pb-20">
        <AnimatePresence mode="wait">
          {activeSection === 'hero' && (
            <motion.div
              key="hero"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="max-w-7xl mx-auto px-6"
            >
              <div className="grid lg:grid-cols-2 gap-16 items-center min-h-[calc(100vh-12rem)] relative">
                <div className="space-y-8 relative z-10">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold uppercase tracking-wide"
                  >
                    <ShieldCheck size={16} />
                    <span>Safe & Compliant</span>
                  </motion.div>

                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="text-5xl lg:text-7xl font-bold tracking-tight leading-[1.1]"
                  >
                    Split the bill. <br />
                    <span className="text-black/40">Stay premium.</span> <br />
                    Spend less.
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="text-lg text-black/60 max-w-lg leading-relaxed"
                  >
                    Join verified family-plan slots and reduce the cost of your favorite digital services without breaking platform rules.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="flex flex-col sm:flex-row gap-4 pt-4"
                  >
                    <button
                      onClick={() => setActiveSection('signup')}
                      className="px-8 py-4 bg-black text-white rounded-2xl font-bold text-lg hover:scale-[1.02] transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-2 group"
                    >
                      Try 7 Days Free
                      <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    className="flex items-center gap-6 pt-8 border-t border-black/5"
                  >
                    <div className="flex -space-x-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="w-10 h-10 rounded-full border-2 border-[#F5F5F4] bg-gray-200 overflow-hidden">
                          <img src={`https://picsum.photos/seed/${i}/100/100`} alt="User" referrerPolicy="no-referrer" />
                        </div>
                      ))}
                    </div>
                    <div className="text-sm font-medium text-black/60">
                      Trusted by <span className="text-black font-bold">10,000+</span> smart savers
                    </div>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.7 }}
                >
                  <div className="relative">
                    <div className="absolute inset-x-0 -top-20 -bottom-20 bg-gradient-to-b from-[#F26522]/5 to-transparent blur-3xl -z-10" />
                    <div className="bg-white p-8 rounded-[3rem] shadow-2xl shadow-black/5 border border-black/5 backdrop-blur-sm bg-white/80">
                      <div className="flex items-center justify-between mb-8">
                        <div className="font-bold text-xl">Active Slots</div>
                        <div className="w-10 h-10 bg-black/5 rounded-full flex items-center justify-center">
                          <Users size={20} />
                        </div>
                      </div>

                      <div className="space-y-4">
                        {[
                          { name: 'Netflix Premium', price: '₦1,500', color: 'bg-red-500', users: 3, max: 4 },
                          { name: 'Spotify Duo', price: '₦800', color: 'bg-emerald-500', users: 1, max: 2 },
                          { name: 'YouTube Premium', price: '₦1,200', color: 'bg-red-600', users: 4, max: 5 }
                        ].map((slot, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 + (i * 0.1) }}
                            className="p-4 rounded-2xl border border-black/5 hover:border-black/10 transition-colors flex items-center justify-between"
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 ${slot.color} rounded-xl flex items-center justify-center text-white font-bold text-lg`}>
                                {slot.name[0]}
                              </div>
                              <div>
                                <div className="font-bold">{slot.name}</div>
                                <div className="text-sm text-black/50">{slot.users}/{slot.max} Members</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">{slot.price}</div>
                              <div className="text-[10px] uppercase tracking-wider opacity-50 font-bold">/ month</div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {activeSection === 'about' && (
            <motion.div
              key="about"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="max-w-6xl mx-auto px-4 sm:px-6 space-y-32 pb-32"
            >
              {/* Hero Section */}
              <div className="pt-12 md:pt-24 grid md:grid-cols-2 gap-12 items-center relative">

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="relative z-10"
                >
                  <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[0.9] mb-8">
                    Why Q <br />
                    <span className="text-black/30">Exists.</span>
                  </h1>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl md:text-2xl font-medium text-black/70 leading-relaxed space-y-6 border-l-2 border-black/10 pl-8"
                >
                  <p className="text-black">Premium tools became essential.</p>
                  <p>Paying solo became expensive.</p>
                  <p>People already shared subscriptions.</p>
                  <div className="pt-4">
                    <p className="text-sm font-bold tracking-widest uppercase text-black/40 mb-4">But it was:</p>
                    <div className="flex flex-wrap gap-3 text-sm font-bold">
                      <span className="px-4 py-2 bg-red-50 text-red-600 rounded-full">Unstructured</span>
                      <span className="px-4 py-2 bg-red-50 text-red-600 rounded-full">Unreliable</span>
                      <span className="px-4 py-2 bg-red-50 text-red-600 rounded-full">Risky</span>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Core Philosophy */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-black text-white p-10 md:p-20 rounded-[3rem] shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10">
                  <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-16 leading-tight tracking-tight">
                    Q didn't invent sharing.<br />
                    <span className="text-white/40">We structured it.</span>
                  </h2>
                  <div className="grid md:grid-cols-3 gap-8 md:gap-12 text-lg font-medium text-white/70 mb-16">
                    <div className="space-y-4">
                      <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center">
                        <ShieldCheck size={24} />
                      </div>
                      <p>Verified onboarding for every member.</p>
                    </div>
                    <div className="space-y-4">
                      <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center">
                        <Users size={24} />
                      </div>
                      <p>Strict adherence to official limits.</p>
                    </div>
                    <div className="space-y-4">
                      <div className="w-12 h-12 bg-orange-500/20 text-orange-400 rounded-2xl flex items-center justify-center">
                        <Zap size={24} />
                      </div>
                      <p>Transparent and automated cost sharing.</p>
                    </div>
                  </div>
                  <div className="pt-12 border-t border-white/10">
                    <p className="text-2xl md:text-4xl font-bold leading-tight">
                      Access should be affordable.<br />
                      <span className="text-white/50">And done properly.</span>
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* HOW IT WORKS */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="mb-16 md:flex justify-between items-end">
                  <div>
                    <span className="text-sm font-bold tracking-widest uppercase text-black/40 mb-4 block">How It Works</span>
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tight">Simple. Structured.<br />Secure.</h2>
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-6 md:gap-8">
                  <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-black/5 shadow-sm relative group hover:shadow-xl transition-all duration-500">
                    <div className="text-7xl font-black text-black/5 mb-8 group-hover:text-black/10 transition-colors tracking-tighter">01</div>
                    <h3 className="text-2xl font-bold mb-4">Enter the Circle</h3>
                    <p className="text-black/60 font-medium text-lg">Browse verified family-plan slots tailored to your needs.</p>
                  </div>
                  <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-black/5 shadow-sm relative group hover:shadow-xl transition-all duration-500 md:translate-y-8">
                    <div className="text-7xl font-black text-black/5 mb-8 group-hover:text-black/10 transition-colors tracking-tighter">02</div>
                    <h3 className="text-2xl font-bold mb-4">Lock Your Share</h3>
                    <p className="text-black/60 font-medium text-lg">Join the group and pay your assigned portion securely.</p>
                  </div>
                  <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-black/5 shadow-sm relative group hover:shadow-xl transition-all duration-500 md:translate-y-16">
                    <div className="text-7xl font-black text-black/5 mb-8 group-hover:text-black/10 transition-colors tracking-tighter">03</div>
                    <h3 className="text-2xl font-bold mb-4">Activate</h3>
                    <p className="text-black/60 font-medium text-lg">Once the circle is complete, your premium access begins.</p>
                  </div>
                </div>
              </motion.div>

              {/* WHY Q */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="grid lg:grid-cols-2 gap-16 items-center pt-16"
              >
                <div>
                  <h2 className="text-5xl md:text-7xl font-bold mb-8 leading-[1]">
                    Built for Structure.<br />
                    <span className="text-black/30">Not Shortcuts.</span>
                  </h2>
                  <p className="text-xl text-black/60 font-medium max-w-md">
                    We believe in doing things the right way. No shady workarounds, just smart organization.
                  </p>
                </div>
                <div className="space-y-6">
                  <div className="bg-red-50 p-8 md:p-10 rounded-[2.5rem] border border-red-100">
                    <h3 className="font-bold text-red-800 mb-6 flex items-center gap-3 text-2xl">
                      <XCircle size={28} /> We don't:
                    </h3>
                    <ul className="space-y-4 text-red-900/70 font-bold text-lg">
                      <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-red-400"></span> Resell subscriptions</li>
                      <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-red-400"></span> Overfill plans</li>
                      <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-red-400"></span> Bypass restrictions</li>
                    </ul>
                  </div>
                  <div className="bg-emerald-50 p-8 md:p-10 rounded-[2.5rem] border border-emerald-100">
                    <h3 className="font-bold text-emerald-800 mb-6 flex items-center gap-3 text-2xl">
                      <CheckCircle2 size={28} /> We do:
                    </h3>
                    <ul className="space-y-4 text-emerald-900/70 font-bold text-lg">
                      <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Verify users</li>
                      <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Respect official limits</li>
                      <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Replace inactive members</li>
                      <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Protect group stability</li>
                    </ul>
                  </div>
                </div>
              </motion.div>

              {/* WHO IT'S FOR */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-[#141414] text-white p-10 md:p-20 rounded-[3rem] text-center"
              >
                <span className="text-sm font-bold tracking-widest uppercase text-white/40 mb-8 block">If You've Ever Said</span>
                <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-20 italic text-white/90">
                  "Who wants to share this?"
                </h2>
                <div className="grid md:grid-cols-2 gap-8 text-left max-w-4xl mx-auto">
                  <div className="bg-white/5 p-8 rounded-3xl border border-white/10 flex items-start gap-6">
                    <span className="text-4xl">🎓</span>
                    <div>
                      <h4 className="font-bold text-xl mb-2">Students</h4>
                      <p className="text-white/60">Cutting monthly costs without losing access to essential tools.</p>
                    </div>
                  </div>
                  <div className="bg-white/5 p-8 rounded-3xl border border-white/10 flex items-start gap-6">
                    <span className="text-4xl">🎨</span>
                    <div>
                      <h4 className="font-bold text-xl mb-2">Creators</h4>
                      <p className="text-white/60">Using premium creative suites daily for their work.</p>
                    </div>
                  </div>
                  <div className="bg-white/5 p-8 rounded-3xl border border-white/10 flex items-start gap-6">
                    <span className="text-4xl">💼</span>
                    <div>
                      <h4 className="font-bold text-xl mb-2">Young Earners</h4>
                      <p className="text-white/60">Optimizing expenses while building their careers.</p>
                    </div>
                  </div>
                  <div className="bg-white/5 p-8 rounded-3xl border border-white/10 flex items-start gap-6">
                    <span className="text-4xl">🧠</span>
                    <div>
                      <h4 className="font-bold text-xl mb-2">Smart Savers</h4>
                      <p className="text-white/60">People who move intentionally with their finances.</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* FAQ */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="max-w-4xl mx-auto"
              >
                <div className="text-center mb-16">
                  <h2 className="text-4xl md:text-6xl font-bold tracking-tight">Remove Final Doubts</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                  <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-black/5 shadow-sm">
                    <h3 className="font-bold text-xl mb-4">Am I buying a subscription?</h3>
                    <p className="text-black/60 font-medium text-lg leading-relaxed">No. You secure a slot in a shared family plan that is managed collectively.</p>
                  </div>
                  <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-black/5 shadow-sm">
                    <h3 className="font-bold text-xl mb-4">Is this compliant?</h3>
                    <p className="text-black/60 font-medium text-lg leading-relaxed">Yes. All plans follow the official family limits set by the providers.</p>
                  </div>
                  <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-black/5 shadow-sm">
                    <h3 className="font-bold text-xl mb-4">What if someone stops paying?</h3>
                    <p className="text-black/60 font-medium text-lg leading-relaxed">Members are seamlessly replaced to maintain group stability and uninterrupted access.</p>
                  </div>
                  <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-black/5 shadow-sm">
                    <h3 className="font-bold text-xl mb-4">Are users verified?</h3>
                    <p className="text-black/60 font-medium text-lg leading-relaxed">Yes. Our structured onboarding ensures accountability for everyone in the circle.</p>
                  </div>
                </div>
              </motion.div>

              {/* FINAL CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="text-center pt-16 pb-12"
              >
                <h2 className="text-6xl md:text-8xl font-bold tracking-tighter mb-12 leading-[0.9]">
                  Stop Paying <br />
                  <span className="text-black/30">Solo.</span>
                </h2>
                <div className="flex flex-wrap justify-center gap-4 text-xl md:text-2xl font-bold text-black/60 mb-16">
                  <span>Secure your slot.</span>
                  <span className="hidden sm:inline">•</span>
                  <span>Split the bill.</span>
                  <span className="hidden sm:inline">•</span>
                  <span>Stay premium.</span>
                </div>
                <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
                  <button
                    onClick={() => setActiveSection('signup')}
                    className="px-10 py-5 bg-black text-white rounded-2xl font-bold text-xl hover:scale-[1.02] transition-all shadow-xl shadow-black/10"
                  >
                    Lock My Slot
                  </button>
                  <button
                    onClick={() => setActiveSection('signup')}
                    className="px-10 py-5 bg-white border border-black/10 text-black rounded-2xl font-bold text-xl hover:bg-black/5 transition-all"
                  >
                    Try 7 Days Free
                  </button>
                </div>
                <div className="text-sm font-bold text-black/40 uppercase tracking-widest space-y-2">
                  <p>Limited live positions.</p>
                  <p>When a circle closes — it closes.</p>
                </div>
              </motion.div>
            </motion.div>
          )}
          {activeSection === 'login' && (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="max-w-md mx-auto px-6 pt-12"
            >
              <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-black/5 border border-black/5">
                <div className="text-center mb-8">
                  <Logo className="w-16 h-16 mx-auto mb-6" />
                  <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
                  <p className="text-black/60">Log in to access your dashboard</p>
                </div>

                {error && <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100">{error}</div>}
                {success && <div className="mb-4 p-4 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-bold border border-emerald-100">{success}</div>}

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold mb-2">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-black/40">
                        <Mail size={20} />
                      </div>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3 bg-[#F5F5F4] border-none rounded-xl focus:ring-2 focus:ring-black outline-none transition-all"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-black/40">
                        <Lock size={20} />
                      </div>
                      <input
                        type="password"
                        name="password"
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3 bg-[#F5F5F4] border-none rounded-xl focus:ring-2 focus:ring-black outline-none transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-black text-white rounded-xl font-bold text-lg hover:scale-[1.02] transition-transform mt-6 disabled:opacity-50"
                  >
                    {isLoading ? 'Verifying...' : 'Log In'}
                  </button>
                </form>

                <div className="mt-8 text-center text-sm text-black/60">
                  Don't have an account?{' '}
                  <button onClick={() => setActiveSection('signup')} className="text-black font-bold hover:underline">
                    Sign up
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'signup' && (
            <motion.div
              key="signup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="max-w-md mx-auto px-6 pt-12"
            >
              <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-black/5 border border-black/5">
                <div className="text-center mb-8">
                  <Logo className="w-16 h-16 mx-auto mb-6" />
                  <h2 className="text-3xl font-bold mb-2">Create Account</h2>
                  <p className="text-black/60">Join the community and start saving</p>
                </div>

                {error && <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100">{error}</div>}
                {success && <div className="mb-4 p-4 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-bold border border-emerald-100">{success}</div>}

                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold mb-2">Full Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-black/40">
                        <UserIcon size={20} />
                      </div>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3 bg-[#F5F5F4] border-none rounded-xl focus:ring-2 focus:ring-black outline-none transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">Username</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-black/40">
                        <Hash size={20} />
                      </div>
                      <input
                        type="text"
                        name="username"
                        required
                        value={formData.username}
                        onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                        className="w-full pl-12 pr-4 py-3 bg-[#F5F5F4] border-none rounded-xl focus:ring-2 focus:ring-black outline-none transition-all"
                        placeholder="john_doe"
                        minLength={3}
                        maxLength={30}
                      />
                    </div>
                    <p className="text-[11px] text-black/40 mt-1.5 ml-1">Letters, numbers, underscores only. Min 3 chars. This is your public Q handle.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-black/40">
                        <Mail size={20} />
                      </div>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3 bg-[#F5F5F4] border-none rounded-xl focus:ring-2 focus:ring-black outline-none transition-all"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">Phone Number</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-black/40">
                        <Phone size={20} />
                      </div>
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3 bg-[#F5F5F4] border-none rounded-xl focus:ring-2 focus:ring-black outline-none transition-all"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-black/40">
                        <Lock size={20} />
                      </div>
                      <input
                        type="password"
                        name="password"
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3 bg-[#F5F5F4] border-none rounded-xl focus:ring-2 focus:ring-black outline-none transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading || !!success}
                    className="w-full py-4 bg-black text-white rounded-xl font-bold text-lg hover:scale-[1.02] transition-transform mt-6 disabled:opacity-50"
                  >
                    {isLoading ? 'Creating Circle...' : success ? 'Check Email' : 'Create Account'}
                  </button>
                </form>

                <div className="mt-8 text-center text-sm text-black/60">
                  Already have an account?{' '}
                  <button onClick={() => setActiveSection('login')} className="text-black font-bold hover:underline">
                    Log in
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="py-8 text-center text-sm font-medium text-black/40">
        <div className="flex flex-col items-center gap-1">
          <span>© 2026 Q</span>
          <span>
            Built by{' '}
            <span
              onPointerDown={handlePressStart}
              onPointerUp={handlePressEnd}
              onPointerLeave={handlePressEnd}
              onContextMenu={(e) => e.preventDefault()}
              className="select-none cursor-default"
            >
              CuratedbyQteam
            </span>
          </span>
        </div>
      </footer>
    </div>
  );
}
