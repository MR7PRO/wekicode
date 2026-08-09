import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

export function NetworkStatusBanner() {
  const { isOnline, wasOffline, resetWasOffline } = useNetworkStatus();
  const [showBack, setShowBack] = useState(false);

  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowBack(true);
      const t = setTimeout(() => {
        setShowBack(false);
        resetWasOffline();
      }, 3500);
      return () => clearTimeout(t);
    }
  }, [isOnline, wasOffline, resetWasOffline]);

  if (isOnline && !showBack) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[60] flex justify-center px-3 pt-[env(safe-area-inset-top)]">
      <div
        className={`mt-2 flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium shadow-lg ${
          isOnline ? "bg-success/90 text-success-foreground" : "bg-warning/90 text-warning-foreground"
        }`}
        role="status"
      >
        {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
        {isOnline ? "تم استعادة الاتصال." : "أنت الآن بدون اتصال — يمكنك قراءة المحتوى المحفوظ."}
      </div>
    </div>
  );
}