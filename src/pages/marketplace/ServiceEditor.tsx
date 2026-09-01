import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Save, Send } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { fetchCategories, createService, updateService, fetchServiceById } from "@/lib/marketplace/api";

export default function ServiceEditor() {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const categories = useQuery({ queryKey: ["mp-categories"], queryFn: fetchCategories });
  const existing = useQuery({ queryKey: ["mp-service-edit", id], queryFn: () => fetchServiceById(id!), enabled: !!id });

  const [form, setForm] = useState({
    title: "", short_description: "", description: "", category_id: "",
    base_price: 50, delivery_days: 7, revisions_included: 1, tags: "", requirements: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const s = existing.data;
    if (!s) return;
    setForm({
      title: s.title, short_description: s.short_description ?? "", description: s.description,
      category_id: s.category_id ?? "", base_price: s.base_price, delivery_days: s.delivery_days,
      revisions_included: s.revisions_included, tags: (s.tags ?? []).join("، "), requirements: s.requirements ?? "",
    });
  }, [existing.data]);

  useEffect(() => { if (!loading && !user) navigate("/auth"); }, [loading, user, navigate]);

  const save = async (status: "draft" | "pending_review") => {
    if (!user) return;
    if (form.title.trim().length < 8) { toast.error("العنوان قصير جدًا"); return; }
    if (form.description.trim().length < 60) { toast.error("اكتب وصفًا تفصيليًا (60 حرفًا على الأقل)"); return; }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      short_description: form.short_description.trim() || null,
      description: form.description.trim(),
      category_id: form.category_id || null,
      base_price: Number(form.base_price),
      delivery_days: Number(form.delivery_days),
      revisions_included: Number(form.revisions_included),
      tags: form.tags.split(/[،,]/).map((t) => t.trim()).filter(Boolean).slice(0, 8),
      requirements: form.requirements.trim() || null,
      status,
    };
    try {
      if (id) {
        await updateService(id, payload);
        toast.success(status === "draft" ? "تم حفظ المسودة" : "تم إرسال الخدمة للمراجعة");
      } else {
        await createService({ ...payload, seller_id: user.id });
        toast.success(status === "draft" ? "تم إنشاء المسودة" : "تم إرسال الخدمة للمراجعة");
      }
      navigate("/marketplace/dashboard");
    } catch {
      toast.error("تعذر حفظ الخدمة");
    } finally { setSaving(false); }
  };

  return (
    <PageShell title={id ? "تعديل الخدمة" : "اعرض خدمتك"} description="أنشئ خدمة احترافية داخل سوق WekiCode" noindex width="narrow">
      <h1 className="text-2xl font-bold mb-4">{id ? "تعديل الخدمة" : "اعرض خدمتك"}</h1>
      <Card className="glass border-border/50 p-5 space-y-4">
        <div>
          <Label>عنوان الخدمة</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="سأبني لك واجهة React احترافية…" />
        </div>
        <div>
          <Label>وصف مختصر</Label>
          <Input value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} />
        </div>
        <div>
          <Label>الوصف التفصيلي</Label>
          <Textarea rows={7} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div>
          <Label>التصنيف</Label>
          <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
            <SelectTrigger><SelectValue placeholder="اختر تصنيفًا" /></SelectTrigger>
            <SelectContent>
              {categories.data?.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><Label>السعر</Label><Input type="number" min={5} value={form.base_price}
            onChange={(e) => setForm({ ...form, base_price: Number(e.target.value) })} /></div>
          <div><Label>أيام التسليم</Label><Input type="number" min={1} value={form.delivery_days}
            onChange={(e) => setForm({ ...form, delivery_days: Number(e.target.value) })} /></div>
          <div><Label>عدد التعديلات</Label><Input type="number" min={0} value={form.revisions_included}
            onChange={(e) => setForm({ ...form, revisions_included: Number(e.target.value) })} /></div>
        </div>
        <div>
          <Label>الوسوم (مفصولة بفاصلة)</Label>
          <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="React، Tailwind، واجهات" />
        </div>
        <div>
          <Label>ما تحتاجه من المشتري</Label>
          <Textarea rows={3} value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} />
        </div>
        <p className="text-[12px] text-muted-foreground">
          تمر كل خدمة بمراجعة من فريق WekiCode قبل النشر لضمان جودة السوق ومنع الإعلانات العشوائية.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" disabled={saving} onClick={() => save("draft")}>
            <Save className="w-4 h-4 ml-1" />حفظ كمسودة
          </Button>
          <Button disabled={saving} onClick={() => save("pending_review")}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <Send className="w-4 h-4 ml-1" />}إرسال للمراجعة
          </Button>
        </div>
      </Card>
    </PageShell>
  );
}
