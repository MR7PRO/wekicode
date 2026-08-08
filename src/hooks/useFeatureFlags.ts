import { useQuery } from "@tanstack/react-query";
import { loadRemoteFlags, isFeatureEnabled, type FeatureKey } from "@/lib/featureFlags";

export function useFeatureFlags() {
  const q = useQuery({
    queryKey: ["feature-flags"],
    queryFn: loadRemoteFlags,
    staleTime: 1000 * 60 * 10,
  });

  return {
    loading: q.isLoading,
    isEnabled: (key: FeatureKey) => isFeatureEnabled(key),
  };
}

export function useFeature(key: FeatureKey) {
  const { loading, isEnabled } = useFeatureFlags();
  return { enabled: isEnabled(key), loading };
}