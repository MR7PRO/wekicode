import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, Code2, Atom, Server, Database, Container, Layout,
  Sparkles, MessagesSquare, LineChart, Workflow, Rocket,
  DollarSign, Users, Globe, FileText, Briefcase, IdCard,
  MessageCircle, GraduationCap, MonitorSmartphone, BookOpen,
  Map, Wrench, Boxes, Hash, Presentation, Trophy, Megaphone,
  Lightbulb, Eye, MessageSquare, TrendingUp, ArrowLeft, ArrowRight,
  HelpCircle, PenSquare, Compass, Play, Flame, CircleDot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import {
  FORUM_GROUPS, DISCUSSIONS, TRENDING_TAGS, LEARNING_PATHS,
  TOP_CONTRIBUTORS, COMMUNITY_STATS, type ForumItem, type DiscussionItem,
} from "./forumData";

const ICONS: Record<string, any> = {
  Code2, Atom, Server, Database, Container, Layout, Sparkles, MessagesSquare,
  LineChart, Workflow, Rocket, DollarSign, Users, Globe, FileText, Briefcase,
  IdCard, MessageCircle, GraduationCap, MonitorSmartphone, BookOpen, Map,
  Wrench, Boxes, Hash, Presentation, Trophy, Megaphone, Lightbulb,
};

const CATEGORIES = [
  { id: "all", label: "الكل" },
  { id: "برمجة", label: "برمجة" },
  { id: "فريلانس", label: "فريلانس" },
  { id: "ذكاء اصطناعي", label: "ذكاء اصطناعي" },
  { id: "وظائف", label: "وظائف" },
  { id: "مقالات", label: "مقالات" },
  { id: "مجتمع", label: "مجتمع" },
];

const CAT_TO_KEY: Record<string, ForumItem["category"] | null> = {
  "برمجة": "programming",
  "فريلانس": "freelancing",
  "ذكاء اصطناعي": "ai",
  "وظائف": "career",
  "مقالات": "library",
  "مجتمع": "community",
};

const STATUS_COLOR: Record<DiscussionItem["status"], string> = {
  "تم الحل": "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  "نقاش مفتوح": "bg-blue-500/15 text-blue-500 border-blue-500/30",
  "مقال": "bg-purple-500/15 text-purple-500 border-purple-500/30",
  "فرصة": "bg-amber-500/15 text-amber-500 border-amber-500/30",
  "بحاجة لإجابة": "bg-rose-500/15 text-rose-500 border-rose-500/30",
};

const TYPE_COLOR: Record<ForumItem["latest"]["type"], string> = {
  "سؤال": "bg-blue-500/15 text-blue-400 border-blue-500/30",
  "مقال": "bg-purple-500/15 text-purple-400 border-purple-500/30",
  "نقاش": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "فرصة": "bg-amber-500/15 text-amber-400 border-amber-500/30",
};

function ForumRow({ forum }: { forum: ForumItem }) {
  const Icon = ICONS[forum.icon] ?? Hash;
  return (
    <div className="group grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto_minmax(280px,340px)] gap-4 p-4 rounded-xl border border-border/50 bg-card/40 hover:bg-card/70 hover:border-primary/40 transition-all">
      {/* Right (title/desc) */}
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-11 h-11 shrink-0 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Link to={forum.href} className="font-bold text-foreground group-hover:text-primary transition-colors truncate">
              {forum.title}
            </Link>
            {forum.isNew && (
              <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30 text-[10px] px-1.5 py-0">جديد</Badge>
            )}
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Eye className="w-3 h-3" /> المشاهدين {forum.viewers}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{forum.description}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {forum.tags.map((t) => (
              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground border border-border/50">
                #{t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Middle counts */}
      <div className="flex lg:flex-col items-center lg:items-end justify-between gap-2 lg:gap-1 text-xs lg:min-w-[90px] border-t lg:border-t-0 lg:border-r border-border/40 pt-2 lg:pt-0 lg:pr-4">
        <div className="flex flex-col items-center lg:items-end">
          <span className="font-bold text-foreground">{forum.topicsCount}</span>
          <span className="text-muted-foreground text-[10px]">المواضيع</span>
        </div>
        <div className="flex flex-col items-center lg:items-end">
          <span className="font-bold text-foreground">{forum.postsCount}</span>
          <span className="text-muted-foreground text-[10px]">المشاركات</span>
        </div>
      </div>

      {/* Left (latest activity) */}
      <div className="flex items-start gap-2 border-t lg:border-t-0 lg:border-r border-border/40 pt-3 lg:pt-0 lg:pr-4">
        <Avatar className="w-9 h-9 shrink-0">
          <AvatarImage src={forum.latest.avatarUrl} />
          <AvatarFallback className="text-[10px]">{forum.latest.authorName[0]}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Badge variant="outline" className={`text-[9px] px-1 py-0 h-4 ${TYPE_COLOR[forum.latest.type]}`}>
              {forum.latest.type}
            </Badge>
          </div>
          <Link to={forum.href} className="block text-xs font-medium text-foreground hover:text-primary line-clamp-1">
            {forum.latest.title}
          </Link>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
            <span className="text-primary">{forum.latest.authorHandle}</span>
            <span>·</span>
            <span>{forum.latest.relativeTime}</span>
          </div>
          <div className="text-[10px] text-muted-foreground/70">{forum.latest.exactTime}</div>
        </div>
      </div>
    </div>
  );
}

function DiscussionRow({ d }: { d: DiscussionItem }) {
  return (
    <div className="grid grid-cols-[auto_1fr] lg:grid-cols-[auto_1fr_auto] gap-3 p-3 rounded-lg border border-border/50 bg-card/30 hover:bg-card/60 hover:border-primary/40 transition-all">
      {/* Stats column */}
      <div className="flex lg:flex-col items-center gap-2 lg:gap-1 text-[11px] text-muted-foreground min-w-[54px]">
        <div className="flex flex-col items-center px-2 py-1 rounded bg-muted/40 border border-border/40">
          <span className="font-bold text-foreground">{d.score}</span>
          <span className="text-[9px]">نقاط</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-bold text-foreground">{d.replies}</span>
          <span className="text-[9px]">ردود</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-bold text-foreground">{d.views}</span>
          <span className="text-[9px]">مشاهدة</span>
        </div>
      </div>

      {/* Main */}
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${STATUS_COLOR[d.status]}`}>
            {d.status}
          </Badge>
          <span className="text-[10px] text-muted-foreground">· {d.category}</span>
        </div>
        <Link to={d.href} className="font-semibold text-sm text-foreground hover:text-primary line-clamp-1">
          {d.title}
        </Link>
        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{d.excerpt}</p>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {d.tags.map((t) => (
            <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground border border-border/40">
              #{t}
            </span>
          ))}
        </div>
      </div>

      {/* Author/time */}
      <div className="hidden lg:flex items-start gap-2 min-w-[180px] border-r border-border/40 pr-3">
        <Avatar className="w-8 h-8">
          <AvatarImage src={d.avatarUrl} />
          <AvatarFallback className="text-[10px]">{d.authorName[0]}</AvatarFallback>
        </Avatar>
        <div className="text-[10px]">
          <div className="font-medium text-foreground">{d.authorName}</div>
          <div className="text-primary">{d.authorHandle}</div>
          <div className="text-muted-foreground mt-0.5">أنشئ: {d.createdAtLabel}</div>
          <div className="text-muted-foreground/70">آخر نشاط: {d.lastActivityLabel}</div>
        </div>
      </div>
    </div>
  );
}

const SORT_TABS = ["الأحدث", "النشط", "الأكثر إجابة", "غير محلول", "فريلانس", "برمجة", "ذكاء اصطناعي"];

export function AuthenticatedForumHome() {
  const { profile } = useAuth();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [sort, setSort] = useState<string>("الأحدث");
  const [page, setPage] = useState(1);

  const q = query.trim().toLowerCase();

  const filteredGroups = useMemo(() => {
    const catKey = cat === "all" ? null : CAT_TO_KEY[cat];
    return FORUM_GROUPS.map((g) => ({
      ...g,
      forums: g.forums.filter((f) => {
        if (catKey && f.category !== catKey) return false;
        if (!q) return true;
        return (
          f.title.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q) ||
          f.tags.some((t) => t.toLowerCase().includes(q)) ||
          f.latest.authorHandle.toLowerCase().includes(q)
        );
      }),
    })).filter((g) => g.forums.length > 0);
  }, [q, cat]);

  const filteredDiscussions = useMemo(() => {
    let list = DISCUSSIONS.filter((d) => {
      if (cat !== "all" && d.category !== cat) return false;
      if (!q) return true;
      return (
        d.title.toLowerCase().includes(q) ||
        d.excerpt.toLowerCase().includes(q) ||
        d.tags.some((t) => t.toLowerCase().includes(q)) ||
        d.authorHandle.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q)
      );
    });
    if (sort === "الأكثر إجابة") list = [...list].sort((a, b) => b.replies - a.replies);
    if (sort === "غير محلول") list = list.filter((d) => d.status !== "تم الحل");
    if (sort === "فريلانس") list = list.filter((d) => d.category === "فريلانس");
    if (sort === "برمجة") list = list.filter((d) => d.category === "برمجة");
    if (sort === "ذكاء اصطناعي") list = list.filter((d) => d.category === "ذكاء اصطناعي");
    return list;
  }, [q, cat, sort]);

  const greeting = profile?.full_name ? `أهلًا ${profile.full_name}` : "أهلًا بك";

  return (
    <div className="container mx-auto px-3 sm:px-4 pt-24 pb-16" dir="rtl">
      {/* Header */}
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
              placeholder="ابحث في المنتديات، الأسئلة، المقالات، الوظائف…"
              className="pr-9 h-11 bg-background/60"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link to="/questions"><Button size="sm" variant="outline" className="gap-1"><HelpCircle className="w-4 h-4" /> اطرح سؤال</Button></Link>
            <Link to="/articles"><Button size="sm" variant="outline" className="gap-1"><PenSquare className="w-4 h-4" /> اكتب مقال</Button></Link>
            <Link to="/jobs"><Button size="sm" variant="outline" className="gap-1"><Compass className="w-4 h-4" /> ابحث عن فرصة</Button></Link>
            <Link to="/courses"><Button size="sm" variant="hero" className="gap-1"><Play className="w-4 h-4" /> ابدأ كورس</Button></Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
          {[
            { label: "الأقسام", value: FORUM_GROUPS.length },
            { label: "المواضيع", value: "4.6K" },
            { label: "المشاركات", value: "38.2K" },
            { label: "الأعضاء النشطون", value: "512" },
          ].map((s) => (
            <div key={s.label} className="text-center p-2 rounded-lg border border-border/40 bg-card/30">
              <div className="text-base font-black text-primary">{s.value}</div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-1.5 flex-wrap mt-4">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => { setCat(c.id); setPage(1); }}
              className={`text-xs px-3 py-1 rounded-full border transition-all ${
                cat === c.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card/40 border-border/50 text-muted-foreground hover:border-primary/40"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
        {/* Main column */}
        <div className="space-y-6 min-w-0">
          {/* Forum directory */}
          {filteredGroups.length === 0 ? (
            <Card className="p-6 text-center text-sm text-muted-foreground">لا نتائج مطابقة.</Card>
          ) : (
            filteredGroups.map((g) => (
              <section key={g.id}>
                <div className="flex items-center justify-between mb-2 px-1">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{g.title}</h2>
                    <p className="text-xs text-muted-foreground">{g.description}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                    {g.forums.length} قسم
                  </Badge>
                </div>
                <div className="space-y-2">
                  {g.forums.map((f) => <ForumRow key={f.id} forum={f} />)}
                </div>
              </section>
            ))
          )}

          {/* Latest discussions */}
          <section>
            <div className="flex items-center justify-between mb-2 px-1">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" /> أحدث النقاشات
              </h2>
              <span className="text-[10px] text-muted-foreground">{filteredDiscussions.length} نتيجة</span>
            </div>
            <Tabs value={sort} onValueChange={setSort} className="mb-3">
              <TabsList className="flex flex-wrap h-auto bg-card/40 gap-1">
                {SORT_TABS.map((t) => (
                  <TabsTrigger key={t} value={t} className="text-xs">{t}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="space-y-2">
              {filteredDiscussions.length === 0 ? (
                <Card className="p-6 text-center text-sm text-muted-foreground">لا نقاشات مطابقة.</Card>
              ) : filteredDiscussions.map((d) => <DiscussionRow key={d.id} d={d} />)}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-1 mt-4">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} className="gap-1">
                <ArrowRight className="w-3 h-3" /> السابق
              </Button>
              {[1, 2, 3].map((n) => (
                <Button key={n} variant={page === n ? "default" : "outline"} size="sm" onClick={() => setPage(n)} className="w-9">
                  {n}
                </Button>
              ))}
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(3, p + 1))} className="gap-1">
                التالي <ArrowLeft className="w-3 h-3" />
              </Button>
            </div>
          </section>
        </div>

        {/* Sidebar */}
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
            <div className="flex flex-wrap gap-1.5">
              {TRENDING_TAGS.map((t) => (
                <button
                  key={t}
                  onClick={() => { setQuery(t); setPage(1); }}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-card/60 border border-border/50 hover:border-primary/50 hover:text-primary transition-colors"
                >
                  #{t}
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-4 border-border/50">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-primary" /> إحصائيات المجتمع</h3>
            <div className="grid grid-cols-2 gap-2">
              {COMMUNITY_STATS.map((s) => (
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