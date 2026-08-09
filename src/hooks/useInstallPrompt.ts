import { useCallback, useEffect, useState } from "react";
import { isStandalone } from "@/pwa/pwaUtils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa_install_prompt_dismissed";
const VISITS_KEY = "pwa_visit_count";

export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [engaged, setEngaged] = useState(false);
  const [installed, setInstalled] = useState(() => isStandalone());
  const dismissed = localStorage.getItem(DISMISS_KEY) === "true";

  useEffect(() => {
    const n = Number(localStorage.getItem(VISITS_KEY) || 0) + 1;
    localStorage.setItem(VISITS_KEY, String(n));
    setEngaged(n >= 2);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return false;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") {
      setDeferred(null);
      return true;
    }
    return false;
  }, [deferred]);

  const dismissForever = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, "true");
  }, []);

  const isIOS =
    typeof navigator !== "undefined" &&
    /iphone|ipad|ipod/i.test(navigator.userAgent) &&
    !("onbeforeinstallprompt" in window);

  return { canInstall: !!deferred && !installed, installed, engaged, dismissed, isIOS, install, dismissForever };
}