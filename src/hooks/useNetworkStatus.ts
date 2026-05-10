import { useEffect, useState } from "react";

export function useNetworkStatus() {
  const getOnline = () => (typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [online, setOnline] = useState<boolean>(getOnline());
  const [effectiveType, setEffectiveType] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // network information (optional)
    const nav: any = (navigator as any);
    const conn = nav && (nav.connection || nav.mozConnection || nav.webkitConnection);

    const updateConnection = () => {
      try {
        setEffectiveType(conn ? conn.effectiveType || String(conn.type) : null);
      } catch (e) {
        setEffectiveType(null);
      }
    };

    updateConnection();
    if (conn && conn.addEventListener) conn.addEventListener('change', updateConnection);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (conn && conn.removeEventListener) conn.removeEventListener('change', updateConnection);
    };
  }, []);

  return { online, effectiveType };
}
