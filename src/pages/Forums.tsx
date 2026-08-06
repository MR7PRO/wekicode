import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetchCategoriesWithForums, relativeArabic } from "@/lib/forum/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Hash, Plus } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { SEOHead } from "@/components/seo/SEOHead";
import { breadcrumbLd } from "@/lib/seo";

export default function Forums() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["forums-directory"],
    queryFn: fetchCategoriesWithForums,
  });

  return (
    <>
      <SEOHead
        title="منتديات WekiCode — مجتمع المبرمجين والفريلانسرز"
        description="دليل منتديات WekiCode: برمجة، ذكاء اصطناعي، عمل حر، مسار مهني، ومكتبة معرفية بالعربية للمبرمجين والفريلانسرز."
        path="/forums"
        jsonLd={breadcrumbLd([
          { name: "الرئيسية", path: "/" },
          { name: "المنتديات", path: "/forums" },
        ])}
      />
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16" dir="rtl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-black">دليل المنتديات</h1>
            <p className="text-sm text-muted-foreground">استكشف كل الأقسام والمنتديات في WekiCode</p>
          </div>
          <Link to="/forums/new">
            <Button variant="hero" className="gap-1"><Plus className="w-4 h-4" /> موضوع جديد</Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
        ) : isError ? (
          <Card className="p-6 text-center">
            فشل التحميل <Button size="sm" variant="outline" onClick={() => refetch()}>إعادة</Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {data!.categories.map((c) => {
              const forums = data!.forums.filter((f) => f.category_id === c.id);
              return (
                <section key={c.id}>
                  <h2 className="text-lg font-bold mb-2">{c.title}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {forums.map((f) => (
                      <Link key={f.id} to={`/forums/${f.slug}`}>
                        <Card className="p-4 hover:border-primary/40 transition-all h-full">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                              <Hash className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-sm">{f.title}</h3>
                                {f.is_new && <Badge className="text-[9px] px-1 py-0 bg-emerald-500/20 text-emerald-500 border-emerald-500/30">جديد</Badge>}
                              </div>
                              {f.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{f.description}</p>}
                              <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                                <span>{f.topics_count} مواضيع</span>
                                <span>{f.replies_count} ردود</span>
                                {f.latest && <span>· آخر نشاط {relativeArabic(f.latest.last_activity_at)}</span>}
                              </div>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}