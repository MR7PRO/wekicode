import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useFollows(targetUserId?: string) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchFollowData = useCallback(async () => {
    if (!targetUserId) return;

    const [followersRes, followingRes] = await Promise.all([
      supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", targetUserId),
      supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", targetUserId),
    ]);

    setFollowersCount(followersRes.count ?? 0);
    setFollowingCount(followingRes.count ?? 0);

    if (user && user.id !== targetUserId) {
      const { data } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId)
        .maybeSingle();
      setIsFollowing(!!data);
    }
  }, [targetUserId, user]);

  useEffect(() => {
    fetchFollowData();
  }, [fetchFollowData]);

  const toggleFollow = async () => {
    if (!user || !targetUserId || user.id === targetUserId) return;
    setLoading(true);

    if (isFollowing) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", targetUserId);
      setIsFollowing(false);
      setFollowersCount(c => c - 1);
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: targetUserId });
      setIsFollowing(true);
      setFollowersCount(c => c + 1);
    }
    setLoading(false);
  };

  return { isFollowing, followersCount, followingCount, toggleFollow, loading };
}
