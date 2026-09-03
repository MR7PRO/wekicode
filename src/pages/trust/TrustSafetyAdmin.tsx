import { useEffect, useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchMyStaffRoles, staffFetchProRequests, staffReviewProRequest,
  staffFetchAppeals, staffReviewAppeal, staffFetchTickets, staffUpdateTicketStatus,
} from "@/lib/trust/api";
import {
  APPEAL_STATUS_LABELS, TICKET_STATUS_LABELS, SUPPORT_CATEGORIES,
  type AccountAppeal, type ProfessionalVerificationRequest, type SupportTicket,
} from "@/lib/trust/types";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

export default function TrustSafetyAdmin() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<string[] | null>(null);
  const [pro, setPro] = useState<ProfessionalVerificationRequest[]>([]);
  const [appeals, setAppeals] = useState<(AccountAppeal & { user_id: string })[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = async () => {
    if (!user) return;
    const r = await fetchMyStaffRoles(user.id);
    setRoles(r);
    if (r.length === 0) return;
    const [p, a, t] = await Promise.all([staffFetchProRequests(), staffFetchAppeals(), staffFetchTickets()]);
    setPro(p); setAppeals(a); setTickets(t);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user]);

  const act = async (fn: () => Promise<void>, msg: string) => {
    try { await fn(); toast.success(msg); load(); }
    catch { toast.error("تعذر تنفيذ الإجراء — تحقق من صلاحياتك"); }
  };

  return (
    <PageShell title="الثقة والسلامة" description="لوحة مراجعة الثقة والسلامة" path="/admin/trust-safety" noindex>
      <h1 className="text-2xl font-bold mb-5 flex items-center gap-2">
        <ShieldCheck className="w-6 h-6 text-primary" /> لوحة الثقة والسلامة
      </h1>

      {roles === null ? (
        <Skeleton className="h-40 w-full" />
      ) : roles.length === 0 ? (
        <Card><CardContent className="pt-6 text-sm text-muted-foreground">
          هذه اللوحة متاحة لفريق الثقة والسلامة والدعم فقط.
        </CardContent></Card>
      ) : (
        <Tabs defaultValue="pro">
          <TabsList className="mb-4">
            <TabsTrigger value="pro">التحقق المهني ({pro.length})</TabsTrigger>
            <TabsTrigger value="appeals">التظلّمات ({appeals.length})</TabsTrigger>
            <TabsTrigger value="tickets">الدعم ({tickets.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pro" className="space-y-3">
            {pro.length === 0 && <p className="text-sm text-muted-foreground">لا توجد طلبات بانتظار المراجعة.</p>}
            {pro.map((p) => (
              <Card key={p.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    طلب تحقق مهني <Badge variant="secondary">{p.status}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground">المهارات: {p.skills?.join("، ") || "—"}</p>
                  <p className="text-muted-foreground break-all">الروابط: {p.portfolio_links?.join(" · ") || "—"}</p>
                  {p.notes && <p className="whitespace-pre-wrap">{p.notes}</p>}
                  <Textarea rows={2} placeholder="ملاحظات المراجعة (داخلية)"
                    value={notes[p.id] ?? ""} onChange={(e) => setNotes({ ...notes, [p.id]: e.target.value })} />
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => act(() => staffReviewProRequest(p.id, "approved", notes[p.id] ?? ""), "تم الاعتماد")}>اعتماد</Button>
                    <Button size="sm" variant="outline" onClick={() => act(() => staffReviewProRequest(p.id, "changes_requested", notes[p.id] ?? ""), "تم طلب تعديلات")}>طلب تعديلات</Button>
                    <Button size="sm" variant="destructive" onClick={() => act(() => staffReviewProRequest(p.id, "rejected", notes[p.id] ?? ""), "تم الرفض")}>رفض</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="appeals" className="space-y-3">
            {appeals.length === 0 && <p className="text-sm text-muted-foreground">لا توجد تظلّمات مفتوحة.</p>}
            {appeals.map((a) => (
              <Card key={a.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    تظلّم <Badge variant="secondary">{APPEAL_STATUS_LABELS[a.status] ?? a.status}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="whitespace-pre-wrap leading-7">{a.explanation}</p>
                  <Textarea rows={2} placeholder="ردّ الفريق على المستخدم"
                    value={notes[a.id] ?? ""} onChange={(e) => setNotes({ ...notes, [a.id]: e.target.value })} />
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => act(() => staffReviewAppeal(a.id, "approved", notes[a.id] ?? ""), "تم قبول التظلّم")}>قبول</Button>
                    <Button size="sm" variant="outline" onClick={() => act(() => staffReviewAppeal(a.id, "more_information_required", notes[a.id] ?? ""), "تم طلب معلومات")}>طلب معلومات</Button>
                    <Button size="sm" variant="destructive" onClick={() => act(() => staffReviewAppeal(a.id, "rejected", notes[a.id] ?? ""), "تم رفض التظلّم")}>رفض</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="tickets" className="space-y-3">
            {tickets.length === 0 && <p className="text-sm text-muted-foreground">لا توجد تذاكر مفتوحة.</p>}
            {tickets.map((t) => (
              <Card key={t.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    {t.subject} <Badge variant="secondary">{TICKET_STATUS_LABELS[t.status] ?? t.status}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-xs text-muted-foreground">
                    {SUPPORT_CATEGORIES.find((c) => c.key === t.category)?.title ?? t.category} ·{" "}
                    {new Date(t.created_at).toLocaleString("ar")}
                  </p>
                  <p className="whitespace-pre-wrap leading-7">{t.description}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => act(() => staffUpdateTicketStatus(t.id, "waiting_on_user"), "تم التحديث")}>بانتظار المستخدم</Button>
                    <Button size="sm" onClick={() => act(() => staffUpdateTicketStatus(t.id, "resolved"), "تم الحل")}>تم الحل</Button>
                    <Button size="sm" variant="destructive" onClick={() => act(() => staffUpdateTicketStatus(t.id, "closed"), "تم الإغلاق")}>إغلاق</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      )}
    </PageShell>
  );
}
