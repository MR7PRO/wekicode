import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchCategories, fetchProjects } from "@/lib/marketplace/api";
import { PROJECT_STATUS_LABELS, type MarketplaceCategory, type ProjectRequest } from "@/lib/marketplace/types";
import { Briefcase, Plus, Search, Users } from "lucide-react";

export default function Projects() {
  const [projects, setProjects] = useState<ProjectRequest[]>([]);
  const [categories, setCategories] = useState<MarketplaceCategory[]>([]);
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchProjects({ q: q.trim() || undefined, categoryId })
      .then(setProjects)
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, [q, categoryId]);

  const budget = (p: ProjectRequest) => {
    if (p.budget_min && p.budget_max) return `${p.budget_min} - ${p.budget_max} ${p.currency}`;
    if (p.budget_max) return `حتى ${p.budget_max} ${p.currency}`;
    if (p.budget_min) return `من ${p.budget_min} ${p.currency}`;
    return "الميزانية غير محددة";
  };

  return (
    <PageShell
      title="مشاريع العمل الحر | WekiCode"
      description="تصفّح مشاريع العملاء المطروحة في سوق WekiCode وقدّم عرضك المهني."
      path="/marketplace/projects"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-primary" /> المشاريع المطروحة
        </h1>
        <Button asChild size="sm">
          <Link to="/marketplace/projects/new"><Plus className="w-4 h-4 ml-1" /> انشر مشروعًا</Link>
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pr-9" placeholder="ابحث عن مشروع..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Button size="sm" variant={!categoryId ? "default" : "outline"} onClick={() => setCategoryId(undefined)}>الكل</Button>
        {categories.map((c) => (
          <Button key={c.id} size="sm" variant={categoryId === c.id ? "default" : "outline"} onClick={() => setCategoryId(c.id)}>
            {c.name_ar ?? c.name}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 w-full" />)}</div>
      ) : projects.length === 0 ? (
        <Card><CardContent className="pt-6 text-sm text-muted-foreground">
          لا توجد مشاريع مطابقة حاليًا. كن أول من <Link className="text-primary underline" to="/marketplace/projects/new">ينشر مشروعًا</Link>.
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => (
            <Link key={p.id} to={`/marketplace/projects/${p.id}`}>
              <Card className="hover:border-primary/50 transition-colors">
                <CardContent className="pt-5">
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                    <h2 className="font-semibold">{p.title}</h2>
                    <Badge variant="secondary">{PROJECT_STATUS_LABELS[p.status] ?? p.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{p.description}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{budget(p)}</span>
                    <span className="inline-flex items-center gap-1"><Users className="w-3 h-3" /> {p.proposals_count} عرض</span>
                    <span>{new Date(p.created_at).toLocaleDateString("ar")}</span>
                  </div>
                  {p.skills_required?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {p.skills_required.slice(0, 6).map((s) => (
                        <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
