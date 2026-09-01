import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus, Store, Briefcase, FileText, ShoppingBag } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { TrustIndicators } from "@/components/trust/TrustIndicators";
import {
  fetchMyServices, fetchMyOrders, fetchMyProjects, fetchMyProposals,
} from "@/lib/marketplace/api";
import { fetchSellerLevel, fetchVerificationSummary } from "@/lib/trust/api";
import {
  SERVICE_STATUS_LABELS, ORDER_STATUS_LABELS, PROJECT_STATUS_LABELS, PROPOSAL_STATUS_LABELS,
} from "@/lib/marketplace/types";

export default function MarketplaceDashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (!loading && !user) navigate("/auth"); }, [loading, user, navigate]);
  const uid = user?.id;

  const services = useQuery({ queryKey: ["my-services", uid], queryFn: () => fetchMyServices(uid!), enabled: !!uid });
  const orders = useQuery({ queryKey: ["my-orders", uid], queryFn: () => fetchMyOrders(uid!), enabled: !!uid });
  const projects = useQuery({ queryKey: ["my-projects", uid], queryFn: () => fetchMyProjects(uid!), enabled: !!uid });
  const proposals = useQuery({ queryKey: ["my-proposals", uid], queryFn: () => fetchMyProposals(uid!), enabled: !!uid });
  const level = useQuery({ queryKey: ["trust-level", uid], queryFn: () => fetchSellerLevel(uid!), enabled: !!uid });
  const verification = useQuery({ queryKey: ["trust-verif", uid], queryFn: () => fetchVerificationSummary(uid!), enabled: !!uid });

  const Spin = () => <Loader2 className="w-5 h-5 animate-spin mx-auto my-10 text-primary" />;
  const Empty = ({ t }: { t: string }) => <p className="text-sm text-muted-foreground text-center py-10">{t}</p>;

  return (
    <PageShell title="لوحة السوق" description="إدارة خدماتك وطلباتك وعروضك في سوق WekiCode" noindex>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold">لوحة السوق</h1>
        <div className="flex gap-2">
          <Button size="sm" asChild><Link to="/marketplace/services/new"><Plus className="w-4 h-4 ml-1" />خدمة جديدة</Link></Button>
          <Button size="sm" variant="outline" asChild><Link to="/projects/new"><Briefcase className="w-4 h-4 ml-1" />طلب مشروع</Link></Button>
        </div>
      </div>

      <Card className="glass border-border/50 p-4 mb-5">
        <TrustIndicators level={level.data} verification={verification.data} />
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="ghost" asChild><Link to="/settings/verification">مركز التحقق</Link></Button>
          <Button size="sm" variant="ghost" asChild><Link to="/verification/professional">التحقق المهني</Link></Button>
        </div>
      </Card>

      <Tabs defaultValue="services">
        <TabsList className="mb-4 flex-wrap h-auto">
          <TabsTrigger value="services"><Store className="w-4 h-4 ml-1" />خدماتي</TabsTrigger>
          <TabsTrigger value="orders"><ShoppingBag className="w-4 h-4 ml-1" />طلباتي</TabsTrigger>
          <TabsTrigger value="projects"><Briefcase className="w-4 h-4 ml-1" />مشاريعي</TabsTrigger>
          <TabsTrigger value="proposals"><FileText className="w-4 h-4 ml-1" />عروضي</TabsTrigger>
        </TabsList>

        <TabsContent value="services">
          {services.isLoading ? <Spin /> : services.data?.length ? (
            <div className="space-y-2">
              {services.data.map((s) => (
                <Card key={s.id} className="glass border-border/50 p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{s.title}</p>
                    <p className="text-[11px] text-muted-foreground">{s.base_price} {s.currency} · {s.orders_count} طلب · {s.views_count} مشاهدة</p>
                    {s.moderation_note && <p className="text-[11px] text-destructive mt-1">ملاحظة المراجعة: {s.moderation_note}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary" className="text-[11px]">{SERVICE_STATUS_LABELS[s.status]}</Badge>
                    <Button size="sm" variant="outline" asChild><Link to={`/marketplace/services/${s.id}/edit`}>تعديل</Link></Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : <Empty t="لم تنشئ أي خدمة بعد." />}
        </TabsContent>

        <TabsContent value="orders">
          {orders.isLoading ? <Spin /> : orders.data?.length ? (
            <div className="space-y-2">
              {orders.data.map((o) => (
                <Link key={o.id} to={`/orders/${o.id}`} className="block">
                  <Card className="glass border-border/50 p-4 flex items-center justify-between gap-3 hover:border-primary/40 transition-colors">
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">{o.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {o.buyer_id === uid ? "أنت المشتري" : "أنت المنفّذ"} · {o.price} {o.currency}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-[11px] shrink-0">{ORDER_STATUS_LABELS[o.status]}</Badge>
                  </Card>
                </Link>
              ))}
            </div>
          ) : <Empty t="لا توجد طلبات بعد." />}
        </TabsContent>

        <TabsContent value="projects">
          {projects.isLoading ? <Spin /> : projects.data?.length ? (
            <div className="space-y-2">
              {projects.data.map((p) => (
                <Link key={p.id} to={`/projects/${p.id}`} className="block">
                  <Card className="glass border-border/50 p-4 flex items-center justify-between gap-3 hover:border-primary/40 transition-colors">
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">{p.title}</p>
                      <p className="text-[11px] text-muted-foreground">{p.proposals_count} عرض مقدَّم</p>
                    </div>
                    <Badge variant="secondary" className="text-[11px] shrink-0">{PROJECT_STATUS_LABELS[p.status]}</Badge>
                  </Card>
                </Link>
              ))}
            </div>
          ) : <Empty t="لم تنشر أي طلب مشروع بعد." />}
        </TabsContent>

        <TabsContent value="proposals">
          {proposals.isLoading ? <Spin /> : proposals.data?.length ? (
            <div className="space-y-2">
              {proposals.data.map((p) => (
                <Link key={p.id} to={`/projects/${p.project_id}`} className="block">
                  <Card className="glass border-border/50 p-4 flex items-center justify-between gap-3 hover:border-primary/40 transition-colors">
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">{p.project?.title ?? "مشروع"}</p>
                      <p className="text-[11px] text-muted-foreground">{p.proposed_price ? `${p.proposed_price} ${p.currency}` : "بدون سعر محدد"}</p>
                    </div>
                    <Badge variant="secondary" className="text-[11px] shrink-0">{PROPOSAL_STATUS_LABELS[p.status]}</Badge>
                  </Card>
                </Link>
              ))}
            </div>
          ) : <Empty t="لم تقدّم أي عرض بعد." />}
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
