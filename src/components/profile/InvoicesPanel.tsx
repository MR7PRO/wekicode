import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, ExternalLink, Loader2, Download } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

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
