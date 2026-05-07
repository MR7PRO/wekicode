import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  HelpCircle,
  FileText,
  Briefcase,
  BookOpen,
  Users,
  Trophy,
  ArrowLeft,
  MessageSquare,
  Eye,
  Star,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

interface QuestionRow {
  id: string;
  title: string;
  votes: number | null;
  answers_count: number | null;
  views: number | null;
  tags: string[] | null;
}
interface ArticleRow {
  id: string;
  title: string;
  views: number | null;
  votes: number | null;
  tags: string[] | null;
}
interface JobRow {
  id: string;
  title: string;
  company: string | null;
  job_type: string;
  budget_min: number | null;
  budget_max: number | null;
}
interface CourseRow {
  id: string;
  title: string;
  instructor: string;
  level: string;
  is_free: boolean | null;
  price: number | null;
  rating: number | null;
  image_url: string | null;
}
interface DevRow {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  level: number | null;
  points: number | null;
}

function getInitials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

function SectionHeader({
  to,
  icon: Icon,
  title,
  subtitle,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-end justify-between gap-3 mb-4">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
          <Icon className="w-4 h-4 text-primary-foreground" />
        </div>
        <div>
          <h3 className="text-base md:text-lg font-bold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <Link
        to={to}
        className="text-xs md:text-sm text-primary hover:underline flex items-center gap-1 shrink-0"
      >
        عرض الكل
        <ArrowLeft className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function PlatformHighlights() {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [developers, setDevelopers] = useState<DevRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [q, a, j, c, d] = await Promise.all([
        supabase.from("questions").select("id,title,votes,answers_count,views,tags").order("created_at", { ascending: false }).limit(4),
        supabase.from("articles").select("id,title,views,votes,tags").order("created_at", { ascending: false }).limit(4),
        supabase.from("jobs").select("id,title,company,job_type,budget_min,budget_max").eq("status", "open").order("created_at", { ascending: false }).limit(4),
        supabase.from("courses").select("id,title,instructor,level,is_free,price,rating,image_url").order("created_at", { ascending: false }).limit(4),
        supabase.from("profiles").select("user_id,full_name,avatar_url,level,points").eq("is_public", true).order("points", { ascending: false }).limit(5),
      ]);
      if (cancelled) return;
      setQuestions((q.data as QuestionRow[]) ?? []);
      setArticles((a.data as ArticleRow[]) ?? []);
      setJobs((j.data as JobRow[]) ?? []);
      setCourses((c.data as CourseRow[]) ?? []);
      setDevelopers((d.data as DevRow[]) ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="py-16 px-4 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-4xl font-black mb-3 bg-gradient-primary bg-clip-text text-transparent">
            استكشف المنصة
          </h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
            نبذة سريعة من كل أقسام WekiCode للوصول الأسرع لما يهمك
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Questions */}
          <Card className="p-5">
            <SectionHeader to="/questions" icon={HelpCircle} title="أحدث الأسئلة" subtitle="ساعد المجتمع بإجاباتك" />
            <div className="space-y-3">
              {loading
                ? Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
                : questions.length === 0
                ? <p className="text-sm text-muted-foreground">لا توجد أسئلة بعد.</p>
                : questions.slice(0, 3).map((q) => (
                    <Link key={q.id} to={`/questions/${q.id}`} className="block p-3 rounded-lg border border-border/50 hover:border-primary/40 hover:bg-secondary/40 transition-all">
                      <p className="text-sm font-medium text-foreground line-clamp-1">{q.title}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{q.answers_count ?? 0}</span>
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{q.views ?? 0}</span>
                        {q.tags && q.tags.slice(0, 2).map((t) => (
                          <Badge key={t} variant="secondary" className="text-[10px] py-0 h-4">{t}</Badge>
                        ))}
                      </div>
                    </Link>
                  ))}
            </div>
          </Card>

          {/* Articles */}
          <Card className="p-5">
            <SectionHeader to="/articles" icon={FileText} title="مقالات مختارة" subtitle="معرفة من المجتمع" />
            <div className="space-y-3">
              {loading
                ? Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
                : articles.length === 0
                ? <p className="text-sm text-muted-foreground">لا توجد مقالات بعد.</p>
                : articles.slice(0, 3).map((a) => (
                    <Link key={a.id} to={`/articles/${a.id}`} className="block p-3 rounded-lg border border-border/50 hover:border-primary/40 hover:bg-secondary/40 transition-all">
                      <p className="text-sm font-medium text-foreground line-clamp-1">{a.title}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{a.views ?? 0}</span>
                        <span>▲ {a.votes ?? 0}</span>
                        {a.tags && a.tags.slice(0, 2).map((t) => (
                          <Badge key={t} variant="secondary" className="text-[10px] py-0 h-4">{t}</Badge>
                        ))}
                      </div>
                    </Link>
                  ))}
            </div>
          </Card>

          {/* Jobs */}
          <Card className="p-5">
            <SectionHeader to="/jobs" icon={Briefcase} title="فرص عمل حديثة" subtitle="ابدأ مشروعك القادم" />
            <div className="space-y-3">
              {loading
                ? Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
                : jobs.length === 0
                ? <p className="text-sm text-muted-foreground">لا توجد وظائف منشورة بعد.</p>
                : jobs.slice(0, 3).map((j) => (
                    <Link key={j.id} to="/jobs" className="block p-3 rounded-lg border border-border/50 hover:border-primary/40 hover:bg-secondary/40 transition-all">
                      <p className="text-sm font-medium text-foreground line-clamp-1">{j.title}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                        {j.company && <span>{j.company}</span>}
                        <Badge variant="outline" className="text-[10px] py-0 h-4">{j.job_type}</Badge>
                        {(j.budget_min || j.budget_max) && (
                          <span>{j.budget_min ?? 0} - {j.budget_max ?? 0} $</span>
                        )}
                      </div>
                    </Link>
                  ))}
            </div>
          </Card>

          {/* Courses */}
          <Card className="p-5">
            <SectionHeader to="/courses" icon={BookOpen} title="دورات تعليمية" subtitle="طور مهاراتك" />
            <div className="space-y-3">
              {loading
                ? Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
                : courses.length === 0
                ? <p className="text-sm text-muted-foreground">لا توجد دورات بعد.</p>
                : courses.slice(0, 3).map((c) => (
                    <Link key={c.id} to="/courses" className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:border-primary/40 hover:bg-secondary/40 transition-all">
                      {c.image_url && (
                        <img src={c.image_url} alt={c.title} className="w-12 h-12 rounded-md object-cover shrink-0" loading="lazy" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground line-clamp-1">{c.title}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{c.instructor}</span>
                          <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-current" />{Number(c.rating ?? 0).toFixed(1)}</span>
                          <Badge variant={c.is_free ? "secondary" : "outline"} className="text-[10px] py-0 h-4">
                            {c.is_free ? "مجاني" : `${c.price ?? 0} نقطة`}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
            </div>
          </Card>

          {/* Top Developers */}
          <Card className="p-5 lg:col-span-2">
            <SectionHeader to="/developers" icon={Users} title="مبرمجون متميزون" subtitle="تعرف على أبرز أعضاء المنصة" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 p-3">
                      <Skeleton className="w-14 h-14 rounded-full" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  ))
                : developers.length === 0
                ? <p className="text-sm text-muted-foreground col-span-full">لا يوجد مبرمجون عامون بعد.</p>
                : developers.map((d) => (
                    <Link key={d.user_id} to={`/u/${d.user_id}`} className="flex flex-col items-center gap-2 p-3 rounded-lg border border-border/50 hover:border-primary/40 hover:bg-secondary/40 transition-all">
                      <Avatar className="w-14 h-14 ring-2 ring-primary/20">
                        <AvatarImage src={d.avatar_url ?? undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground">{getInitials(d.full_name)}</AvatarFallback>
                      </Avatar>
                      <p className="text-xs font-medium text-foreground text-center line-clamp-1 w-full">{d.full_name ?? "مستخدم"}</p>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Trophy className="w-3 h-3 text-accent" />
                        <span>{(d.points ?? 0).toLocaleString()} نقطة</span>
                      </div>
                    </Link>
                  ))}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}