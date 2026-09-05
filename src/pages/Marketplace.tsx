import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2, Store, Briefcase, Users, Sparkles, ShieldCheck } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { SEOHead } from "@/components/seo/SEOHead";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ServiceCard, FreelancerCard, ProjectCard } from "@/components/marketplace/MarketplaceCards";
import { fetchServices, fetchFreelancers, fetchProjects, fetchCategories } from "@/lib/marketplace/api";
import type { ServiceFilters } from "@/lib/marketplace/types";

export default function Marketplace() {
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [sort, setSort] = useState<ServiceFilters["sort"]>("rating");

  const categories = useQuery({ queryKey: ["mp-categories"], queryFn: fetchCategories });
  const services = useQuery({
    queryKey: ["mp-services", q, categoryId, sort],
    queryFn: () => fetchServices({ q: q || undefined, categoryId, sort }),
  });
  const freelancers = useQuery({ queryKey: ["mp-freelancers", q], queryFn: () => fetchFreelancers({ q: q || undefined }) });
  const projects = useQuery({ queryKey: ["mp-projects", q], queryFn: () => fetchProjects({ q: q || undefined }) });

  const Empty = ({ text }: { text: string }) => (
    <p className="text-sm text-muted-foreground text-center py-12">{text}</p>
  );

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <SEOHead
        title="سوق WekiCode للمبرمجين والفريلانسرز"
        description="اعثر على مطور، اطلب خدمة برمجية، أو اعرض مهارتك داخل مجتمع تقني عربي موثوق مبني على المساهمة والسمعة."
        path="/marketplace"
        keywords={["فريلانس", "مبرمجين", "خدمات برمجية", "مطور", "WekiCode"]}
      />
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Hero */}
          <section className="glass border border-border/50 rounded-2xl p-6 mb-6">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">سوق WekiCode للمبرمجين والفريلانسرز</h1>
            <p className="text-sm text-muted-foreground mb-4">
              اعثر على مطور، اطلب خدمة، أو اعرض مهارتك داخل مجتمع تقني موثوق.
            </p>
            <div className="relative mb-4">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} className="pr-10"
                placeholder="ابحث عن خدمة، مهارة، مطور، أو مشروع…" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" asChild><Link to="/marketplace/services/new"><Store className="w-4 h-4 ml-1" />اعرض خدمتك</Link></Button>
              <Button size="sm" variant="outline" asChild><Link to="/marketplace/projects/new"><Briefcase className="w-4 h-4 ml-1" />اطلب مشروع</Link></Button>
              <Button size="sm" variant="ghost" asChild><Link to="/marketplace/projects"><Briefcase className="w-4 h-4 ml-1" />المشاريع</Link></Button>
              <Button size="sm" variant="ghost" asChild><Link to="/marketplace?tab=freelancers"><Users className="w-4 h-4 ml-1" />تصفح المستقلين</Link></Button>
            </div>
          </section>

          {/* Categories */}
          {categories.data && categories.data.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              <Button size="sm" variant={!categoryId ? "default" : "outline"} onClick={() => setCategoryId(undefined)}>الكل</Button>
              {categories.data.map((c) => (
                <Button key={c.id} size="sm" variant={categoryId === c.id ? "default" : "outline"}
                  onClick={() => setCategoryId(c.id)}>{c.title}</Button>
              ))}
            </div>
          )}

          <Tabs defaultValue="services">
            <TabsList className="mb-4">
              <TabsTrigger value="services">الخدمات</TabsTrigger>
              <TabsTrigger value="freelancers">المستقلون</TabsTrigger>
              <TabsTrigger value="projects">طلبات المشاريع</TabsTrigger>
            </TabsList>

            <TabsContent value="services">
              <div className="flex flex-wrap gap-2 mb-4">
                {([
                  ["rating", "الأعلى تقييمًا"], ["newest", "الأحدث"], ["price_asc", "السعر الأقل"],
                  ["price_desc", "السعر الأعلى"], ["fastest", "الأسرع تسليمًا"], ["popular", "الأكثر طلبًا"],
                ] as const).map(([k, label]) => (
                  <Button key={k} size="sm" variant={sort === k ? "secondary" : "ghost"} onClick={() => setSort(k)}>{label}</Button>
                ))}
              </div>
              {services.isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto my-12 text-primary" />
                : services.data?.length ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {services.data.map((s) => <ServiceCard key={s.id} service={s} />)}
                  </div>
                ) : <Empty text="لا توجد خدمات منشورة بعد. كن أول من يعرض خدمته." />}
            </TabsContent>

            <TabsContent value="freelancers">
              {freelancers.isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto my-12 text-primary" />
                : freelancers.data?.length ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {freelancers.data.map((f) => <FreelancerCard key={f.user_id} seller={f} />)}
                  </div>
                ) : <Empty text="لا يوجد مستقلون مفعّلون بعد. فعّل ملفك من إعدادات السوق." />}
            </TabsContent>

            <TabsContent value="projects">
              {projects.isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto my-12 text-primary" />
                : projects.data?.length ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {projects.data.map((p) => <ProjectCard key={p.id} project={p} />)}
                  </div>
                ) : <Empty text="لا توجد طلبات مشاريع مفتوحة حاليًا." />}
            </TabsContent>
          </Tabs>

          {/* Trust */}
          <Card className="glass border-border/50 p-5 mt-8">
            <h2 className="font-bold mb-3 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500" />كيف تُبنى الثقة هنا</h2>
            <ul className="text-[13px] text-muted-foreground space-y-1.5 list-disc pr-5">
              <li>السمعة تأتي من المساهمة الحقيقية: الحلول، المقالات، والإجابات داخل المجتمع.</li>
              <li>التقييمات لا تُكتب إلا بعد اكتمال طلب فعلي بين الطرفين.</li>
              <li>الخدمات تمر بمراجعة قبل النشر لمنع الإعلانات العشوائية.</li>
              <li>الدفع الإلكتروني غير مفعّل حاليًا، والاتفاق يتم مباشرة بين الطرفين مع توثيق الطلب داخل المنصة.</li>
            </ul>
            <p className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> WekiCode لا يدير الدفع أو الضمان المالي في هذه المرحلة.
            </p>
          </Card>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}