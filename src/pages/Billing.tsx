import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { 
  CreditCard, FileText, Calendar, Check, Download, ExternalLink,
  Wifi, Zap, Coffee, MapPin, Clock, Phone, Mail, HelpCircle,
  RefreshCw, Building, Plus, Minus, Loader2, ShoppingCart, Users, FileTextIcon
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { SubscriptionCustomizer } from "@/components/billing/SubscriptionCustomizer";
import { PaymentMethodsCard } from "@/components/billing/PaymentMethodsCard";
import { WorkspaceLocations } from "@/components/billing/WorkspaceLocations";

interface WorkspaceService {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  icon: string;
  is_addon: boolean;
  is_active: boolean;
}

interface Subscription {
  id: string;
  plan_name: string;
  price: number;
  start_date: string;
  end_date: string;
  status: string;
  auto_renew: boolean;
  payment_method: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  status: string;
  issued_at: string;
  due_date: string;
  paid_at: string | null;
  payment_method: string | null;
  services: { service_title: string; unit_price: number; quantity: number }[];
}

const iconMap: Record<string, React.ComponentType<any>> = {
  building: Building, users: Users, wifi: Wifi, zap: Zap,
  coffee: Coffee, calendar: Calendar, "file-text": FileTextIcon,
};

export default function Billing() {
  const { user } = useAuth();
  const [services, setServices] = useState<WorkspaceService[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) { setLoading(false); return; }

    const [svcRes, subRes, invRes] = await Promise.all([
      supabase.from("workspace_services").select("*").eq("is_active", true).order("price"),
      supabase.from("workspace_subscriptions").select("*").eq("user_id", user.id).eq("status", "active").order("created_at", { ascending: false }).limit(1),
      supabase.from("invoices").select("*").eq("user_id", user.id).order("issued_at", { ascending: false }),
    ]);

    setServices((svcRes.data as WorkspaceService[]) ?? []);
    
    const activeSub = (subRes.data as Subscription[])?.[0] ?? null;
    setSubscription(activeSub);

    // Fetch invoice services for each invoice
    const invData = (invRes.data ?? []) as any[];
    const enriched: Invoice[] = await Promise.all(
      invData.map(async (inv) => {
        const { data: svcItems } = await supabase
          .from("invoice_services")
          .select("service_title, unit_price, quantity")
          .eq("invoice_id", inv.id);
        return { ...inv, services: svcItems ?? [] } as Invoice;
      })
    );
    setInvoices(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const daysRemaining = subscription 
    ? Math.max(0, Math.ceil((new Date(subscription.end_date).getTime() - Date.now()) / 86400000))
    : 0;

  const totalPaid = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.total_amount, 0);
  const paidCount = invoices.filter(i => i.status === "paid").length;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              <span className="text-foreground">الفواتير</span>
              {" "}
              <span className="text-gradient-primary">وإدارة الاشتراكات</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              تتبع فواتيرك واشتراكاتك في شبكة وورك سبيس wekicode على مستوى محافظات قطاع غزة
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Current Subscription */}
              <div className="glass rounded-2xl p-6 border-border/50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5" />
                
                <div className="relative">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-foreground">الاشتراك الحالي</h2>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          subscription 
                            ? "bg-success/10 text-success" 
                            : "bg-muted text-muted-foreground"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${subscription ? "bg-success" : "bg-muted-foreground"}`} />
                          {subscription ? "نشط" : "لا يوجد اشتراك"}
                        </span>
                      </div>
                    </div>
                    <SubscriptionCustomizer services={services} userId={user?.id} onComplete={fetchData} />
                  </div>

                  {subscription ? (
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="p-5 rounded-xl bg-secondary/50 border border-border/30">
                        <h3 className="text-lg font-bold text-foreground mb-2">{subscription.plan_name}</h3>
                        <div className="text-3xl font-black text-primary mb-2">
                          {subscription.price} شيكل
                          <span className="text-base font-normal text-muted-foreground">/شهر</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          من {formatDate(subscription.start_date)} إلى {formatDate(subscription.end_date)}
                        </p>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-warning" />
                          <span className="text-warning font-medium">متبقي {daysRemaining} يوم</span>
                        </div>
                      </div>

                      <div className="p-5 rounded-xl bg-secondary/50 border border-border/30">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-muted-foreground">التجديد التلقائي</span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            subscription.auto_renew ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                          }`}>
                            {subscription.auto_renew ? "مفعل" : "معطل"}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground mb-3">
                          طريقة الدفع: {subscription.payment_method === "cash" ? "نقداً" : subscription.payment_method}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CreditCard className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground mb-2">لا يوجد اشتراك نشط حالياً</p>
                      <p className="text-sm text-muted-foreground">اضغط على "اشتراك جديد" لاختيار خطة مناسبة</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Invoices */}
              <div className="glass rounded-2xl p-6 border-border/50">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <FileText className="w-6 h-6 text-primary" />
                    الفواتير
                  </h2>
                  <span className="text-sm text-muted-foreground">{invoices.length} فاتورة</span>
                </div>

                {invoices.length === 0 ? (
                  <div className="text-center py-10">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">لا توجد فواتير بعد</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <AnimatePresence>
                      {invoices.map((invoice, i) => (
                        <motion.div
                          key={invoice.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="p-5 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors border border-border/30"
                        >
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-mono text-sm text-muted-foreground">{invoice.invoice_number}</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  invoice.status === "paid"
                                    ? "bg-success/10 text-success"
                                    : invoice.status === "overdue"
                                    ? "bg-destructive/10 text-destructive"
                                    : "bg-warning/10 text-warning"
                                }`}>
                                  {invoice.status === "paid" ? "مدفوع" : invoice.status === "overdue" ? "متأخر" : "معلق"}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                <span>تاريخ الإصدار: {formatDate(invoice.issued_at)}</span>
                                <span>استحقاق الدفع: {formatDate(invoice.due_date)}</span>
                              </div>
                            </div>
                            <div className="text-left md:text-right">
                              <div className="text-2xl font-bold text-primary mb-1">{invoice.total_amount} شيكل</div>
                              <div className="text-sm text-muted-foreground">
                                {invoice.payment_method === "cash" ? "نقداً" : invoice.payment_method ?? "-"}
                              </div>
                            </div>
                          </div>

                          {invoice.services.length > 0 && (
                            <div className="mb-3">
                              <h4 className="text-sm font-medium text-foreground mb-2">الخدمات المشمولة:</h4>
                              <div className="flex flex-wrap gap-2">
                                {invoice.services.map((svc, idx) => (
                                  <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-primary text-xs">
                                    <Check className="w-3 h-3" />
                                    {svc.service_title} ({svc.unit_price} شيكل)
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Payment Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="glass rounded-xl p-5 border-border/50 text-center">
                  <div className="text-3xl font-black text-primary mb-1">{totalPaid}</div>
                  <div className="text-sm text-muted-foreground">إجمالي المدفوعات (شيكل)</div>
                </div>
                <div className="glass rounded-xl p-5 border-border/50 text-center">
                  <div className="text-3xl font-black text-primary mb-1">{paidCount}</div>
                  <div className="text-sm text-muted-foreground">فواتير مدفوعة</div>
                </div>
                <div className="glass rounded-xl p-5 border-border/50 text-center">
                  <div className="text-3xl font-black text-primary mb-1">{invoices.length}</div>
                  <div className="text-sm text-muted-foreground">إجمالي الفواتير</div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Workspace Info */}
              <div className="glass rounded-2xl p-6 border-border/50 overflow-hidden relative">
                <div className="absolute inset-0">
                  <img 
                    src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=200&fit=crop" 
                    alt="Workspace" 
                    className="w-full h-full object-cover opacity-20"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-transparent" />
                </div>
                
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                      <Building className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">wekicode Workspace</h3>
                      <p className="text-sm text-muted-foreground">Gaza</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>شارع الجامعة، حي الرمال، غزة</span>
                  </div>

                  <div className="flex items-center gap-2 mb-6">
                    <span className="px-3 py-1 rounded-full bg-success/10 text-success text-sm font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      متاح 24/7
                    </span>
                  </div>

                  <h4 className="text-sm font-medium text-foreground mb-3">الخدمات المتاحة:</h4>
                  <div className="space-y-2">
                    {services.map(svc => {
                      const Icon = iconMap[svc.icon] ?? Zap;
                      return (
                        <div key={svc.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                          <div className="flex items-center gap-2 text-sm">
                            <Icon className="w-4 h-4 text-primary" />
                            <span className="text-foreground">{svc.title}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{svc.price} شيكل</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Support */}
              <div className="glass rounded-2xl p-6 border-border/50">
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-primary" />
                  الدعم والمساعدة
                </h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">billing@wekicode.ps</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground" dir="ltr">+970 8 123 4567</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    تواصل معنا
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1">
                    الأسئلة الشائعة
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
