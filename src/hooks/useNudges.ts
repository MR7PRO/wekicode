import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { trackEvent } from "@/lib/analytics";

export function useNudges() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["dismissed-nudges", user?.id],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("user_dismissed_nudges")
        .select("nudge_key")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.nudge_key);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 10,
  });

  const dismiss = useCallback(async (key: string) => {
    if (!user) return;
    await supabase.from("user_dismissed_nudges").insert({ user_id: user.id, nudge_key: key });
    trackEvent("nudge_dismissed", { nudge_key: key });
    qc.invalidateQueries({ queryKey: ["dismissed-nudges", user.id] });
  }, [user, qc]);

  return {
    dismissed: q.data ?? [],
    isDismissed: (key: string) => (q.data ?? []).includes(key),
    loading: q.isLoading,
    dismiss,
  };
}