import { useEffect, useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { fetchMyProRequest, submitProRequest } from "@/lib/trust/api";
import { VERIFICATION_STATUS_LABELS, type ProfessionalVerificationRequest } from "@/lib/trust/types";
import { toast } from "sonner";
import { BadgeCheck, Loader2 } from "lucide-react";

const STANDARDS = [
  "تقديم معلومات صحيحة وأعمال تخصّني فعليًا.",
  "الالتزام بإرشادات المجتمع وسياسات سوق الخدمات.",
  "التواصل باحترافية والالتزام بمواعيد التسليم المتفق عليها.",
];

export default function ProfessionalVerification() {
  const { user } = useAuth();
  const [existing, setExisting] = useState<ProfessionalVerificationRequest | null>(null);
  const [links, setLinks] = useState("");
  const [samples, setSamples] = useState("");
  const [skills, setSkills] = useState("");
  const [notes, setNotes] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchMyProRequest(user.id).then((r) => {
      if (!r) return;
      setExisting(r);
      setLinks((r.portfolio_links ?? []).join("\n"));
      setSamples((r.work_samples ?? []).join("\n"));
      setSkills((r.skills ?? []).join("، "));
      setNotes(r.notes ?? "");
      setAccepted(!!r.standards_accepted);
    });
  }, [user]);

  const split = (v: string, sep: RegExp) => v.split(sep).map((s) => s.trim()).filter(Boolean);

  const onSubmit = async () => {
    if (!user) return;
    if (!accepted) return toast.error("يجب الموافقة على معايير المستقل المحترف");
    const parsedSkills = split(skills, /[،,\n]/);
    if (parsedSkills.length === 0) return toast.error("أضف مهاراتك الأساسية");
    setSaving(true);
    try {
      await submitProRequest(
        user.id,
        {
          portfolio_links: split(links, /\n/),
          work_samples: split(samples, /\n/),
          skills: parsedSkills,
          notes,
          standards_accepted: true,
        },
        existing?.id,
      );
      toast.success("تم إرسال طلب التحقق المهني للمراجعة");
      const r = await fetchMyProRequest(user.id);
      setExisting(r);
    } catch {
      toast.error("تعذر إرسال الطلب، حاول لاحقًا");
    } finally {
      setSaving(false);
    }
  };

  const locked = existing?.status === "under_review" || existing?.status === "approved";

  return (
    <PageShell title="التحقق المهني" description="تقديم طلب التحقق المهني للمستقلين" path="/verification/professional" noindex width="narrow">
      <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
        <BadgeCheck className="w-6 h-6 text-primary" /> التحقق المهني
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        يراجع فريق WekiCode ملفك المهني وأعمالك. التحقق يعني مراجعة معلومات محددة ولا يضمن جودة التسليم.
      </p>

      {existing && (
        <Card className="mb-5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">حالة طلبك</CardTitle>
            <CardDescription>{VERIFICATION_STATUS_LABELS[existing.status as keyof typeof VERIFICATION_STATUS_LABELS] ?? existing.status}</CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label>روابط أعمال (رابط في كل سطر)</Label>
            <Textarea rows={3} value={links} onChange={(e) => setLinks(e.target.value)} disabled={locked} placeholder="https://github.com/..." />
          </div>
          <div className="space-y-2">
            <Label>نماذج أعمال (رابط في كل سطر)</Label>
            <Textarea rows={3} value={samples} onChange={(e) => setSamples(e.target.value)} disabled={locked} />
          </div>
          <div className="space-y-2">
            <Label>المهارات</Label>
            <Input value={skills} onChange={(e) => setSkills(e.target.value)} disabled={locked} placeholder="React، Node.js، تصميم واجهات" />
          </div>
          <div className="space-y-2">
            <Label>ملاحظات إضافية</Label>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} disabled={locked} />
          </div>

          <div className="rounded-lg border p-3 space-y-2">
            <p className="text-sm font-semibold">معايير المستقل المحترف</p>
            <ul className="text-xs text-muted-foreground list-disc pr-5 space-y-1">
              {STANDARDS.map((s) => <li key={s}>{s}</li>)}
            </ul>
            <label className="flex items-center gap-2 text-sm pt-1">
              <Checkbox checked={accepted} onCheckedChange={(v) => setAccepted(!!v)} disabled={locked} />
              أوافق على هذه المعايير
            </label>
          </div>

          <Button onClick={onSubmit} disabled={saving || locked} className="w-full">
            {saving && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
            {locked ? "الطلب قيد المراجعة" : existing ? "إعادة إرسال الطلب" : "إرسال الطلب"}
          </Button>
        </CardContent>
      </Card>
    </PageShell>
  );
}
