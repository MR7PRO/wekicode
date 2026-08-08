import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { trackEvent } from "@/lib/analytics";

export type ActivityKind = "topic" | "reply" | "solution" | "article" | "follow" | "vote";

const POINTS: Record<ActivityKind, number> = {
  topic: 3, reply: 2, solution: 5, article: 4, follow: 1, vote: 1,
};

export interface StreakRow {
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  weekly_points: number;
}

export function useStreaks() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["activity-streak", user?.id],
    queryFn: async (): Promise<StreakRow | null> => {
      const { data, error } = await supabase
        .from("user_activity_streaks")
        .select("current_streak, longest_streak, last_active_date, weekly_points")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data as StreakRow) ?? null;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  /**
   * Records a meaningful contribution. The database caps points per call and
   * per week, so repeated calls cannot be farmed for score.
   */
  const recordActivity = useCallback(async (kind: ActivityKind) => {
    if (!user) return;
    const { error } = await supabase.rpc("record_activity", { _kind: kind, _points: POINTS[kind] });
    if (!error) {
      trackEvent("streak_updated", { kind });
      qc.invalidateQueries({ queryKey: ["activity-streak", user.id] });
    }
  }, [user, qc]);

  return {
    streak: q.data ?? null,
    loading: q.isLoading,
    error: q.isError,
    recordActivity,
  };
}