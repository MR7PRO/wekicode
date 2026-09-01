import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Clock, RefreshCcw, Star, ShieldAlert, ShoppingBag } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { TrustIndicators } from "@/components/trust/TrustIndicators";
import { getUserAvatarSrc } from "@/lib/media/userAvatars";
import {
  fetchServiceById, fetchServicePackages, fetchReviews, incrementServiceViews,
  createOrder, fetchActiveFeeRule, reportMarketplaceTarget,
} from "@/lib/marketplace/api";
import { fetchSellerLevel, fetchVerificationSummary } from "@/lib/trust/api";
import { isFeatureEnabled } from "@/lib/featureFlags";

export default function ServiceDetail() {
  const { idOrSlug = "" } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scope, setScope] = useState("");
  const [packageId, setPackageId] = useState<string | null>(null);
  const [ordering, setOrdering] = useState(false);
  const [reportReason, setReportReason] = useState("");

  const service = useQuery({ queryKey: ["mp-service", idOrSlug], queryFn: () => fetchServiceById(idOrSlug) });
  const sid = service.data?.id;
  const packages = useQuery({ queryKey: ["mp-packages", sid], queryFn: () => fetchServicePackages(sid!), enabled: !!sid });
  const reviews = useQuery({ queryKey: ["mp-reviews", sid], queryFn: () => fetchReviews({ serviceId: sid! }), enabled: !!sid });
  const sellerId = service.data?.seller_id;
  const level = useQuery({ queryKey: ["trust-level", sellerId], queryFn: () => fetchSellerLevel(sellerId!), enabled: !!sellerId });
  const verification = useQuery({ queryKey: ["trust-verif", sellerId], queryFn: () => fetchVerificationSummary(sellerId!), enabled: !!sellerId });
  const fee = useQuery({ queryKey: ["mp-fee"], queryFn: fetchActiveFeeRule });

  useEffect(() => { if (sid) incrementServiceViews(sid); }, [sid]);

  const selected = packages.data?.find((p) => p.id === packageId) ?? null;
  const price = selected?.price ?? service.data?.base_price ?? 0;
  const days = selected?.delivery_days ?? service.data?.delivery_days ?? 0;

  const handleOrder = async () => {
    if (!user || !service.data) { navigate("/auth"); return; }
    if (user.id === service.data.seller_id) { toast.error("لا يمكنك طلب خدمتك الخاصة"); return; }
    if (scope.trim().length < 20) { toast.error("اكتب وصفًا واضحًا لما تحتاجه (20 حرفًا على الأقل)"); return; }
    setOrdering(true);
    try {
      const pct = fee.data?.percentage ?? 0;
      const platform_fee = Number(((price * pct) / 100 + (fee.data?.fixed_fee ?? 0)).toFixed(2));
      const order = await createOrder({
        buyer_id: user.id,
        seller_id: service.data.seller_id,
        service_id: service.data.id,
        package_id: selected?.id ?? null,
        title: service.data.title,
        scope,
        price,
        currency: service.data.currency,
        platform_fee,
        seller_amount: Number((price - platform_fee).toFixed(2)),
        payment_mode: isFeatureEnabled("payments_enabled") ? "online" : "manual",
        status: "pending",
      });
      toast.success("تم إنشاء الطلب وبانتظار قبول المستقل");
      navigate(`/orders/${(order as { id: string }).id}`);
    } catch {
      toast.error("تعذر إنشاء الطلب");
    } finally { setOrdering(false); }
  };

  const submitReport = async () => {
    if (!user || !service.data) { navigate("/auth"); return; }
    if (reportReason.trim().length < 10) { toast.error("اكتب سببًا واضحًا"); return; }
    await reportMarketplaceTarget({
      reporter_id: user.id, target_type: "service", target_id: service.data.id,
      reason: reportReason, status: "pending",
    });
    setReportReason("");
    toast.success("تم استلام البلاغ وسيراجعه الفريق");
  };

  if (service.isLoading) {
    return <PageShell title="جارٍ التحميل" description="تحميل الخدمة" noindex><Loader2 className="w-6 h-6 animate-spin mx-auto my-20 text-primary" /></PageShell>;
  }
  if (!service.data) {
    return <PageShell title="الخدمة غير موجودة" description="الخدمة غير متاحة" noindex><p className="text-center py-20 text-muted-foreground">الخدمة غير متاحة.</p></PageShell>;
  }

  const s = service.data;
  return (
    <PageShell
      title={s.title}
      description={s.short_description || s.description.slice(0, 150)}
      path={`/marketplace/services/${s.slug || s.id}`}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card className="glass border-border/50 overflow-hidden">
            <div className="h-48 bg-gradient-to-br from-primary/15 via-background to-accent/15">
              {s.cover_image_url && <img src={s.cover_image_url} alt={s.title} className="w-full h-full object-cover" />}
            </div>
            <div className="p-5">
              <h1 className="text-xl md:text-2xl font-bold mb-2">{s.title}</h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
                <span className="inline-flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-500" />
                  {s.rating_count ? `${Number(s.rating_avg).toFixed(1)} (${s.rating_count})` : "لا توجد تقييمات بعد"}</span>
                <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{s.delivery_days} يوم</span>
                <span className="inline-flex items-center gap-1"><RefreshCcw className="w-3.5 h-3.5" />{s.revisions_included} تعديل</span>
                <span className="inline-flex items-center gap-1"><ShoppingBag className="w-3.5 h-3.5" />{s.orders_count} طلب</span>
              </div>
              <p className="text-sm leading-7 whitespace-pre-wrap">{s.description}</p>
              {s.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {s.tags.map((t) => <Badge key={t} variant="secondary" className="text-[11px]">{t}</Badge>)}
                </div>
              )}
              {s.requirements && (
                <div className="mt-4 p-3 rounded-lg bg-muted/40 text-[13px]">
                  <p className="font-bold mb-1">ما يحتاجه المستقل منك</p>
                  <p className="text-muted-foreground whitespace-pre-wrap">{s.requirements}</p>
                </div>
              )}
            </div>
          </Card>

          {packages.data && packages.data.length > 0 && (
            <Card className="glass border-border/50 p-5">
              <h2 className="font-bold mb-3">الباقات</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {packages.data.map((p) => (
                  <button key={p.id} onClick={() => setPackageId(p.id)}
                    className={`text-right rounded-xl border p-3 transition-colors ${packageId === p.id ? "border-primary bg-primary/5" : "border-border/60 hover:border-primary/40"}`}>
                    <p className="font-bold text-sm">{p.title}</p>
                    <p className="text-primary font-black mt-1">{p.price} {p.currency}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">{p.delivery_days} يوم · {p.revisions} تعديل</p>
                    {p.features?.length > 0 && (
                      <ul className="text-[11px] text-muted-foreground mt-2 list-disc pr-4 space-y-0.5">
                        {p.features.slice(0, 4).map((f, i) => <li key={i}>{f}</li>)}
                      </ul>
                    )}
                  </button>
                ))}
              </div>
            </Card>
          )}

          <Card className="glass border-border/50 p-5">
            <h2 className="font-bold mb-3">التقييمات</h2>
            {reviews.data?.length ? (
              <div className="space-y-3">
                {reviews.data.map((r) => (
                  <div key={r.id} className="border-b border-border/40 pb-3 last:border-0">
                    <div className="flex items-center gap-2 mb-1">
                      <img src={r.reviewer?.avatar_url || getUserAvatarSrc(r.reviewer_id)}
                        alt="" className="w-6 h-6 rounded-full object-cover" />
                      <span className="text-sm font-bold">{r.reviewer?.full_name ?? "مستخدم"}</span>
                      <span className="text-xs text-amber-500">★ {r.rating}</span>
                    </div>
                    {r.comment && <p className="text-[13px] text-muted-foreground">{r.comment}</p>}
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">لا توجد تقييمات بعد لهذه الخدمة.</p>}
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="glass border-border/50 p-5">
            <p className="text-sm text-muted-foreground">يبدأ من</p>
            <p className="text-2xl font-black text-primary mb-1">{price} {s.currency}</p>
            <p className="text-xs text-muted-foreground mb-4">التسليم خلال {days} يوم</p>
            <Textarea rows={4} value={scope} onChange={(e) => setScope(e.target.value)}
              placeholder="اشرح ما تحتاجه بالتفصيل…" className="mb-3" />
            <Button className="w-full" disabled={ordering} onClick={handleOrder}>
              {ordering && <Loader2 className="w-4 h-4 animate-spin ml-2" />}اطلب الخدمة
            </Button>
            <p className="text-[11px] text-muted-foreground mt-2">
              {isFeatureEnabled("payments_enabled")
                ? "يتم الدفع عبر مزوّد الدفع بعد قبول المستقل."
                : "الدفع الإلكتروني غير مفعّل حاليًا، ويتم الاتفاق مباشرة بين الطرفين مع توثيق الطلب داخل المنصة."}
            </p>
          </Card>

          {s.seller && (
            <Card className="glass border-border/50 p-5">
              <Link to={`/u/${s.seller.user_id}`} className="flex items-center gap-3 mb-3">
                <img src={s.seller.avatar_url || getUserAvatarSrc(s.seller.user_id)} alt="" className="w-11 h-11 rounded-full object-cover" />
                <div>
                  <p className="font-bold text-sm">{s.seller.full_name ?? "مستقل"}</p>
                  <p className="text-[11px] text-muted-foreground">{s.seller.headline ?? s.seller.freelancer_role ?? ""}</p>
                </div>
              </Link>
              <TrustIndicators level={level.data} verification={verification.data} />
            </Card>
          )}

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full text-muted-foreground">
                <ShieldAlert className="w-4 h-4 ml-1" />الإبلاغ عن هذه الخدمة
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>الإبلاغ عن الخدمة</DialogTitle></DialogHeader>
              <Textarea rows={4} value={reportReason} onChange={(e) => setReportReason(e.target.value)}
                placeholder="اشرح المشكلة…" />
              <DialogFooter><Button onClick={submitReport}>إرسال البلاغ</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </PageShell>
  );
}
