import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, Sparkles, Hash, Eye, MessageSquare, TrendingUp,
  ArrowLeft, ArrowRight, HelpCircle, PenSquare, Compass, Play,
  Flame, CircleDot, Loader2, Trophy, Map, AlertTriangle,
  Code2, Atom, Server, Database, Container, Layout, MessagesSquare,
  LineChart, Workflow, Rocket, DollarSign, Users, Globe, FileText,
  Briefcase, IdCard, MessageCircle, GraduationCap, MonitorSmartphone,
  BookOpen, Wrench, Boxes, Presentation, Megaphone, Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import {
  fetchCategoriesWithForums, fetchLatestTopics, fetchTrendingTags,
  fetchCommunityStats, relativeArabic, exactArabic,
  type ForumWithStats, type TopicWithAuthor,
} from "@/lib/forum/api";
import { LEARNING_PATHS, TOP_CONTRIBUTORS } from "./forumData";

const ICONS: Record<string, any> = {
  Code2, Atom, Server, Database, Container, Layout, Sparkles, MessagesSquare,
  LineChart, Workflow, Rocket, DollarSign, Users, Globe, FileText, Briefcase,
  IdCard, MessageCircle, GraduationCap, MonitorSmartphone, BookOpen, Map,
  Wrench, Boxes, Hash, Presentation, Trophy, Megaphone, Lightbulb,
};

const TYPE_LABEL: Record<string, string> = {
  question: "سؤال", article: "مقال", discussion: "نقاش",
  job: "فرصة", showcase: "مشروع", announcement: "إعلان",
};
const STATUS_LABEL: Record<string, string> = {
  solved: "تم الحل", open: "نقاش مفتوح", unanswered: "بحاجة لإجابة",
  pinned: "مثبت", closed: "مغلق",
};

const TYPE_COLOR: Record<string, string> = {
  question: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  article: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  discussion: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  job: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  showcase: "bg-pink-500/15 text-pink-400 border-pink-500/30",
  announcement: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
};
const STATUS_COLOR: Record<string, string> = {
  solved: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  open: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  unanswered: "bg-rose-500/15 text-rose-500 border-rose-500/30",
  pinned: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  closed: "bg-muted text-muted-foreground border-border",
};

function ForumRow({ forum }: { forum: ForumWithStats }) {
  const Icon = ICONS[forum.icon || "Hash"] ?? Hash;
  return (
    <div className="group grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto_minmax(280px,340px)] gap-4 p-4 rounded-xl border border-border/50 bg-card/40 hover:bg-card/70 hover:border-primary/40 transition-all">
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-11 h-11 shrink-0 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Link to={`/forums/${forum.slug}`} className="font-bold text-foreground group-hover:text-primary transition-colors truncate">
              {forum.title}
            </Link>
            {forum.is_new && (
              <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30 text-[10px] px-1.5 py-0">جديد</Badge>
            )}
          </div>
          {forum.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{forum.description}</p>}
        </div>
      </div>

      <div className="flex lg:flex-col items-center lg:items-end justify-between gap-2 lg:gap-1 text-xs lg:min-w-[90px] border-t lg:border-t-0 lg:border-r border-border/40 pt-2 lg:pt-0 lg:pr-4">
        <div className="flex flex-col items-center lg:items-end">
          <span className="font-bold text-foreground">{forum.topics_count}</span>
          <span className="text-muted-foreground text-[10px]">المواضيع</span>
        </div>
        <div className="flex flex-col items-center lg:items-end">
          <span className="font-bold text-foreground">{forum.replies_count}</span>
          <span className="text-muted-foreground text-[10px]">الردود</span>
        </div>
      </div>

      <div className="flex items-start gap-2 border-t lg:border-t-0 lg:border-r border-border/40 pt-3 lg:pt-0 lg:pr-4">
        {forum.latest ? (
          <>
            <Avatar className="w-9 h-9 shrink-0">
              <AvatarImage src={forum.latest.author_avatar || undefined} />
              <AvatarFallback className="text-[10px]">{forum.latest.author_name[0]}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <Badge variant="outline" className={`text-[9px] px-1 py-0 h-4 ${TYPE_COLOR[forum.latest.type] || ""}`}>
                {TYPE_LABEL[forum.latest.type] || forum.latest.type}
              </Badge>
              <Link to={`/forums/${forum.slug}/${forum.latest.id}`} className="block text-xs font-medium text-foreground hover:text-primary line-clamp-1 mt-0.5">
                {forum.latest.title}
              </Link>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                <span className="text-primary">{forum.latest.author_name}</span>
                <span>·</span>
                <span>{relativeArabic(forum.latest.last_activity_at)}</span>
              </div>
              <div className="text-[10px] text-muted-foreground/70">{exactArabic(forum.latest.last_activity_at)}</div>
            </div>
          </>
        ) : (
          <div className="text-[11px] text-muted-foreground italic">لا نشاط بعد — كن أول من يبدأ</div>
        )}
      </div>
    </div>
  );
}

function TopicRow({ t }: { t: TopicWithAuthor }) {
  return (
    <div className="grid grid-cols-[auto_1fr] lg:grid-cols-[auto_1fr_auto] gap-3 p-3 rounded-lg border border-border/50 bg-card/30 hover:bg-card/60 hover:border-primary/40 transition-all">
      <div className="flex lg:flex-col items-center gap-2 lg:gap-1 text-[11px] text-muted-foreground min-w-[54px]">
        <div className="flex flex-col items-center px-2 py-1 rounded bg-muted/40 border border-border/40">
          <span className="font-bold text-foreground">{t.score}</span>
          <span className="text-[9px]">نقاط</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-bold text-foreground">{t.replies_count}</span>
          <span className="text-[9px]">ردود</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-bold text-foreground">{t.views_count}</span>
          <span className="text-[9px]">مشاهدة</span>
        </div>
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${STATUS_COLOR[t.status] || ""}`}>
            {STATUS_LABEL[t.status] || t.status}
          </Badge>
          {t.forum_title && <span className="text-[10px] text-muted-foreground">· {t.forum_title}</span>}
        </div>
        <Link to={`/forums/${t.forum_slug}/${t.id}`} className="font-semibold text-sm text-foreground hover:text-primary line-clamp-1">
          {t.title}
        </Link>
        {t.excerpt && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{t.excerpt}</p>}
      </div>
      <div className="hidden lg:flex items-start gap-2 min-w-[180px] border-r border-border/40 pr-3">
        <Avatar className="w-8 h-8">
          <AvatarImage src={t.author_avatar || undefined} />
          <AvatarFallback className="text-[10px]">{t.author_name[0]}</AvatarFallback>
        </Avatar>
        <div className="text-[10px]">
          <div className="font-medium text-foreground">{t.author_name}</div>
          <div className="text-muted-foreground mt-0.5">أنشئ: {exactArabic(t.created_at)}</div>
          <div className="text-muted-foreground/70">آخر نشاط: {relativeArabic(t.last_activity_at)}</div>
        </div>
      </div>
    </div>
  );
}

const SORT_TABS = ["الأحدث", "النشط", "الأكثر ردودًا", "غير محلول"];

export function AuthenticatedForumHome() {
  const { profile } = useAuth();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("الأحدث");
  const [page, setPage] = useState(1);

  const dir = useQuery({ queryKey: ["forums-directory"], queryFn: fetchCategoriesWithForums });
  const latest = useQuery({ queryKey: ["forums-latest", 12], queryFn: () => fetchLatestTopics(12) });
  const tags = useQuery({ queryKey: ["forums-tags"], queryFn: () => fetchTrendingTags(14) });
  const stats = useQuery({ queryKey: ["forums-stats"], queryFn: fetchCommunityStats });

  const q = query.trim().toLowerCase();

  const grouped = useMemo(() => {
    if (!dir.data) return [];
    return dir.data.categories.map((c) => ({
      ...c,
      forums: dir.data.forums
        .filter((f) => f.category_id === c.id)
        .filter((f) =>
          !q ? true : f.title.toLowerCase().includes(q) || (f.description || "").toLowerCase().includes(q)
        ),
    })).filter((g) => g.forums.length > 0);
  }, [dir.data, q]);

  const feed = useMemo(() => {
    let list = latest.data ?? [];
    if (q) list = list.filter((t) => t.title.toLowerCase().includes(q) || (t.excerpt || "").toLowerCase().includes(q));
    if (sort === "الأكثر ردودًا") list = [...list].sort((a, b) => b.replies_count - a.replies_count);
    if (sort === "غير محلول") list = list.filter((t) => t.status !== "solved");
    return list;
  }, [latest.data, q, sort]);

  const greeting = profile?.full_name ? `أهلًا ${profile.full_name}` : "أهلًا بك";

  return (
    <div className="container mx-auto px-3 sm:px-4 pt-24 pb-16" dir="rtl">
      <Card className="glass border-border/50 p-5 md:p-6 mb-6 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <CircleDot className="w-3 h-3 text-emerald-500" /> {greeting}
        </div>
        <h1 className="text-2xl md:text-3xl font-black leading-tight bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent">
          موسوعة WekiCode للمبرمجين والفريلانسرز
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          منتديات، نقاشات، أسئلة، مقالات، فرص، أدوات، ومسارات تعلم — كل شيء منظم وقابل للبحث.
        </p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder="ابحث في المنتديات والنقاشات…"
              className="pr-9 h-11 bg-background/60"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link to="/forums/new?type=question"><Button size="sm" variant="outline" className="gap-1"><HelpCircle className="w-4 h-4" /> اطرح سؤال</Button></Link>
            <Link to="/forums/new?type=article"><Button size="sm" variant="outline" className="gap-1"><PenSquare className="w-4 h-4" /> اكتب مقال</Button></Link>
            <Link to="/forums/new?type=showcase"><Button size="sm" variant="outline" className="gap-1"><Compass className="w-4 h-4" /> اعرض مشروعك</Button></Link>
            <Link to="/courses"><Button size="sm" variant="hero" className="gap-1"><Play className="w-4 h-4" /> ابدأ كورس</Button></Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
          {[
            { label: "الأقسام", value: stats.data?.categories ?? "—" },
            { label: "المنتديات", value: stats.data?.forums ?? "—" },
            { label: "المواضيع", value: stats.data?.topics ?? "—" },
            { label: "الردود", value: stats.data?.replies ?? "—" },
          ].map((s) => (
            <div key={s.label} className="text-center p-2 rounded-lg border border-border/40 bg-card/30">
              <div className="text-base font-black text-primary">{s.value}</div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
        <div className="space-y-6 min-w-0">
          {dir.isLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
          ) : dir.isError ? (
            <Card className="p-6 text-center text-sm text-destructive space-y-2">
              <AlertTriangle className="w-6 h-6 mx-auto" /> فشل تحميل المنتديات
              <Button size="sm" variant="outline" onClick={() => dir.refetch()}>إعادة المحاولة</Button>
            </Card>
          ) : grouped.length === 0 ? (
            <Card className="p-6 text-center text-sm text-muted-foreground">لا نتائج مطابقة.</Card>
          ) : grouped.map((g) => (
            <section key={g.id}>
              <div className="flex items-center justify-between mb-2 px-1">
                <div>
                  <h2 className="text-lg font-bold text-foreground">{g.title}</h2>
                  {g.description && <p className="text-xs text-muted-foreground">{g.description}</p>}
                </div>
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                  {g.forums.length} قسم
                </Badge>
              </div>
              <div className="space-y-2">
                {g.forums.map((f) => <ForumRow key={f.id} forum={f} />)}
              </div>
            </section>
          ))}

          <section>
            <div className="flex items-center justify-between mb-2 px-1">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" /> أحدث النقاشات
              </h2>
              <span className="text-[10px] text-muted-foreground">{feed.length} نتيجة</span>
            </div>
            <Tabs value={sort} onValueChange={setSort} className="mb-3">
              <TabsList className="flex flex-wrap h-auto bg-card/40 gap-1">
                {SORT_TABS.map((t) => <TabsTrigger key={t} value={t} className="text-xs">{t}</TabsTrigger>)}
              </TabsList>
            </Tabs>
            {latest.isLoading ? (
              <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
            ) : latest.isError ? (
              <Card className="p-6 text-center text-sm text-destructive">
                فشل تحميل النقاشات
                <Button size="sm" variant="outline" className="mr-2" onClick={() => latest.refetch()}>إعادة</Button>
              </Card>
            ) : feed.length === 0 ? (
              <Card className="p-8 text-center">
                <MessagesSquare className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-3">لا نقاشات بعد — كن أول من يبدأ</p>
                <Link to="/forums/new"><Button size="sm" variant="hero">ابدأ نقاشًا</Button></Link>
              </Card>
            ) : (
              <div className="space-y-2">{feed.map((t) => <TopicRow key={t.id} t={t} />)}</div>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <Card className="p-4 border-border/50">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Map className="w-4 h-4 text-primary" /> المسارات السريعة</h3>
            <div className="space-y-2">
              {LEARNING_PATHS.map((p) => (
                <Link key={p.title} to={p.href} className="block p-2 rounded-lg border border-border/40 hover:border-primary/40 hover:bg-card/60 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">{p.title}</span>
                    <span className="text-[10px] text-primary">{p.progress}%</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">{p.desc}</div>
                  <div className="h-1 mt-1 bg-muted/40 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-l from-primary to-primary/40" style={{ width: `${p.progress}%` }} />
                  </div>
                </Link>
              ))}
            </div>
          </Card>

          <Card className="p-4 border-border/50">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> وسوم رائجة</h3>
            {tags.isLoading ? <Skeleton className="h-16 w-full" /> : (
              <div className="flex flex-wrap gap-1.5">
                {(tags.data ?? []).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setQuery(t.name); setPage(1); }}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-card/60 border border-border/50 hover:border-primary/50 hover:text-primary transition-colors"
                  >
                    #{t.name}
                  </button>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-4 border-border/50">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-primary" /> إحصائيات المجتمع</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "الأقسام", value: stats.data?.categories ?? "—" },
                { label: "المنتديات", value: stats.data?.forums ?? "—" },
                { label: "المواضيع", value: stats.data?.topics ?? "—" },
                { label: "الردود", value: stats.data?.replies ?? "—" },
              ].map((s) => (
                <div key={s.label} className="p-2 rounded-lg bg-card/40 border border-border/40 text-center">
                  <div className="text-base font-black text-primary">{s.value}</div>
                  <div className="text-[10px] text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4 border-border/50">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Trophy className="w-4 h-4 text-primary" /> أفضل المساهمين</h3>
            <div className="space-y-2">
              {TOP_CONTRIBUTORS.map((u, i) => (
                <div key={u.handle} className="flex items-center gap-2 p-2 rounded-lg hover:bg-card/60 transition-colors">
                  <div className="text-xs font-black text-primary w-4">{i + 1}</div>
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={u.avatarUrl} />
                    <AvatarFallback className="text-[10px]">{u.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold truncate">{u.name}</div>
                    <div className="text-[10px] text-muted-foreground">{u.specialty}</div>
                  </div>
                  <div className="text-[10px] text-primary font-bold">{u.points.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

export default AuthenticatedForumHome;