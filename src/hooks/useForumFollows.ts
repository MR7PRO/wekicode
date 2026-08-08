import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { trackEvent } from "@/lib/analytics";
import { useStreaks } from "@/hooks/useStreaks";

export interface FollowedForum { forum_id: string; slug: string; title: string; icon: string | null }
export interface FollowedTag { tag_id: string; slug: string; name: string }

export function useFollowedForums() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { recordActivity } = useStreaks();

  const q = useQuery({
    queryKey: ["followed-forums", user?.id],
    queryFn: async (): Promise<FollowedForum[]> => {
      const { data, error } = await supabase
        .from("forum_follows")
        .select("forum_id, forums(slug, title, icon)")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []).map((r) => {
        const f = r.forums as unknown as { slug: string; title: string; icon: string | null } | null;
        return { forum_id: r.forum_id, slug: f?.slug ?? "", title: f?.title ?? "", icon: f?.icon ?? null };
      }).filter((f) => !!f.slug);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  const toggle = useCallback(async (forumId: string) => {
    if (!user) return;
    const following = (q.data ?? []).some((f) => f.forum_id === forumId);
    if (following) {
      await supabase.from("forum_follows").delete().eq("user_id", user.id).eq("forum_id", forumId);
      trackEvent("forum_unfollowed", { forum_id: forumId });
    } else {
      await supabase.from("forum_follows").insert({ user_id: user.id, forum_id: forumId });
      trackEvent("forum_followed", { forum_id: forumId });
      void recordActivity("follow");
    }
    qc.invalidateQueries({ queryKey: ["followed-forums", user.id] });
  }, [user, q.data, qc, recordActivity]);

  return {
    forums: q.data ?? [],
    loading: q.isLoading,
    isFollowing: (id: string) => (q.data ?? []).some((f) => f.forum_id === id),
    toggle,
  };
}

export function useFollowedTags() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { recordActivity } = useStreaks();

  const q = useQuery({
    queryKey: ["followed-tags", user?.id],
    queryFn: async (): Promise<FollowedTag[]> => {
      const { data, error } = await supabase
        .from("tag_follows")
        .select("tag_id, forum_tags(slug, name)")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []).map((r) => {
        const t = r.forum_tags as unknown as { slug: string; name: string } | null;
        return { tag_id: r.tag_id, slug: t?.slug ?? "", name: t?.name ?? "" };
      }).filter((t) => !!t.slug);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  const toggle = useCallback(async (tagId: string) => {
    if (!user) return;
    const following = (q.data ?? []).some((t) => t.tag_id === tagId);
    if (following) {
      await supabase.from("tag_follows").delete().eq("user_id", user.id).eq("tag_id", tagId);
      trackEvent("tag_unfollowed", { tag_id: tagId });
    } else {
      await supabase.from("tag_follows").insert({ user_id: user.id, tag_id: tagId });
      trackEvent("tag_followed", { tag_id: tagId });
      void recordActivity("follow");
    }
    qc.invalidateQueries({ queryKey: ["followed-tags", user.id] });
  }, [user, q.data, qc, recordActivity]);

  return {
    tags: q.data ?? [],
    loading: q.isLoading,
    isFollowing: (id: string) => (q.data ?? []).some((t) => t.tag_id === id),
    toggle,
  };
}