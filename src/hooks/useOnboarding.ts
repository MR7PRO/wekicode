import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { trackEvent } from "@/lib/analytics";

export interface OnboardingPrefs {
  onboarding_completed: boolean;
  primary_goal: string | null;
  experience_level: string | null;
  preferred_tracks: string[];
  username: string | null;
  full_name: string | null;
  bio: string | null;
  skills: string[] | null;
  avatar_url: string | null;
  portfolio_url: string | null;
  github_url: string | null;
  linkedin_url: string | null;
}

export function useOnboarding() {
  const { user, refreshProfile } = useAuth();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["onboarding-prefs", user?.id],
    queryFn: async (): Promise<OnboardingPrefs | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("onboarding_completed, primary_goal, experience_level, preferred_tracks, username, full_name, bio, skills, avatar_url, portfolio_url, github_url, linkedin_url")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return { ...data, preferred_tracks: data.preferred_tracks ?? [] } as OnboardingPrefs;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  const save = async (patch: Partial<OnboardingPrefs>) => {
    if (!user) throw new Error("auth");
    const { error } = await supabase.from("profiles").update(patch).eq("user_id", user.id);
    if (error) throw error;
    await qc.invalidateQueries({ queryKey: ["onboarding-prefs", user.id] });
    await refreshProfile();
  };

  const complete = async (patch: Partial<OnboardingPrefs>) => {
    await save({ ...patch, onboarding_completed: true });
    trackEvent("onboarding_completed", {
      goal: patch.primary_goal,
      level: patch.experience_level,
      tracks_count: patch.preferred_tracks?.length ?? 0,
    });
  };

  const skip = async () => {
    await save({ onboarding_completed: true });
    trackEvent("onboarding_skipped");
  };

  return {
    prefs: q.data ?? null,
    loading: q.isLoading,
    error: q.isError,
    needsOnboarding: !!user && !q.isLoading && !!q.data && !q.data.onboarding_completed,
    save,
    complete,
    skip,
  };
}