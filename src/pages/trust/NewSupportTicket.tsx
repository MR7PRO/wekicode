import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { createTicket } from "@/lib/trust/api";
import { SUPPORT_CATEGORIES } from "@/lib/trust/types";
import { toast } from "sonner";
import { Loader2, Headphones } from "lucide-react";

export default function NewSupportTicket() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [category, setCategory] = useState("general");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!user) return;
    if (subject.trim().length < 5) return toast.error("اكتب عنوانًا واضحًا للتذكرة");
    if (description.trim().length < 20) return toast.error("اشرح المشكلة بما لا يقل عن 20 حرفًا");
    setSaving(true);
    try {
      const t = await createTicket(user.id, { category, subject: subject.trim(), description: description.trim() });
      toast.success("تم إنشاء التذكرة");
      navigate(`/support/${t.id}`);
    } catch {
      toast.error("تعذر إنشاء التذكرة");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell title="تذكرة دعم جديدة" description="افتح تذكرة دعم" path="/support/new" noindex width="narrow">
      <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
        <Headphones className="w-6 h-6 text-primary" /> تذكرة دعم جديدة
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        قبل فتح تذكرة، جرّب البحث في <Link className="text-primary underline" to="/help">مركز المساعدة</Link>.
      </p>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">تفاصيل الطلب</CardTitle>
          <CardDescription>كلما كانت التفاصيل أوضح، كان الرد أسرع.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>التصنيف</Label>
            <select
              className="w-full rounded-md border bg-background p-2 text-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {SUPPORT_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.title}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label>العنوان</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="مثال: لا أستطيع تفعيل التحقق المهني" />
          </div>
          <div className="space-y-2">
            <Label>الوصف</Label>
            <Textarea rows={7} value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="اشرح ما حدث، الخطوات التي جربتها، وأي رسائل خطأ ظهرت." />
          </div>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 ml-2 animate-spin" />} إرسال التذكرة
          </Button>
          <p className="text-xs text-muted-foreground">
            لا تشارك كلمات المرور أو بيانات الدفع الكاملة داخل التذاكر.
          </p>
        </CardContent>
      </Card>
    </PageShell>
  );
}
