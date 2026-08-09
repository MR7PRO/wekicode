import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface NotificationPrefs {
  in_app_enabled: boolean;
  push_enabled: boolean;
  replies_enabled: boolean;
  mentions_enabled: boolean;
  solutions_enabled: boolean;
  achievements_enabled: boolean;
  followed_content_enabled: boolean;
  weekly_digest_enabled: boolean;
  quiet_hours_enabled: boolean;
}

const DEFAULTS: NotificationPrefs = {
  in_app_enabled: true,
  push_enabled: false,
  replies_enabled: true,
  mentions_enabled: true,
  solutions_enabled: true,
  achievements_enabled: true,
  followed_content_enabled: false,
  weekly_digest_enabled: false,
  quiet_hours_enabled: false,
};

export function useNotificationPreferences() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let ignore = false;
    (async () => {
      const { data } = await (supabase as any)
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!ignore) {
        if (data) setPrefs({ ...DEFAULTS, ...data });
        setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [user]);

  const update = useCallback(
    async (patch: Partial<NotificationPrefs>) => {
      if (!user) return;
      const next = { ...prefs, ...patch };
      setPrefs(next);
      await (supabase as any)
        .from("notification_preferences")
        .upsert({ user_id: user.id, ...patch }, { onConflict: "user_id" });
    },
    [prefs, user],
  );

  return { prefs, loading, update };
}