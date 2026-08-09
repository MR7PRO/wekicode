import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Shown when a new service worker version has been installed. Never reloads on its own. */
export function AppUpdatePrompt() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const handler = () => setReady(true);
    window.addEventListener("wekicode:sw-update-ready", handler);
    return () => window.removeEventListener("wekicode:sw-update-ready", handler);
  }, []);

  if (!ready) return null;

  const reload = () => {
    const hasDraft = Object.keys(localStorage).some((k) => k.startsWith("wekicode.draft."));
    if (hasDraft && !window.confirm("لديك مسودة محفوظة محليًا. هل تريد التحديث الآن؟")) return;
    window.location.reload();
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 inset-x-4 md:inset-x-auto md:left-6 md:max-w-xs z-50">
      <div className="glass rounded-2xl border border-border/60 p-4 shadow-lg flex items-start gap-3">
        <RefreshCw className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold mb-2">يتوفر تحديث جديد لـ WekiCode</p>
          <div className="flex gap-2">
            <Button size="sm" onClick={reload}>تحديث الآن</Button>
            <Button size="sm" variant="ghost" onClick={() => setReady(false)}>لاحقًا</Button>
          </div>
        </div>
      </div>
    </div>
  );
}