import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { fetchMyTickets } from "@/lib/trust/api";
import { SUPPORT_CATEGORIES, TICKET_STATUS_LABELS, type SupportTicket } from "@/lib/trust/types";
import { Headphones, Plus } from "lucide-react";

export default function SupportTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchMyTickets(user.id).then((t) => {
      setTickets(t);
      setLoading(false);
    });
  }, [user]);

  return (
    <PageShell title="الدعم" description="تذاكر الدعم الخاصة بك" path="/support" noindex width="narrow">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Headphones className="w-6 h-6 text-primary" /> الدعم
        </h1>
        <Button asChild size="sm"><Link to="/support/new"><Plus className="w-4 h-4 ml-1" /> تذكرة جديدة</Link></Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[0, 1].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : tickets.length === 0 ? (
        <Card><CardContent className="pt-6 text-sm text-muted-foreground">
          لا توجد تذاكر بعد. ابدأ بالبحث في <Link className="text-primary underline" to="/help">مركز المساعدة</Link> أو افتح تذكرة جديدة.
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Link key={t.id} to={`/support/${t.id}`}>
              <Card className="hover:border-primary/50 transition-colors">
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold mb-1">{t.subject}</h2>
                      <p className="text-xs text-muted-foreground">
                        {SUPPORT_CATEGORIES.find((c) => c.key === t.category)?.title ?? t.category} ·{" "}
                        {new Date(t.created_at).toLocaleDateString("ar")}
                      </p>
                    </div>
                    <Badge variant="secondary">{TICKET_STATUS_LABELS[t.status] ?? t.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
