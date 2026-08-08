import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Hash, Compass, HelpCircle, Layers } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { fetchLatestTopics, fetchAllForums, fetchTrendingTags, relativeArabic } from "@/lib/forum/api";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useFollowedForums, useFollowedTags } from "@/hooks/useForumFollows";
import { keywordsForTracks, relevanceScore } from "@/lib/growth/preferences";

/**
 * Preference-aware sections for the logged-in homepage.
 * Pure client-side ranking over already-fetched forum data — no AI calls.
 */
export function PersonalizedSections() {
  const { prefs } = useOnboarding();
  const followedForums = useFollowedForums();
  const followedTags = useFollowedTags();

  const topics = useQuery({ queryKey: ["personalized-topics"], queryFn: () => fetchLatestTopics(40), staleTime: 1000 * 60 * 3 });
  const forums = useQuery({ queryKey: ["all-forums"], queryFn: fetchAllForums, staleTime: 1000 * 60 * 30 });
  const tags = useQuery({ queryKey: ["forums-tags"], queryFn: () => fetchTrendingTags(14), staleTime: 1000 * 60 * 10 });

  const keywords = useMemo(() => keywordsForTracks(prefs?.preferred_tracks), [prefs?.preferred_tracks]);
  const hasPrefs = keywords.length > 0 || followedForums.forums.length > 0 || followedTags.tags.length > 0;

  const followedForumIds = new Set(followedForums.forums.map((f) => f.forum_id));

  const suggested = useMemo(() => {
    const list = topics.data ?? [];
    if (list.length === 0) return [];
    const scored = list.map((t) => ({
      t,
      score:
        relevanceScore(`${t.title} ${t.excerpt ?? ""} ${t.forum_title ?? ""}`, keywords) * 3 +
        (followedForumIds.has(t.forum_id) ? 4 : 0) +
        Math.min(t.score, 5),
    }));
    return scored.sort((a, b) => b.score - a.score).slice(0, 5).map((s) => s.t);
  }, [topics.data, keywords, followedForums.forums]);

  const needsAnswer = useMemo(() => {
    const list = (topics.data ?? []).filter((t) => t.replies_count === 0 && t.status !== "solved");
    if (keywords.length === 0) return list.slice(0, 4);
    return list
      .map((t) => ({ t, s: relevanceScore(`${t.title} ${t.excerpt ?? ""}`, keywords) }))
      .sort((a, b) => b.s - a.s)
      .slice(0, 4)
      .map((x) => x.t);
  }, [topics.data, keywords]);

  const matchingForums = useMemo(() => {
    const list = forums.data ?? [];
    if (keywords.length === 0) return list.slice(0, 6);
    return list
      .map((f) => ({ f, s: relevanceScore(`${f.title} ${f.description ?? ""} ${f.slug}`, keywords) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 6)
      .map((x) => x.f);
  }, [forums.data, keywords]);

  if (topics.isLoading) return <Skeleton className="h-40 w-full rounded-xl" />;

  return (
    <div className="space-y-4">
      {!hasPrefs && (
        <Card className="p-4 border-primary/30 bg-primary/5">
          <h3 className="font-bold text-sm flex items-center gap-2 mb-1">
            <Compass className="w-4 h-4 text-primary" /> ابدأ من هنا
          </h3>
          <p className="text-[11px] text-muted-foreground mb-2">
            اختر اهتماماتك عشان نرتب لك المنتديات والمحتوى المناسب.
          </p>
          <Link to="/onboarding" className="text-[11px] text-primary hover:underline">حدّد اهتماماتك</Link>
        </Card>
      )}

      {suggested.length > 0 && (
        <Card className="p-4 border-border/50">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> مقترح لك
          </h3>
          <div className="space-y-1.5">
            {suggested.map((t) => (
              <Link key={t.id} to={`/forums/${t.forum_slug}/${t.id}`}
                className="block p-2 rounded-lg border border-border/40 hover:border-primary/40 hover:bg-card/60 transition-all">
                <div className="text-xs font-semibold text-foreground line-clamp-1">{t.title}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {t.forum_title} · {relativeArabic(t.last_activity_at)} · {t.replies_count} ردود
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {matchingForums.length > 0 && (
        <Card className="p-4 border-border/50">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" /> أقسام تناسب اهتمامك
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {matchingForums.map((f) => (
              <Link key={f.id} to={`/forums/${f.slug}`}
                className="text-[11px] px-2 py-1 rounded-full bg-card/60 border border-border/50 hover:border-primary/50 hover:text-primary transition-colors">
                {f.title}
              </Link>
            ))}
          </div>
        </Card>
      )}

      {needsAnswer.length > 0 && (
        <Card className="p-4 border-border/50">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-rose-500" /> مواضيع تحتاج إجابة في مسارك
          </h3>
          <div className="space-y-1.5">
            {needsAnswer.map((t) => (
              <Link key={t.id} to={`/forums/${t.forum_slug}/${t.id}`}
                className="flex items-center justify-between gap-2 p-2 rounded-lg border border-border/40 hover:border-primary/40 transition-all">
                <span className="text-xs text-foreground line-clamp-1">{t.title}</span>
                <Badge variant="outline" className="text-[9px] shrink-0 border-rose-500/30 text-rose-500">بحاجة لإجابة</Badge>
              </Link>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-4 border-border/50">
        <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
          <Hash className="w-4 h-4 text-primary" /> وسوم تتابعها
        </h3>
        {followedTags.tags.length === 0 ? (
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground">لا تتابع أي وسم بعد.</p>
            <div className="flex flex-wrap gap-1.5">
              {(tags.data ?? []).slice(0, 8).map((t) => (
                <Link key={t.id} to={`/tags/${t.slug}`}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-card/60 border border-border/50 hover:border-primary/50 hover:text-primary transition-colors">
                  #{t.name}
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {followedTags.tags.map((t) => (
              <Link key={t.tag_id} to={`/tags/${t.slug}`}
                className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-primary">
                #{t.name}
              </Link>
            ))}
          </div>
        )}
      </Card>

      {followedForums.forums.length > 0 && (
        <Card className="p-4 border-border/50">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <Compass className="w-4 h-4 text-primary" /> أقسام تتابعها
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {followedForums.forums.map((f) => (
              <Link key={f.forum_id} to={`/forums/${f.slug}`}
                className="text-[11px] px-2 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary">
                {f.title}
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}