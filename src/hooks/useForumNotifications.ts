import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchNotifications, fetchUnreadCount, markAllNotificationsRead, markNotificationRead } from "@/lib/forum/api";
import { useAuth } from "@/contexts/AuthContext";

export function useForumNotifications() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["forum-notifications", user?.id],
    queryFn: () => fetchNotifications(user!.id, 20),
    enabled: !!user,
  });
  const unread = useQuery({
    queryKey: ["forum-notifications-unread", user?.id],
    queryFn: () => fetchUnreadCount(user!.id),
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`notif-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "user_notifications", filter: `user_id=eq.${user.id}` },
        () => {
          qc.invalidateQueries({ queryKey: ["forum-notifications", user.id] });
          qc.invalidateQueries({ queryKey: ["forum-notifications-unread", user.id] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, qc]);

  return {
    notifications: list.data ?? [],
    unread: unread.data ?? 0,
    loading: list.isLoading,
    markRead: async (id: string) => {
      await markNotificationRead(id);
      qc.invalidateQueries({ queryKey: ["forum-notifications", user?.id] });
      qc.invalidateQueries({ queryKey: ["forum-notifications-unread", user?.id] });
    },
    markAllRead: async () => {
      if (!user) return;
      await markAllNotificationsRead(user.id);
      qc.invalidateQueries({ queryKey: ["forum-notifications", user.id] });
      qc.invalidateQueries({ queryKey: ["forum-notifications-unread", user.id] });
    },
  };
}