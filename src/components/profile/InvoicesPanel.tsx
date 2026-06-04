import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, ExternalLink, Loader2, Download, Smartphone, Building2, Wallet, MessageCircle, Copy, Clock, User } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface InvoiceRow {
  id: string;
  invoice_number: string;
  total_amount: number;
  status: string;
  issued_at: string;
  due_date: string;
  payment_method: string | null;
}

const statusLabel = (s: string) =>
  s === "paid" ? "مدفوع" : s === "overdue" ? "متأخر" : "معلق";

const statusClass = (s: string) =>
  s === "paid"
    ? "bg-success/15 text-success border-success/30"
    : s === "overdue"
    ? "bg-destructive/15 text-destructive border-destructive/30"
    : "bg-warning/15 text-warning border-warning/30";

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString("ar", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return d;
  }
}

const WHATSAPP_NUMBER = "972598754887";
const ACCOUNT_NUMBER = "0598754887";
const ACCOUNT_HOLDER = "أيهم الهور";

const paymentMethods = [
  { id: "jawwal-pay", name: "محفظة جوّال باي", icon: Smartphone, color: "primary" },
  { id: "bank-of-palestine", name: "بنك فلسطين", icon: Building2, color: "accent" },
  { id: "pal-pay", name: "محفظة PalPay", icon: Wallet, color: "success" },
];

function PaymentMethodsCard({ userId }: { userId?: string }) {
  const waMessage = encodeURIComponent(
    `السلام عليكم، أرغب بتفعيل اشتراكي على wekicode.\nاسم المستخدم: ${ACCOUNT_HOLDER ? "" : ""}${userId ? `\nمعرّف الحساب: ${userId}` : ""}\nمرفق صورة إشعار التحويل.`
  );
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${waMessage}`;

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: `تم نسخ ${label}` });
    } catch {
      toast({ title: "تعذّر النسخ", variant: "destructive" });
    }
  };

  return (
    <div className="glass rounded-2xl p-6 border-border/50 space-y-5">
      <div>
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-1">
          <Wallet className="w-5 h-5 text-primary" />
          طرق الدفع وتفعيل الاشتراك
        </h3>
        <p className="text-sm text-muted-foreground">
          نستقبل الدفع عبر إحدى المحافظ التالية، ثم يتم تفعيل اشتراكك خلال يوم عمل واحد كحدّ أقصى بعد إرسال صورة الإشعار.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        {paymentMethods.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.id}
              className={`rounded-xl border border-${m.color}/20 bg-gradient-to-br from-${m.color}/10 to-${m.color}/5 p-4`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-9 h-9 rounded-lg bg-${m.color}/20 flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 text-${m.color}`} />
                </div>
                <div className="font-bold text-sm text-foreground">{m.name}</div>
              </div>
              <div className="text-[11px] text-muted-foreground">رقم الحساب موحّد للمحافظ الثلاث</div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-border/60 bg-secondary/30 divide-y divide-border/60">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2 min-w-0">
            <User className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground">اسم صاحب الحساب</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground text-sm">{ACCOUNT_HOLDER}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copy(ACCOUNT_HOLDER, "الاسم")}>
              <Copy className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2 min-w-0">
            <Smartphone className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground">رقم الحساب (للمحافظ الثلاث)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-foreground text-sm" dir="ltr">{ACCOUNT_NUMBER}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copy(ACCOUNT_NUMBER, "الرقم")}>
              <Copy className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2 min-w-0">
            <MessageCircle className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground">واتساب لإرسال صورة الإشعار</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-foreground text-sm" dir="ltr">+{WHATSAPP_NUMBER}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copy(`+${WHATSAPP_NUMBER}`, "رقم الواتساب")}>
              <Copy className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <ol className="space-y-2 text-sm text-foreground/90 list-decimal pr-5">
        <li>حوّل قيمة الاشتراك إلى الرقم أعلاه عبر إحدى المحافظ الثلاث.</li>
        <li>التقط صورة لإشعار التحويل من تطبيق المحفظة/البنك.</li>
        <li>أرسل الصورة إلى رقم الواتساب أعلاه مع ذكر اسم المستخدم.</li>
        <li className="flex items-start gap-2"><Clock className="w-4 h-4 text-warning mt-0.5 shrink-0" />يتم تفعيل اشتراكك خلال يوم عمل واحد كحدّ أقصى من استلام صورة الإشعار.</li>
      </ol>

      <a href={waUrl} target="_blank" rel="noopener noreferrer" className="block">
        <Button className="w-full gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white">
          <MessageCircle className="w-4 h-4" />
          إرسال صورة الإشعار عبر واتساب
        </Button>
      </a>
    </div>
  );
}

export function InvoicesPanel() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("invoices")
        .select("id, invoice_number, total_amount, status, issued_at, due_date, payment_method")
        .eq("user_id", user.id)
        .order("issued_at", { ascending: false });
      setInvoices((data as InvoiceRow[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  const totalPaid = invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + Number(i.total_amount || 0), 0);
  const pending = invoices.filter((i) => i.status !== "paid").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PaymentMethodsCard userId={user?.id} />

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-4 border-border/50">
          <div className="text-xs text-muted-foreground mb-1">إجمالي الفواتير</div>
          <div className="text-2xl font-black text-foreground">{invoices.length}</div>
        </div>
        <div className="glass rounded-xl p-4 border-border/50">
          <div className="text-xs text-muted-foreground mb-1">المبلغ المدفوع</div>
          <div className="text-2xl font-black text-success">{totalPaid.toLocaleString()} ₪</div>
        </div>
        <div className="glass rounded-xl p-4 border-border/50">
          <div className="text-xs text-muted-foreground mb-1">قيد الانتظار</div>
          <div className="text-2xl font-black text-warning">{pending}</div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          فواتيري
        </h3>
        <Link to="/billing">
          <Button variant="outline" size="sm" className="gap-2">
            <ExternalLink className="w-4 h-4" />
            إدارة الاشتراك
          </Button>
        </Link>
      </div>

      {invoices.length === 0 ? (
        <div className="text-center py-12 glass rounded-2xl border-border/50">
          <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
          <h4 className="text-xl font-bold text-foreground mb-2">لا توجد فواتير بعد</h4>
          <p className="text-muted-foreground mb-4">اشترك في إحدى الخطط لإنشاء أول فاتورة لك.</p>
          <Link to="/billing">
            <Button variant="default" className="gap-2">
              <ExternalLink className="w-4 h-4" />
              تصفّح الخطط
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv, i) => (
            <motion.div
              key={inv.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass rounded-xl p-4 border-border/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-mono text-sm text-muted-foreground">{inv.invoice_number}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${statusClass(inv.status)}`}>
                    {statusLabel(inv.status)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground flex gap-3 flex-wrap">
                  <span>صدرت: {formatDate(inv.issued_at)}</span>
                  <span>الاستحقاق: {formatDate(inv.due_date)}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-end">
                  <div className="text-xl font-black text-primary leading-none">
                    {Number(inv.total_amount).toLocaleString()} ₪
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    {inv.payment_method === "cash" ? "نقداً" : inv.payment_method ?? "—"}
                  </div>
                </div>
                <Link to="/billing">
                  <Button variant="ghost" size="icon" title="عرض التفاصيل">
                    <Download className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
