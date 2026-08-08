import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useAchievementSync } from "@/hooks/useAchievements";
import { useFeature } from "@/hooks/useFeatureFlags";

/**
 * Invisible growth wiring for logged-in users:
 * - captures an invite code from the URL (?invite=CODE) for later attribution
 * - redirects first-time users to /onboarding once (never repeats afterwards)
 * - re-evaluates achievements server-side once per session
 */
export function GrowthGate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { needsOnboarding } = useOnboarding();
  const { enabled: onboardingEnabled } = useFeature("onboarding");
  useAchievementSync();

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("invite");
    if (code) localStorage.setItem("wk_invite", code.toUpperCase());
  }, []);

  useEffect(() => {
    if (user && onboardingEnabled && needsOnboarding) {
      navigate("/onboarding", { replace: true });
    }
  }, [user, onboardingEnabled, needsOnboarding, navigate]);

  return null;
}