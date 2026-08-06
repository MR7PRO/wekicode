import { supabase } from "@/integrations/supabase/client";

// Cast helper — new tables aren't in generated types until types.ts refreshes.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export interface ForumCategory {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  icon: string | null;
  display_order: number;
}

export interface Forum {
  id: string;
  category_id: string;
  slug: string;
  title: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  display_order: number;
  is_new: boolean;
}

export interface ForumWithStats extends Forum {
  topics_count: number;
  replies_count: number;
  latest?: {
    id: string;
    title: string;
    type: string;
    last_activity_at: string;
    author_id: string;
    author_name: string;
    author_avatar: string | null;
  };
}

export interface ForumTag {
  id: string;
  slug: string;
  name: string;
  usage_count: number;
}

export interface ForumTopic {
  id: string;
  forum_id: string;
  author_id: string;
  title: string;
  content: string;
  excerpt: string | null;
  type: string;
  status: string;
  score: number;
  views_count: number;
  replies_count: number;
  is_pinned: boolean;
  is_locked: boolean;
  is_featured: boolean;
  solved_reply_id: string | null;
  last_activity_at: string;
  created_at: string;
  updated_at: string;
}

export interface TopicWithAuthor extends ForumTopic {
  author_name: string;
  author_avatar: string | null;
  forum_slug?: string;
  forum_title?: string;
  tags?: ForumTag[];
}

export interface ForumReply {
  id: string;
  topic_id: string;
  author_id: string;
  parent_reply_id: string | null;
  content: string;
  score: number;
  is_solution: boolean;
  created_at: string;
  author_name?: string;
  author_avatar?: string | null;
}

// -------- Queries --------

export async function fetchCategoriesWithForums() {
  const [{ data: cats, error: e1 }, { data: forums, error: e2 }] = await Promise.all([
    db.from("forum_categories").select("*").eq("is_active", true).order("display_order"),
    db.from("forums").select("*").eq("is_active", true).order("display_order"),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  const forumIds: string[] = (forums ?? []).map((f: Forum) => f.id);

  // Latest topic per forum + counts (aggregated client-side; small dataset).
  const { data: topics } = await db
    .from("forum_topics")
    .select("id, forum_id, title, type, last_activity_at, author_id, replies_count")
    .in("forum_id", forumIds.length ? forumIds : ["00000000-0000-0000-0000-000000000000"])
    .order("last_activity_at", { ascending: false });

  const topicsByForum = new Map<string, any[]>();
  (topics ?? []).forEach((t: any) => {
    if (!topicsByForum.has(t.forum_id)) topicsByForum.set(t.forum_id, []);
    topicsByForum.get(t.forum_id)!.push(t);
  });

  const authorIds: string[] = Array.from(
    new Set((topics ?? []).map((t: any) => t.author_id as string).filter(Boolean))
  );
  const profilesById = await fetchProfilesByUserIds(authorIds);

  const withStats: ForumWithStats[] = (forums ?? []).map((f: Forum) => {
    const list = topicsByForum.get(f.id) ?? [];
    const latest = list[0];
    const replies = list.reduce((s, t: any) => s + (t.replies_count || 0), 0);
    return {
      ...f,
      topics_count: list.length,
      replies_count: replies,
      latest: latest
        ? {
            id: latest.id,
            title: latest.title,
            type: latest.type,
            last_activity_at: latest.last_activity_at,
            author_id: latest.author_id,
            author_name: profilesById.get(latest.author_id)?.full_name || "عضو WekiCode",
            author_avatar: profilesById.get(latest.author_id)?.avatar_url ?? null,
          }
        : undefined,
    };
  });

  return { categories: (cats ?? []) as ForumCategory[], forums: withStats };
}

export async function fetchProfilesByUserIds(ids: string[]) {
  const map = new Map<string, { full_name: string | null; avatar_url: string | null }>();
  if (!ids.length) return map;
  const { data } = await db.from("profiles").select("user_id, full_name, avatar_url").in("user_id", ids);
  (data ?? []).forEach((p: any) => map.set(p.user_id, { full_name: p.full_name, avatar_url: p.avatar_url }));
  return map;
}

export async function fetchLatestTopics(limit = 12) {
  const { data, error } = await db
    .from("forum_topics")
    .select("*, forums(slug, title)")
    .order("last_activity_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  const rows = data ?? [];
  const profiles = await fetchProfilesByUserIds(
    Array.from(new Set(rows.map((r: any) => r.author_id as string).filter(Boolean))) as string[]
  );
  return rows.map((r: any) => ({
    ...r,
    author_name: profiles.get(r.author_id)?.full_name || "عضو WekiCode",
    author_avatar: profiles.get(r.author_id)?.avatar_url ?? null,
    forum_slug: r.forums?.slug,
    forum_title: r.forums?.title,
  })) as TopicWithAuthor[];
}

export async function fetchTrendingTags(limit = 12) {
  const { data } = await db
    .from("forum_tags")
    .select("*")
    .order("usage_count", { ascending: false })
    .limit(limit);
  return (data ?? []) as ForumTag[];
}

export async function fetchCommunityStats() {
  const [c, f, t, r] = await Promise.all([
    db.from("forum_categories").select("id", { count: "exact", head: true }).eq("is_active", true),
    db.from("forums").select("id", { count: "exact", head: true }).eq("is_active", true),
    db.from("forum_topics").select("id", { count: "exact", head: true }),
    db.from("forum_replies").select("id", { count: "exact", head: true }),
  ]);
  return {
    categories: c.count ?? 0,
    forums: f.count ?? 0,
    topics: t.count ?? 0,
    replies: r.count ?? 0,
  };
}

export async function fetchForumBySlug(slug: string) {
  const { data, error } = await db.from("forums").select("*, forum_categories(title, slug)").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data as (Forum & { forum_categories?: { title: string; slug: string } }) | null;
}

export async function fetchTopicsForForum(forumId: string, opts: { sort?: string; search?: string; page?: number; pageSize?: number } = {}) {
  const page = opts.page ?? 1;
  const size = opts.pageSize ?? 20;
  let q = db.from("forum_topics").select("*", { count: "exact" }).eq("forum_id", forumId);
  if (opts.search) q = q.or(`title.ilike.%${opts.search}%,content.ilike.%${opts.search}%`);
  switch (opts.sort) {
    case "الأكثر ردودًا":
      q = q.order("replies_count", { ascending: false });
      break;
    case "غير محلول":
      q = q.neq("status", "solved").order("last_activity_at", { ascending: false });
      break;
    case "المثبت":
      q = q.eq("is_pinned", true).order("last_activity_at", { ascending: false });
      break;
    case "النشط":
      q = q.order("last_activity_at", { ascending: false });
      break;
    default:
      q = q.order("created_at", { ascending: false });
  }
  q = q.range((page - 1) * size, page * size - 1);
  const { data, error, count } = await q;
  if (error) throw error;
  const rows = data ?? [];
  const profiles = await fetchProfilesByUserIds(
    Array.from(new Set(rows.map((r: any) => r.author_id as string).filter(Boolean))) as string[]
  );
  return {
    total: count ?? 0,
    topics: rows.map((r: any) => ({
      ...r,
      author_name: profiles.get(r.author_id)?.full_name || "عضو WekiCode",
      author_avatar: profiles.get(r.author_id)?.avatar_url ?? null,
    })) as TopicWithAuthor[],
  };
}

export async function fetchTopic(id: string) {
  const { data, error } = await db
    .from("forum_topics")
    .select("*, forums(slug, title, id)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const profiles = await fetchProfilesByUserIds([data.author_id]);
  const { data: tagRows } = await db
    .from("forum_topic_tags")
    .select("forum_tags(id, slug, name, usage_count)")
    .eq("topic_id", id);
  return {
    ...data,
    author_name: profiles.get(data.author_id)?.full_name || "عضو WekiCode",
    author_avatar: profiles.get(data.author_id)?.avatar_url ?? null,
    forum_slug: data.forums?.slug,
    forum_title: data.forums?.title,
    tags: (tagRows ?? []).map((r: any) => r.forum_tags).filter(Boolean),
  } as TopicWithAuthor;
}

export async function fetchReplies(topicId: string) {
  const { data, error } = await db
    .from("forum_replies")
    .select("*")
    .eq("topic_id", topicId)
    .order("is_solution", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) throw error;
  const rows = data ?? [];
  const profiles = await fetchProfilesByUserIds(
    Array.from(new Set(rows.map((r: any) => r.author_id as string).filter(Boolean))) as string[]
  );
  return rows.map((r: any) => ({
    ...r,
    author_name: profiles.get(r.author_id)?.full_name || "عضو WekiCode",
    author_avatar: profiles.get(r.author_id)?.avatar_url ?? null,
  })) as ForumReply[];
}

export async function incrementTopicViews(id: string) {
  await db.rpc("increment_forum_topic_views", { p_topic_id: id });
}

export async function castVote(params: { topicId?: string; replyId?: string; value: 1 | -1; userId: string }) {
  const { topicId, replyId, value, userId } = params;
  const target = topicId ? { topic_id: topicId } : { reply_id: replyId };
  // Check existing
  const q = db.from("forum_votes").select("*").eq("user_id", userId);
  const existing = topicId ? await q.eq("topic_id", topicId).maybeSingle() : await q.eq("reply_id", replyId!).maybeSingle();
  if (existing.data) {
    if (existing.data.value === value) {
      await db.from("forum_votes").delete().eq("id", existing.data.id);
    } else {
      await db.from("forum_votes").update({ value }).eq("id", existing.data.id);
    }
  } else {
    await db.from("forum_votes").insert({ user_id: userId, value, ...target });
  }
}

export async function toggleBookmark(userId: string, topicId: string) {
  const { data: existing } = await db.from("forum_bookmarks").select("id").eq("user_id", userId).eq("topic_id", topicId).maybeSingle();
  if (existing) {
    await db.from("forum_bookmarks").delete().eq("id", existing.id);
    return false;
  }
  await db.from("forum_bookmarks").insert({ user_id: userId, topic_id: topicId });
  return true;
}

export async function createReply(params: { topicId: string; userId: string; content: string }) {
  const { data, error } = await db.from("forum_replies").insert({
    topic_id: params.topicId,
    author_id: params.userId,
    content: params.content,
  }).select().single();
  if (error) throw error;
  return data;
}

export async function markSolution(replyId: string) {
  const { data, error } = await db.rpc("mark_forum_solution", { p_reply_id: replyId });
  if (error) throw error;
  return data;
}

export async function createTopic(params: {
  userId: string;
  forumId: string;
  title: string;
  content: string;
  type: string;
  tagIds?: string[];
}) {
  const excerpt = params.content.slice(0, 200);
  const { data, error } = await db.from("forum_topics").insert({
    forum_id: params.forumId,
    author_id: params.userId,
    title: params.title,
    content: params.content,
    excerpt,
    type: params.type,
  }).select().single();
  if (error) throw error;
  if (params.tagIds?.length) {
    await db.from("forum_topic_tags").insert(params.tagIds.map((tag_id) => ({ topic_id: data.id, tag_id })));
  }
  return data;
}

export async function fetchAllForums() {
  const { data } = await db.from("forums").select("*").eq("is_active", true).order("title");
  return (data ?? []) as Forum[];
}

export async function fetchAllTags() {
  const { data } = await db.from("forum_tags").select("*").order("name");
  return (data ?? []) as ForumTag[];
}

export function relativeArabic(iso: string) {
  const then = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - then);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "الآن";
  if (m < 60) return `منذ ${m} د`;
  const h = Math.floor(m / 60);
  if (h < 24) return `منذ ${h} س`;
  const d = Math.floor(h / 24);
  if (d < 30) return `منذ ${d} ي`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `منذ ${mo} شهر`;
  return `منذ ${Math.floor(mo / 12)} سنة`;
}

export function exactArabic(iso: string) {
  try {
    return new Date(iso).toLocaleString("ar", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

// ================= Reputation =================

export function reputationLevel(points: number): { label: string; color: string } {
  if (points >= 1000) return { label: "نجم WekiCode", color: "bg-amber-500/20 text-amber-500 border-amber-500/40" };
  if (points >= 400) return { label: "خبير", color: "bg-purple-500/20 text-purple-400 border-purple-500/40" };
  if (points >= 150) return { label: "مساهم", color: "bg-emerald-500/20 text-emerald-500 border-emerald-500/40" };
  if (points >= 50) return { label: "متفاعل", color: "bg-blue-500/20 text-blue-400 border-blue-500/40" };
  return { label: "مبتدئ", color: "bg-muted text-muted-foreground border-border" };
}

export async function fetchTopContributors(limit = 6) {
  const { data } = await db
    .from("profiles")
    .select("user_id, full_name, avatar_url, points")
    .order("points", { ascending: false })
    .limit(limit);
  return (data ?? []) as { user_id: string; full_name: string | null; avatar_url: string | null; points: number }[];
}

// ================= Notifications =================

export interface ForumNotification {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export async function fetchNotifications(userId: string, limit = 30) {
  const { data, error } = await db
    .from("user_notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as ForumNotification[];
}

export async function fetchUnreadCount(userId: string) {
  const { count } = await db
    .from("user_notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  return count ?? 0;
}

export async function markNotificationRead(id: string) {
  await db.from("user_notifications").update({ is_read: true }).eq("id", id);
}

export async function markAllNotificationsRead(userId: string) {
  await db.from("user_notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
}

// ================= Moderator =================

export async function checkIsModerator(userId: string): Promise<boolean> {
  if (!userId) return false;
  const { data } = await db
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["moderator", "admin"]);
  return !!(data && data.length);
}

export async function moderateTopic(topicId: string, patch: Partial<{
  is_pinned: boolean; is_locked: boolean; is_featured: boolean; status: string;
}>) {
  const { error } = await db.from("forum_topics").update(patch).eq("id", topicId);
  if (error) throw error;
}

export async function deleteReply(replyId: string) {
  const { error } = await db.from("forum_replies").delete().eq("id", replyId);
  if (error) throw error;
}

export async function deleteTopic(topicId: string) {
  const { error } = await db.from("forum_topics").delete().eq("id", topicId);
  if (error) throw error;
}

// ================= Reports =================

export async function createReport(params: {
  reporterId: string; topicId?: string; replyId?: string; reason: string; details?: string;
}) {
  const { error } = await db.from("forum_reports").insert({
    reporter_id: params.reporterId,
    topic_id: params.topicId ?? null,
    reply_id: params.replyId ?? null,
    reason: params.reason,
    details: params.details ?? null,
    status: "pending",
  });
  if (error) throw error;
}

export async function fetchReports(status?: string) {
  let q = db.from("forum_reports").select("*").order("created_at", { ascending: false }).limit(100);
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as any[];
}

export async function updateReport(id: string, patch: { status: string; resolution?: string; reviewedBy: string }) {
  const { error } = await db.from("forum_reports").update({
    status: patch.status,
    resolution: patch.resolution ?? null,
    reviewed_by: patch.reviewedBy,
    reviewed_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) throw error;
}

// ================= Duplicates =================

export async function findSimilarTopics(forumId: string, title: string, limit = 3) {
  if (!forumId || title.trim().length < 6) return [];
  const first = title.trim().split(/\s+/).slice(0, 3).join(" ");
  const { data } = await db
    .from("forum_topics")
    .select("id, title, forum_id, forums(slug)")
    .eq("forum_id", forumId)
    .ilike("title", `%${first}%`)
    .limit(limit);
  return (data ?? []).map((r: any) => ({ id: r.id, title: r.title, forum_slug: r.forums?.slug }));
}

// ================= Related =================

export async function fetchRelatedTopics(forumId: string, excludeId: string, limit = 5) {
  const { data } = await db
    .from("forum_topics")
    .select("id, title, last_activity_at, replies_count, forums(slug)")
    .eq("forum_id", forumId)
    .neq("id", excludeId)
    .order("last_activity_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((r: any) => ({ ...r, forum_slug: r.forums?.slug }));
}
/* ---------------- Tag landing pages (SEO) ---------------- */

export async function fetchTagBySlug(slug: string) {
  const { data } = await db.from("forum_tags").select("*").eq("slug", slug).maybeSingle();
  return (data as ForumTag) ?? null;
}

export async function fetchTopicsByTag(tagId: string, limit = 30) {
  const { data } = await db
    .from("forum_topic_tags")
    .select("forum_topics(id, title, excerpt, status, replies_count, score, last_activity_at, created_at, forums(slug, title))")
    .eq("tag_id", tagId)
    .limit(limit);
  return (data ?? [])
    .map((r: any) => r.forum_topics)
    .filter(Boolean)
    .map((t: any) => ({ ...t, forum_slug: t.forums?.slug, forum_title: t.forums?.title }))
    .sort((a: any, b: any) => (a.last_activity_at < b.last_activity_at ? 1 : -1));
}

export async function fetchArticlesByTag(tagName: string, limit = 10) {
  const { data } = await db
    .from("knowledge_articles")
    .select("id, title, excerpt, created_at, tags, status")
    .eq("status", "published")
    .contains("tags", [tagName])
    .limit(limit);
  return (data ?? []) as any[];
}
