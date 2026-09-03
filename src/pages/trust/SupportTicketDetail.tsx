import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { fetchTicket, fetchTicketMessages, replyToTicket } from "@/lib/trust/api";
import {
  SUPPORT_CATEGORIES, TICKET_STATUS_LABELS, TICKET_PRIORITY_LABELS,
  type SupportTicket, type SupportTicketMessage,
} from "@/lib/trust/types";
import { toast } from "sonner";
import { ArrowRight, Loader2 } from "lucide-react";

export default function SupportTicketDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportTicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!id) return;
    const [t, m] = await Promise.all([fetchTicket(id), fetchTicketMessages(id)]);
    setTicket(t);
    setMessages(m);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);

  const send = async () => {
    if (!user || !id) return;
    if (reply.trim().length < 2) return;
    setSaving(true);
    try {
      await replyToTicket(id, user.id, reply.trim());
      setReply("");
      await load();
    } catch {
      toast.error("تعذر إرسال الرد");
    } finally {
      setSaving(false);
    }
  };

  const closed = ticket?.status === "closed" || ticket?.status === "resolved";

  return (
    <PageShell title="تذكرة الدعم" description="متابعة تذكرة الدعم" path={`/support/${id ?? ""}`} noindex width="narrow">
      <Link to="/support" className="text-sm text-primary inline-flex items-center gap-1 mb-4">
        <ArrowRight className="w-4 h-4" /> تذاكري
      </Link>

      {loading ? (
        <div className="space-y-3"><Skeleton className="h-8 w-2/3" /><Skeleton className="h-40 w-full" /></div>
      ) : !ticket ? (
        <Card><CardContent className="pt-6 text-sm text-muted-foreground">التذكرة غير متاحة.</CardContent></Card>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3 mb-1">
            <h1 className="text-2xl font-bold">{ticket.subject}</h1>
            <Badge variant="secondary">{TICKET_STATUS_LABELS[ticket.status] ?? ticket.status}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-5">
            {SUPPORT_CATEGORIES.find((c) => c.key === ticket.category)?.title ?? ticket.category} · الأولوية:{" "}
            {TICKET_PRIORITY_LABELS[ticket.priority] ?? ticket.priority} ·{" "}
            {new Date(ticket.created_at).toLocaleString("ar")}
          </p>

          <Card className="mb-4">
            <CardContent className="pt-6 text-sm whitespace-pre-wrap leading-7">{ticket.description}</CardContent>
          </Card>

          <div className="space-y-3 mb-4">
            {messages.map((m) => (
              <Card key={m.id} className={m.sender_type === "user" ? "" : "border-primary/40"}>
                <CardContent className="pt-5">
                  <p className="text-xs text-muted-foreground mb-1">
                    {m.sender_type === "user" ? "أنت" : m.sender_type === "support" ? "فريق الدعم" : "النظام"} ·{" "}
                    {new Date(m.created_at).toLocaleString("ar")}
                  </p>
                  <p className="text-sm whitespace-pre-wrap leading-7">{m.message}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {closed ? (
            <p className="text-sm text-muted-foreground">
              هذه التذكرة مغلقة. يمكنك <Link className="text-primary underline" to="/support/new">فتح تذكرة جديدة</Link>.
            </p>
          ) : (
            <Card>
              <CardContent className="pt-6 space-y-3">
                <Textarea rows={4} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="اكتب ردك..." />
                <Button onClick={send} disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 ml-2 animate-spin" />} إرسال
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </PageShell>
  );
}
