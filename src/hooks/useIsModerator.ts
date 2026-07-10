import { useQuery } from "@tanstack/react-query";
import { checkIsModerator } from "@/lib/forum/api";
import { useAuth } from "@/contexts/AuthContext";

export function useIsModerator() {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["is-moderator", user?.id],
    queryFn: () => checkIsModerator(user!.id),
    enabled: !!user,
    staleTime: 1000 * 60 * 10,
  });
  return { isModerator: !!q.data, loading: q.isLoading };
}