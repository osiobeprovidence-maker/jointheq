import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Download, Share, Plus, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISS_KEY = "jointheq_install_banner_dismissed_at";
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000;
const SHOW_DELAY_MS = 10 * 1000;

function isStandaloneMode() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

function isMobileDevice() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(max-width: 768px)").matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isIosDevice() {
  if (typeof window === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function wasDismissedRecently() {
  const dismissedAt = Number(window.localStorage.getItem(DISMISS_KEY) || 0);
  return dismissedAt > 0 && Date.now() - dismissedAt < DISMISS_MS;
}

export default function InstallBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosModal, setShowIosModal] = useState(false);
  const isIos = useMemo(isIosDevice, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isMobileDevice() || isStandaloneMode() || wasDismissedRecently()) return;

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    const timer = window.setTimeout(() => {
      if (!isStandaloneMode() && !wasDismissedRecently()) {
        setIsVisible(true);
      }
    }, SHOW_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const dismiss = () => {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setIsVisible(false);
    setShowIosModal(false);
  };

  const install = async () => {
    if (isIos) {
      setShowIosModal(true);
      return;
    }

    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);

    if (choice.outcome === "accepted") {
      dismiss();
    }
  };

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 32 }}
            className="fixed inset-x-3 bottom-3 z-[120] mx-auto max-w-md rounded-[1.5rem] border border-red-100 bg-white p-3 shadow-[0_18px_50px_rgba(185,28,28,0.22)] sm:hidden"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-950 text-white">
                <Download size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-black leading-tight text-zinc-950">Install JoinTheQ</h2>
                <p className="mt-0.5 text-xs font-semibold leading-5 text-zinc-500">
                  Access tasks faster and earn on the go.
                </p>
              </div>
              <button
                type="button"
                onClick={dismiss}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                aria-label="Dismiss install banner"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={install}
                className="rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-black text-white shadow-lg shadow-black/20 transition-all active:scale-95"
              >
                Install
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-black text-red-700 transition-all active:scale-95"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showIosModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[130] flex items-end bg-black/35 p-3 backdrop-blur-sm sm:hidden"
            onClick={() => setShowIosModal(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full rounded-[1.75rem] bg-white p-5 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-zinc-950">Install JoinTheQ</h2>
                  <p className="mt-1 text-sm font-semibold leading-6 text-zinc-500">
                    Add JoinTheQ to your Home Screen from Safari.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIosModal(false)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500"
                  aria-label="Close iOS install instructions"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="mt-5 space-y-3">
                <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-sm font-black text-red-700">
                  <Share size={18} />
                  Tap the Share button in Safari.
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-sm font-black text-red-700">
                  <Plus size={18} />
                  Choose Add to Home Screen.
                </div>
              </div>
              <button
                type="button"
                onClick={dismiss}
                className="mt-5 w-full rounded-2xl bg-zinc-950 px-4 py-4 text-sm font-black text-white"
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
