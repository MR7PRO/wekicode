import { useCallback, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/analytics";

export interface AchievementDefinition {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  icon: string | null;
  points_reward: number;
  rarity: string;
}

export interface EarnedAchievement {
  achievement_id: string;
  earned_at: string;
  progress: number;
}

export async function fetchAchievementDefinitions(): Promise<AchievementDefinition[]> {
  const { data, error } = await supabase
    .from("achievement_definitions")
    .select("id, slug, title, description, category, icon, points_reward, rarity")
    .eq("is_active", true)
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as AchievementDefinition[];
}

export async function fetchEarnedAchievements(userId: string): Promise<EarnedAchievement[]> {
  const { data, error } = await supabase
    .from("user_achievements")
    .select("achievement_id, earned_at, progress")
    .eq("user_id", userId)
    .order("earned_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as EarnedAchievement[];
}

/**
 * Achievements are granted exclusively by the `sync_my_achievements` database
 * function, which re-checks real activity server-side. The client can only ask
 * for a re-evaluation — it can never write to `user_achievements`.
 */
export function useAchievements(userId?: string) {
  const { user } = useAuth();
  const targetId = userId ?? user?.id;
  const qc = useQueryClient();

  const definitions = useQuery({
    queryKey: ["achievement-definitions"],
    queryFn: fetchAchievementDefinitions,
    staleTime: 1000 * 60 * 60,
  });

  const earned = useQuery({
    queryKey: ["user-achievements", targetId],
    queryFn: () => fetchEarnedAchievements(targetId!),
    enabled: !!targetId,
    staleTime: 1000 * 60 * 2,
  });

  const sync = useCallback(async () => {
    if (!user) return [];
    const { data, error } = await supabase.rpc("sync_my_achievements");
    if (error) return [];
    const res = data as { success?: boolean; awarded?: string[] } | null;
    const awarded = res?.awarded ?? [];
    if (awarded.length > 0) {
      qc.invalidateQueries({ queryKey: ["user-achievements", user.id] });
      const defs = definitions.data ?? (await fetchAchievementDefinitions());
      for (const slug of awarded) {
        const def = defs.find((d) => d.slug === slug);
        trackEvent("achievement_earned", { slug, rarity: def?.rarity, category: def?.category });
        toast({
          title: "🎖️ شارة جديدة",
          description: def ? `${def.title} — ${def.description}` : "حصلت على شارة جديدة",
        });
      }
    }
    return awarded;
  }, [user, qc, definitions.data]);

  const earnedIds = new Set((earned.data ?? []).map((e) => e.achievement_id));

  return {
    definitions: definitions.data ?? [],
    earned: earned.data ?? [],
    earnedIds,
    loading: definitions.isLoading || earned.isLoading,
    error: definitions.isError || earned.isError,
    sync,
  };
}

/** Re-evaluates achievements once per session after login. */
export function useAchievementSync() {
  const { user } = useAuth();
  const { sync } = useAchievements();
  const done = useRef(false);

  useEffect(() => {
    if (!user || done.current) return;
    done.current = true;
    const t = setTimeout(() => { void sync(); }, 2500);
    return () => clearTimeout(t);
  }, [user, sync]);
}