import { useState } from "react";
import { Download, Smartphone, X, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { useFeature } from "@/hooks/useFeatureFlags";

export function InstallPrompt() {
  const { enabled } = useFeature("install_prompt");
  const { canInstall, engaged, dismissed, isIOS, install, dismissForever } = useInstallPrompt();
  const [hidden, setHidden] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  if (!enabled || dismissed || hidden || !engaged) return null;
  if (!canInstall && !isIOS) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 inset-x-4 md:inset-x-auto md:right-6 md:max-w-sm z-50">
      <div className="glass rounded-2xl border border-primary/20 p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm mb-1">ثبّت WekiCode كتطبيق</h3>
            <p className="text-xs text-muted-foreground mb-3">
              افتح المنتديات والمحتوى بسرعة من شاشة جهازك.
            </p>
            {showIOSHelp && (
              <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                <Share className="w-3.5 h-3.5" /> من زر المشاركة اختر Add to Home Screen
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                className="bg-gradient-primary"
                onClick={async () => {
                  if (canInstall) {
                    const ok = await install();
                    if (ok) setHidden(true);
                  } else {
                    setShowIOSHelp(true);
                  }
                }}
              >
                <Download className="w-4 h-4" /> تثبيت
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setHidden(true)}>
                لاحقًا
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-muted-foreground"
                onClick={() => {
                  dismissForever();
                  setHidden(true);
                }}
              >
                لا تظهر مرة أخرى
              </Button>
            </div>
          </div>
          <button
            onClick={() => setHidden(true)}
            aria-label="إغلاق"
            className="p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}