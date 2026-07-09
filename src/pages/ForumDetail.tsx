import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchForumBySlug, fetchTopicsForForum, relativeArabic } from "@/lib/forum/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Plus, ArrowLeft, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";

const SORTS = ["الأحدث", "النشط", "الأكثر ردودًا", "غير محلول", "المثبت"];

export default function ForumDetail() {
  const { forumSlug = "" } = useParams();
  const [sort, setSort] = useState("الأحدث");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const forumQ = useQuery({ queryKey: ["forum", forumSlug], queryFn: () => fetchForumBySlug(forumSlug), enabled: !!forumSlug });
  const topicsQ = useQuery({
    queryKey: ["forum-topics", forumQ.data?.id, sort, search, page],
    queryFn: () => fetchTopicsForForum(forumQ.data!.id, { sort, search, page }),
    enabled: !!forumQ.data?.id,
  });

  const totalPages = Math.max(1, Math.ceil((topicsQ.data?.total ?? 0) / 20));

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16" dir="rtl">
        {forumQ.isLoading ? <Skeleton className="h-20 w-full mb-4" /> : !forumQ.data ? (
          <Card className="p-6 text-center">المنتدى غير موجود</Card>
        ) : (
          <>
            <Card className="p-5 mb-4">
              <div className="text-xs text-muted-foreground mb-1"><Link to="/forums" className="hover:text-primary">المنتديات</Link></div>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h1 className="text-2xl font-black">{forumQ.data.title}</h1>
                  {forumQ.data.description && <p className="text-sm text-muted-foreground">{forumQ.data.description}</p>}
                </div>
                <Link to={`/forums/new?forum=${forumQ.data.id}`}>
                  <Button variant="hero" className="gap-1"><Plus className="w-4 h-4" /> موضوع جديد</Button>
                </Link>
              </div>
            </Card>

            <div className="flex gap-2 flex-wrap mb-3">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="ابحث داخل المنتدى…" className="pr-9" />
              </div>
            </div>
            <Tabs value={sort} onValueChange={(v) => { setSort(v); setPage(1); }} className="mb-3">
              <TabsList className="flex flex-wrap h-auto gap-1">
                {SORTS.map((s) => <TabsTrigger key={s} value={s} className="text-xs">{s}</TabsTrigger>)}
              </TabsList>
            </Tabs>

            {topicsQ.isLoading ? (
              <div className="space-y-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
            ) : topicsQ.isError ? (
              <Card className="p-6 text-center">فشل تحميل المواضيع <Button size="sm" variant="outline" onClick={() => topicsQ.refetch()}>إعادة</Button></Card>
            ) : (topicsQ.data?.topics.length ?? 0) === 0 ? (
              <Card className="p-8 text-center text-sm text-muted-foreground">لا مواضيع بعد — كن أول من يبدأ</Card>
            ) : (
              <div className="space-y-2">
                {topicsQ.data!.topics.map((t) => (
                  <Link key={t.id} to={`/forums/${forumSlug}/${t.id}`}>
                    <Card className="p-3 hover:border-primary/40 transition-all">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-9 h-9"><AvatarImage src={t.author_avatar || undefined} /><AvatarFallback>{t.author_name[0]}</AvatarFallback></Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {t.is_pinned && <Badge className="text-[9px] bg-amber-500/20 text-amber-500">مثبت</Badge>}
                            {t.status === "solved" && <Badge className="text-[9px] bg-emerald-500/20 text-emerald-500">تم الحل</Badge>}
                            <h3 className="font-semibold text-sm">{t.title}</h3>
                          </div>
                          {t.excerpt && <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{t.excerpt}</p>}
                          <div className="text-[10px] text-muted-foreground mt-1">
                            {t.author_name} · {relativeArabic(t.last_activity_at)} · {t.replies_count} ردود · {t.views_count} مشاهدة · {t.score} نقاط
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ArrowRight className="w-3 h-3" /></Button>
                <span className="text-xs text-muted-foreground">{page} / {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ArrowLeft className="w-3 h-3" /></Button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}