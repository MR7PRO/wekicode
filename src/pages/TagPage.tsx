import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchTagBySlug, fetchTopicsByTag, fetchArticlesByTag, relativeArabic } from "@/lib/forum/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Navbar } from "@/components/layout/Navbar";
import { SEOHead } from "@/components/seo/SEOHead";
import { breadcrumbLd } from "@/lib/seo";
import { Hash, BookOpen, CheckCircle2 } from "lucide-react";

export default function TagPage() {
  const { tagSlug = "" } = useParams();

  const tagQ = useQuery({ queryKey: ["tag", tagSlug], queryFn: () => fetchTagBySlug(tagSlug), enabled: !!tagSlug });
  const topicsQ = useQuery({
    queryKey: ["tag-topics", tagQ.data?.id],
    queryFn: () => fetchTopicsByTag(tagQ.data!.id),
    enabled: !!tagQ.data?.id,
  });
  const articlesQ = useQuery({
    queryKey: ["tag-articles", tagQ.data?.name],
    queryFn: () => fetchArticlesByTag(tagQ.data!.name),
    enabled: !!tagQ.data?.name,
  });

  const tag = tagQ.data;
  const topics = topicsQ.data ?? [];
  const articles = articlesQ.data ?? [];
  const solved = topics.filter((t: any) => t.status === "solved");
  // Thin tag pages should not be indexed.
  const thin = topics.length + articles.length < 3;

  return (
    <>
      <Navbar />
      {tag && (
        <SEOHead
          title={`#${tag.name} | مواضيع ومقالات WekiCode`}
          description={`كل المواضيع والمقالات المرتبطة بوسم ${tag.name} في WekiCode: نقاشات، حلول، ومقالات معرفية للمبرمجين العرب.`}
          path={`/tags/${tag.slug}`}
          noindex={thin}
          keywords={[tag.name, "WekiCode", "برمجة"]}
          jsonLd={breadcrumbLd([
            { name: "الرئيسية", path: "/" },
            { name: "الوسوم", path: "/forums" },
            { name: `#${tag.name}`, path: `/tags/${tag.slug}` },
          ])}
        />
      )}
      <main className="container mx-auto px-4 pt-24 pb-16" dir="rtl">
        <nav aria-label="مسار التنقل" className="text-xs text-muted-foreground mb-3">
          <Link to="/" className="hover:text-primary">الرئيسية</Link> ←{" "}
          <Link to="/forums" className="hover:text-primary">المنتديات</Link>
        </nav>

        {tagQ.isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : !tag ? (
          <Card className="p-6 text-center">الوسم غير موجود</Card>
        ) : (
          <>
            <Card className="p-5 mb-4">
              <div className="flex items-center gap-2">
                <Hash className="w-5 h-5 text-primary" />
                <h1 className="text-2xl font-black">{tag.name}</h1>
                <Badge variant="outline" className="text-[10px]">{tag.usage_count} استخدام</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                كل المواضيع والمقالات المرتبطة بوسم {tag.name} في WekiCode.
              </p>
            </Card>

            <section className="mb-6">
              <h2 className="text-lg font-bold mb-2">أحدث المواضيع</h2>
              {topicsQ.isLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : topics.length === 0 ? (
                <Card className="p-4 text-sm text-muted-foreground">لا توجد مواضيع بعد في هذا الوسم.</Card>
              ) : (
                <div className="space-y-2">
                  {topics.map((t: any) => (
                    <Card key={t.id} className="p-4 hover:border-primary/40 transition-all">
                      <Link to={`/forums/${t.forum_slug}/${t.id}`} className="font-bold text-sm hover:text-primary">
                        {t.title}
                      </Link>
                      {t.excerpt && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{t.excerpt}</p>}
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                        <Link to={`/forums/${t.forum_slug}`} className="hover:text-primary">{t.forum_title}</Link>
                        <span>{t.replies_count} ردود</span>
                        <span>· {relativeArabic(t.last_activity_at)}</span>
                        {t.status === "solved" && (
                          <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> محلول</span>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {articles.length > 0 && (
              <section className="mb-6">
                <h2 className="text-lg font-bold mb-2">مقالات مرتبطة</h2>
                <div className="space-y-2">
                  {articles.map((a: any) => (
                    <Card key={a.id} className="p-4">
                      <Link to={`/knowledge/${a.id}`} className="font-bold text-sm hover:text-primary flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-primary" /> {a.title}
                      </Link>
                      {a.excerpt && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{a.excerpt}</p>}
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {solved.length > 0 && (
              <section>
                <h2 className="text-lg font-bold mb-2">أسئلة شائعة محلولة في هذا الوسم</h2>
                <ul className="space-y-1 text-sm list-disc pr-5">
                  {solved.slice(0, 5).map((t: any) => (
                    <li key={t.id}>
                      <Link to={`/forums/${t.forum_slug}/${t.id}`} className="hover:text-primary">{t.title}</Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </main>
    </>
  );
}
