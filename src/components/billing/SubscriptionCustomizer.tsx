import { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Building, Users, Wifi, Zap, Coffee, Calendar, FileText as FileTextIcon,
  Check, ShoppingCart, Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface WorkspaceService {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  icon: string;
  is_addon: boolean;
  is_active: boolean;
}

const iconMap: Record<string, React.ComponentType<any>> = {
  building: Building, users: Users, wifi: Wifi, zap: Zap,
  coffee: Coffee, calendar: Calendar, "file-text": FileTextIcon,
};

export async function createSubscriptionWithInvoice(params: {
  userId: string;
  planServices: { serviceId: string; title: string; price: number }[];
  total: number;
  planName: string;
}) {
  const { userId, planServices, total, planName } = params;
  const startDate = new Date().toISOString().split("T")[0];
  const endDate = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

  const { data: sub, error: subErr } = await supabase
    .from("workspace_subscriptions")
    .insert({ user_id: userId, plan_name: planName, price: total, start_date: startDate, end_date: endDate })
    .select("id")
    .single();
  if (subErr || !sub) {
    toast({ title: "حدث خطأ في إنشاء الاشتراك", variant: "destructive" });
    return false;
  }

  const { count } = await supabase
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  const invoiceNum = `INV-${new Date().getFullYear()}-${String((count ?? 0) + 1).padStart(3, "0")}`;

  const { data: inv, error: invErr } = await supabase
    .from("invoices")
    .insert({
      user_id: userId,
      subscription_id: sub.id,
      invoice_number: invoiceNum,
      total_amount: total,
      status: "pending",
      due_date: startDate,
    })
    .select("id")
    .single();
  if (invErr || !inv) {
    toast({ title: "حدث خطأ في إنشاء الفاتورة", variant: "destructive" });
    return false;
  }

  const lineItems = planServices.map(s => ({
    invoice_id: inv.id,
    service_id: s.serviceId,
    service_title: s.title,
    unit_price: s.price,
    quantity: 1,
  }));
  await supabase.from("invoice_services").insert(lineItems);

  toast({ title: "تم إنشاء الاشتراك والفاتورة بنجاح! 🎉", description: "أرسل صورة إشعار التحويل عبر الواتساب لتفعيل الاشتراك." });
  return true;
}

interface Props {
  services?: WorkspaceService[];
  onComplete?: () => void;
  triggerLabel?: string;
  triggerVariant?: "default" | "hero" | "outline" | "secondary";
  triggerSize?: "default" | "sm" | "lg";
  userId?: string;
}

export function SubscriptionCustomizer({
  services: externalServices,
  onComplete,
  triggerLabel = "اشتراك جديد",
  triggerVariant = "hero",
  triggerSize = "sm",
  userId,
}: Props) {
  const [open, setOpen] = useState(false);
  const [services, setServices] = useState<WorkspaceService[]>(externalServices ?? []);
  const [loading, setLoading] = useState(!externalServices);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [basePlan, setBasePlan] = useState<string | null>(null);

  useEffect(() => {
    if (externalServices) { setServices(externalServices); return; }
    if (!open || services.length > 0) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("workspace_services").select("*").eq("is_active", true).order("price");
      setServices((data as WorkspaceService[]) ?? []);
      setLoading(false);
    })();
  }, [open, externalServices]);

  const basePlans = services.filter(s => !s.is_addon);
  const addons = services.filter(s => s.is_addon);

  const total = useMemo(() => {
    let sum = 0;
    selected.forEach(id => {
      const svc = services.find(s => s.id === id);
      if (svc) sum += svc.price;
    });
    return sum;
  }, [selected, services]);

  const toggleService = (id: string, isBase: boolean) => {
    const next = new Set(selected);
    if (isBase) {
      basePlans.forEach(bp => next.delete(bp.id));
      next.add(id);
      setBasePlan(id);
    } else {
      if (next.has(id)) next.delete(id);
      else next.add(id);
    }
    setSelected(next);
  };

  const handleSubmit = async () => {
    if (!userId) {
      toast({ title: "يرجى تسجيل الدخول أولاً", variant: "destructive" });
      return;
    }
    if (!basePlan) {
      toast({ title: "يرجى اختيار خطة أساسية", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const items = Array.from(selected).map(id => {
      const svc = services.find(s => s.id === id)!;
      return { serviceId: svc.id, title: svc.title, price: svc.price };
    });
    const base = services.find(s => s.id === basePlan);
    const ok = await createSubscriptionWithInvoice({
      userId, planServices: items, total, planName: base?.title ?? "اشتراك مخصص",
    });
    setSubmitting(false);
    if (ok) {
      setOpen(false);
      setSelected(new Set());
      setBasePlan(null);
      onComplete?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant as any} size={triggerSize as any} className="gap-2">
          <ShoppingCart className="w-4 h-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تخصيص اشتراكك</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-foreground mb-3">اختر الخطة الأساسية</h3>
              <div className="grid grid-cols-2 gap-3">
                {basePlans.map(plan => {
                  const Icon = iconMap[plan.icon] ?? Building;
                  const isSelected = selected.has(plan.id);
                  return (
                    <button
                      key={plan.id}
                      onClick={() => toggleService(plan.id, true)}
                      className={`p-4 rounded-xl border-2 transition-all text-center ${
                        isSelected ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                      }`}
                    >
                      <Icon className={`w-6 h-6 mx-auto mb-2 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                      <div className="font-bold text-foreground text-sm">{plan.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">{plan.description}</div>
                      <div className="text-lg font-black text-primary mt-2">{plan.price} ₪</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {addons.length > 0 && (
              <div>
                <h3 className="font-bold text-foreground mb-3">خدمات إضافية</h3>
                <div className="space-y-2">
                  {addons.map(addon => {
                    const Icon = iconMap[addon.icon] ?? Zap;
                    const isSelected = selected.has(addon.id);
                    return (
                      <button
                        key={addon.id}
                        onClick={() => toggleService(addon.id, false)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                          isSelected ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/30"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isSelected ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-foreground">{addon.title}</div>
                            <div className="text-xs text-muted-foreground">{addon.description}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-foreground">{addon.price} ₪</span>
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            isSelected ? "bg-primary border-primary" : "border-muted-foreground"
                          }`}>
                            {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex items-center justify-between border-t border-border pt-4 mt-4">
          <div>
            <span className="text-sm text-muted-foreground">الإجمالي الشهري:</span>
            <span className="text-2xl font-black text-primary mr-2">{total} ₪</span>
          </div>
          <Button onClick={handleSubmit} disabled={!basePlan || submitting}>
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            تأكيد الاشتراك
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}