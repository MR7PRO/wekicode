import { useEffect, useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { fetchMyAppeals, fetchMyRestrictions, submitAppeal } from "@/lib/trust/api";
import {
  APPEAL_STATUS_LABELS, RESTRICTION_TYPE_LABELS,
  type AccountAppeal, type AccountRestriction,
} from "@/lib/trust/types";
import { toast } from "sonner";
import { Scale, Loader2 } from "lucide-react";

export default function Appeals() {
  const { user } = useAuth();
  const [restrictions, setRestrictions] = useState<AccountRestriction[]>([]);
  const [appeals, setAppeals] = useState<AccountAppeal[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [explanation, setExplanation] = useState("");
  const [saving, setSaving] = useState(false);

  const reload = async () => {
    if (!user) return;
    const [r, a] = await Promise.all([fetchMyRestrictions(user.id), fetchMyAppeals(user.id)]);
    setRestrictions(r);
    setAppeals(a);
    if (r[0]) setSelected(r[0].id);
  };

  useEffect(() => { reload(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user]);

  const send = async () => {
    if (!user) return;
    if (explanation.trim().length < 30) return toast.error("اشرح موقفك بما لا يقل عن 30 حرفًا");
    setSaving(true);
    try {
      await submitAppeal(user.id, selected || null, explanation.trim());
      setExplanation("");
      toast.success("تم إرسال التظلّم، سيراجعه الفريق");
      reload();
    } catch {
      toast.error("تعذر إرسال التظلّم");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell title="التظلّمات" description="تقديم تظلّم على قرار يخص حسابك" path="/appeals" noindex width="narrow">
      <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
        <Scale className="w-6 h-6 text-primary" /> التظلّمات
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        إذا كان لديك قيد نشط على حسابك ولديك توضيح، يمكنك تقديم تظلّم ليراجعه فريق الثقة والسلامة.
      </p>

      <Card className="mb-5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">تظلّم جديد</CardTitle>
          <CardDescription>وضّح ما حدث وأي معلومات تساعد في المراجعة.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {restrictions.length > 0 && (
            <div className="space-y-2">
              <Label>القيد المتعلق بالتظلّم</Label>
              <select
                className="w-full rounded-md border bg-background p-2 text-sm"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
              >
                {restrictions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {RESTRICTION_TYPE_LABELS[r.restriction_type] ?? r.restriction_type}
                  </option>
                ))}
                <option value="">غير مرتبط بقيد محدد</option>
              </select>
            </div>
          )}
          <Textarea rows={5} value={explanation} onChange={(e) => setExplanation(e.target.value)} placeholder="اشرح موقفك بالتفصيل..." />
          <Button onClick={send} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 animate-spin ml-2" />} إرسال التظلّم
          </Button>
        </CardContent>
      </Card>

      <h2 className="text-lg font-semibold mb-3">تظلّماتي</h2>
      {appeals.length === 0 ? (
        <p className="text-sm text-muted-foreground">لا توجد تظلّمات سابقة.</p>
      ) : (
        <div className="space-y-3">
          {appeals.map((a) => (
            <Card key={a.id}>
              <CardContent className="pt-5 space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{APPEAL_STATUS_LABELS[a.status] ?? a.status}</span>
                  <span className="text-xs text-muted-foreground">{new Date(a.submitted_at).toLocaleDateString("ar")}</span>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{a.explanation}</p>
                {a.reviewer_response && (
                  <p className="text-sm rounded-md bg-muted/60 p-2 mt-2">رد الفريق: {a.reviewer_response}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}
