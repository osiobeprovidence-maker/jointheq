import React from "react";
import { X, ShieldCheck } from "lucide-react";

interface TermsAcceptanceModalProps {
  onAccept: () => void;
  onClose: () => void;
}

export function TermsAcceptanceModal({ onAccept, onClose }: TermsAcceptanceModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-2xl overflow-hidden rounded-[2.5rem] bg-zinc-950 border border-white/10 text-white shadow-2xl">
        <div className="relative p-8 sm:p-12">
          <div className="absolute top-6 right-6">
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition">
              <X size={24} className="text-white/40" />
            </button>
          </div>

          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#F26522]/10 text-[#F26522] mb-6">
              <ShieldCheck size={32} />
            </div>
            <h2 className="text-4xl font-black tracking-tight mb-4">Terms of Service</h2>
            <p className="text-xl text-white/60 font-medium">Please review and accept our terms to continue using the Q Quest platform.</p>
          </div>

          <div className="max-h-[40vh] overflow-y-auto mb-8 pr-4 space-y-6 custom-scrollbar">
            <section>
              <h3 className="text-lg font-black mb-2 uppercase tracking-widest text-[#F26522]">1. Introduction</h3>
              <p className="text-white/50 leading-relaxed font-bold">
                By using Q Quest, you agree to these terms. Q Quest is a marketplace connecting brands with users for engagement tasks.
              </p>
            </section>
            
            <section>
              <h3 className="text-lg font-black mb-2 uppercase tracking-widest text-[#F26522]">2. User Earnings</h3>
              <p className="text-white/50 leading-relaxed font-bold">
                Earnings are credited to your Quest Wallet after successful proof verification. Payouts are subject to a minimum withdrawal limit of ₦1,000 and a flat fee of ₦100.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-black mb-2 uppercase tracking-widest text-[#F26522]">3. Quest Creation</h3>
              <p className="text-white/50 leading-relaxed font-bold">
                Quest creators must fund campaigns upfront. Once live, campaigns cannot be refunded unless rejected by admins. Quests must comply with our community standards.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-black mb-2 uppercase tracking-widest text-[#F26522]">4. Prohibited Activities</h3>
              <p className="text-white/50 leading-relaxed font-bold">
                Spamming, fake proofs, multiple accounts, and fraudulent activities will result in immediate suspension and forfeiture of earnings.
              </p>
            </section>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={onAccept}
              className="flex-1 rounded-2xl bg-white px-8 py-5 text-lg font-black text-zinc-950 transition hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-white/10"
            >
              I Accept & Agree
            </button>
            <button 
              onClick={onClose}
              className="flex-1 rounded-2xl bg-white/5 border border-white/10 px-8 py-5 text-lg font-black text-white/60 transition hover:bg-white/10"
            >
              Cancel
            </button>
          </div>
          
          <p className="mt-6 text-center text-xs font-bold text-white/30 uppercase tracking-[.2em]">
            Version 2.0.1 • Updated May 2026
          </p>
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(242, 101, 34, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(242, 101, 34, 0.5);
        }
      `}</style>
    </div>
  );
}
