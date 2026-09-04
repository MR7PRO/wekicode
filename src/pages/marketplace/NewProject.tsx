import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { createProject, fetchCategories } from "@/lib/marketplace/api";
import type { MarketplaceCategory } from "@/lib/marketplace/types";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

export default function NewProject() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<MarketplaceCategory[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [duration, setDuration] = useState("");
  const [skills, setSkills] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  const submit = async () => {
    if (!user) return;
    if (title.trim().length < 8) return toast.error("اكتب عنوانًا واضحًا للمشروع (8 أحرف على الأقل)");
    if (description.trim().length < 40) return toast.error("اشرح تفاصيل المشروع بما لا يقل عن 40 حرفًا");
    setSaving(true);
    try {
      const row = await createProject({
        buyer_id: user.id,
        title: title.trim(),
        description: description.trim(),
        category_id: categoryId || null,
        budget_min: budgetMin ? Number(budgetMin) : null,
        budget_max: budgetMax ? Number(budgetMax) : null,
        expected_duration: duration.trim() || null,
        skills_required: skills.split(",").map((s) => s.trim()).filter(Boolean),
        status: "open",
        visibility: "public",
      });
      toast.success("تم نشر المشروع");
      navigate(`/marketplace/projects/${(row as { id: string }).id}`);
    } catch {
      toast.error("تعذر نشر المشروع");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell title="نشر مشروع جديد" description="انشر مشروعك واستقبل عروض المستقلين" path="/marketplace/projects/new" noindex width="narrow">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Plus className="w-6 h-6 text-primary" /> نشر مشروع جديد
      </h1>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">تفاصيل المشروع</CardTitle>
          <CardDescription>كلما كان الوصف أدق، كانت العروض أفضل.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>عنوان المشروع</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: تطوير موقع تعريفي بلغة React" />
          </div>
          <div className="space-y-2">
            <Label>الوصف</Label>
            <Textarea rows={8} value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="اشرح المتطلبات، النطاق، المخرجات المتوقعة، وأي مراجع." />
          </div>
          <div className="space-y-2">
            <Label>التصنيف</Label>
            <select className="w-full rounded-md border bg-background p-2 text-sm" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">بدون تصنيف</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>أقل ميزانية</Label>
              <Input type="number" min={0} value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>أعلى ميزانية</Label>
              <Input type="number" min={0} value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>المدة المتوقعة</Label>
            <Input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="مثال: أسبوعان" />
          </div>
          <div className="space-y-2">
            <Label>المهارات المطلوبة (افصل بينها بفاصلة)</Label>
            <Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, Tailwind, Supabase" />
          </div>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 ml-2 animate-spin" />} نشر المشروع
          </Button>
        </CardContent>
      </Card>
    </PageShell>
  );
}
