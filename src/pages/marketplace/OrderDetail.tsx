import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Send, Package, AlertTriangle, Star, CheckCircle, RefreshCcw } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { getUserAvatarSrc } from "@/lib/media/userAvatars";
import {
  fetchOrderById, fetchOrderMessages, sendOrderMessage,
  fetchDeliverables, submitDeliverable, updateOrderStatus,
  createReview, fetchMyReviewForOrder,
} from "@/lib/marketplace/api";
import { ORDER_STATUS_LABELS } from "@/lib/marketplace/types";
import type { OrderMessage, OrderDeliverable } from "@/lib/marketplace/types";

export default function OrderDetail() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [message, setMessage] = useState("");
  const [deliverableTitle, setDeliverableTitle] = useState("");
  const [deliverableDesc, setDeliverableDesc] = useState("");
  const [deliverableLinks, setDeliverableLinks] = useState("");
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const order = useQuery({ queryKey: ["mp-order", id], queryFn: () => fetchOrderById(id), enabled: !!id });
  const messages = useQuery({ queryKey: ["mp-order-messages", id], queryFn: () => fetchOrderMessages(id), enabled: !!id });
  const deliverables = useQuery({ queryKey: ["mp-deliverables", id], queryFn: () => fetchDeliverables(id), enabled: !!id });
  const myReview = useQuery({ queryKey: ["mp-my-review", id, user?.id], queryFn: () => fetchMyReviewForOrder(id, user!.id), enabled: !!id && !!user });

  const isBuyer = user?.id === order.data?.buyer_id;
  const isSeller = user?.id === order.data?.seller_id;

  const sendMsg = useMutation({
    mutationFn: () => sendOrderMessage(id, user!.id, message.trim()),
    onSuccess: () => {
      setMessage("");
      qc.invalidateQueries({ queryKey: ["mp-order-messages", id] });
    },
    onError: () => toast.error("تعذر إرسال الرسالة"),
  });

  const submitDelivery = useMutation({
    mutationFn: () => submitDeliverable({
      order_id: id,
      seller_id: user!.id,
      title: deliverableTitle.trim(),
      description: deliverableDesc.trim() || null,
      links: deliverableLinks.split("\n").map((l) => l.trim()).filter(Boolean),
      files: [],
      status: "submitted",
    }),
    onSuccess: async () => {
      await updateOrderStatus(id, "submitted");
      setDeliverableTitle(""); setDeliverableDesc(""); setDeliverableLinks("");
      qc.invalidateQueries({ queryKey: ["mp-order", id] });
      qc.invalidateQueries({ queryKey: ["mp-deliverables", id] });
      toast.success("تم تسليم الطلب");
    },
    onError: () => toast.error("تعذر التسليم"),
  });

  const changeStatus = useMutation({
    mutationFn: (status: string) => updateOrderStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mp-order", id] }); toast.success("تم تحديث الحالة"); },
    onError: () => toast.error("تعذر تحديث الحالة"),
  });

  const submitReview = useMutation({
    mutationFn: () => createReview({
      order_id: id,
      reviewer_id: user!.id,
      reviewee_id: isBuyer ? order.data!.seller_id : order.data!.buyer_id,
      service_id: order.data!.service_id,
      rating,
      comment: reviewComment.trim() || null,
      is_public: true,
      is_hidden: false,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mp-my-review", id, user?.id] }); toast.success("تم إرسال التقييم"); },
    onError: () => toast.error("تعذر إرسال التقييم"),
  });

  if (order.isLoading) {
    return <PageShell title="جارٍ التحميل" description="تحميل بيانات الطلب" noindex><Loader2 className="w-6 h-6 animate-spin mx-auto my-20 text-primary" /></PageShell>;
  }
  if (!order.data) {
    return <PageShell title="الطلب غير موجود" description="الطلب غير متاح" noindex><p className="text-center py-20 text-muted-foreground">الطلب غير موجود أو لا تملك صلاحية الوصول.</p></PageShell>;
  }

  const o = order.data;

  const renderActor = (label: string, actor: typeof o.buyer) => (
    <div className="flex items-center gap-2">
      <img src={actor?.avatar_url || getUserAvatarSrc(actor?.user_id ?? "")} alt="" className="w-8 h-8 rounded-full object-cover" />
      <div>
        <p className="text-sm font-bold">{actor?.full_name ?? label}</p>
        <p className="text-[11px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );

  return (
    <PageShell title={o.title} description={`طلب #${o.id.slice(0, 8)} · ${ORDER_STATUS_LABELS[o.status]}`} noindex>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold">{o.title}</h1>
          <p className="text-sm text-muted-foreground">طلب #{o.id.slice(0, 8)} · {o.price.toLocaleString()} {o.currency}</p>
        </div>
        <Badge variant="secondary">{ORDER_STATUS_LABELS[o.status]}</Badge>
      </div>

      <div className="grid gap-5 lg:grid-cols-3 mb-6">
        <Card className="glass border-border/50 lg:col-span-2">
          <CardContent className="pt-5 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              {renderActor("المشتري", o.buyer)}
              {renderActor("البائع", o.seller)}
            </div>
            <div className="text-sm whitespace-pre-wrap bg-muted/40 rounded-lg p-3">
              <p className="font-bold mb-1">نطاق العمل</p>
              {o.scope}
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>رسوم المنصة: {o.platform_fee} {o.currency}</span>
              <span>صافي البائع: {o.seller_amount} {o.currency}</span>
              <span>طريقة الدفع: {o.payment_mode === "online" ? "إلكتروني" : "يدوي"}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-base">إجراءات الطلب</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {isSeller && o.status === "pending" && (
              <Button className="w-full" onClick={() => changeStatus.mutate("accepted")} disabled={changeStatus.isPending}>
                <CheckCircle className="w-4 h-4 ml-1" /> قبول الطلب
              </Button>
            )}
            {isSeller && (o.status === "accepted" || o.status === "in_progress") && (
              <Button className="w-full" onClick={() => submitDelivery.mutate()} disabled={submitDelivery.isPending || !deliverableTitle.trim()}>
                <Package className="w-4 h-4 ml-1" /> تسليم الطلب
              </Button>
            )}
            {isBuyer && o.status === "submitted" && (
              <>
                <Button className="w-full" onClick={() => changeStatus.mutate("completed")} disabled={changeStatus.isPending}>
                  <CheckCircle className="w-4 h-4 ml-1" /> تأكيد الاستلام
                </Button>
                <Button variant="outline" className="w-full" onClick={() => changeStatus.mutate("revision_requested")} disabled={changeStatus.isPending}>
                  <RefreshCcw className="w-4 h-4 ml-1" /> طلب تعديل
                </Button>
              </>
            )}
            {isBuyer && o.status === "revision_requested" && (
              <p className="text-sm text-muted-foreground">بانتظار تعديل البائع.</p>
            )}
            {o.status !== "completed" && o.status !== "cancelled" && o.status !== "disputed" && (
              <Button variant="ghost" className="w-full text-destructive" onClick={() => changeStatus.mutate("disputed")} disabled={changeStatus.isPending}>
                <AlertTriangle className="w-4 h-4 ml-1" /> فتح نزاع
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {isSeller && (o.status === "accepted" || o.status === "in_progress") && (
        <Card className="glass border-border/50 mb-6">
          <CardHeader className="pb-2"><CardTitle className="text-base">تسليم جديد</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><Label>عنوان التسليم</Label><Input value={deliverableTitle} onChange={(e) => setDeliverableTitle(e.target.value)} placeholder="مثال: ملفات المشروع النهائية" /></div>
            <div><Label>الوصف</Label><Textarea rows={3} value={deliverableDesc} onChange={(e) => setDeliverableDesc(e.target.value)} placeholder="اشرح ما تم تسليمه…" /></div>
            <div><Label>روابط (رابط لكل سطر)</Label><Textarea rows={3} value={deliverableLinks} onChange={(e) => setDeliverableLinks(e.target.value)} placeholder="https://…" /></div>
          </CardContent>
        </Card>
      )}

      {deliverables.data && deliverables.data.length > 0 && (
        <Card className="glass border-border/50 mb-6">
          <CardHeader className="pb-2"><CardTitle className="text-base">التسليمات</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {deliverables.data.map((d: OrderDeliverable) => (
              <div key={d.id} className="border border-border/40 rounded-lg p-3">
                <p className="font-bold text-sm">{d.title}</p>
                {d.description && <p className="text-sm text-muted-foreground mt-1">{d.description}</p>}
                {d.links?.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {d.links.map((l, i) => <a key={i} href={l} target="_blank" rel="noreferrer" className="block text-xs text-primary underline truncate">{l}</a>)}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="glass border-border/50 mb-6">
        <CardHeader className="pb-2"><CardTitle className="text-base">المراسلات</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto mb-3">
            {messages.data?.length ? messages.data.map((m: OrderMessage) => {
              const mine = m.sender_id === user?.id;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[80%] rounded-xl p-3 text-sm ${mine ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted rounded-tl-none"}`}>
                    {m.message}
                    <p className={`text-[10px] mt-1 ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {new Date(m.created_at).toLocaleString("ar")}
                    </p>
                  </div>
                </div>
              );
            }) : <p className="text-sm text-muted-foreground text-center py-6">لا توجد رسائل بعد.</p>}
          </div>
          <div className="flex gap-2">
            <Textarea rows={2} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="اكتب رسالتك…" className="flex-1" />
            <Button disabled={!message.trim() || sendMsg.isPending} onClick={() => sendMsg.mutate()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {o.status === "completed" && !myReview.data && (
        <Card className="glass border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-base">قيّم الطلب</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Label>التقييم</Label>
              <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="border rounded-md p-1 text-sm bg-background">
                {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} <Star className="inline w-3 h-3" /></option>)}
              </select>
            </div>
            <Textarea rows={3} value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="تعليقك (اختياري)…" />
            <Button onClick={() => submitReview.mutate()} disabled={submitReview.isPending}>إرسال التقييم</Button>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 flex justify-end">
        <Button variant="outline" asChild><Link to="/marketplace/dashboard">العودة للوحة السوق</Link></Button>
      </div>
    </PageShell>
  );
}
