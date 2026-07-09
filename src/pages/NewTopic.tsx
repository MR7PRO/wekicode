import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchAllForums, fetchAllTags, createTopic } from "@/lib/forum/api";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const TYPES = [
  { value: "discussion", label: "نقاش" },
  { value: "question", label: "سؤال" },
  { value: "article", label: "مقال" },
  { value: "job", label: "فرصة" },
  { value: "showcase", label: "اعرض مشروعك" },
];

export default function NewTopic() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const [forumId, setForumId] = useState(sp.get("forum") || "");
  const [type, setType] = useState(sp.get("type") || "discussion");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const forumsQ = useQuery({ queryKey: ["all-forums"], queryFn: fetchAllForums });
  const tagsQ = useQuery({ queryKey: ["all-tags"], queryFn: fetchAllTags });

  useEffect(() => { if (!user) toast.error("يجب تسجيل الدخول"); }, [user]);

  const submit = async () => {
    if (!user) return nav("/auth");
    if (!forumId || !title.trim() || !content.trim()) return toast.error("املأ كل الحقول");
    setSubmitting(true);
    try {
      const t: any = await createTopic({ userId: user.id, forumId, title: title.trim(), content: content.trim(), type, tagIds });
      const slug = forumsQ.data?.find((f) => f.id === forumId)?.slug;
      toast.success("تم النشر");
      nav(`/forums/${slug}/${t.id}`);
    } catch (e: any) { toast.error(e.message || "فشل النشر"); }
    finally { setSubmitting(false); }
  };

  const toggleTag = (id: string) => setTagIds((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16 max-w-3xl" dir="rtl">
        <h1 className="text-2xl font-black mb-4">موضوع جديد</h1>
        <Card className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold mb-1 block">المنتدى</label>
              <Select value={forumId} onValueChange={setForumId}>
                <SelectTrigger><SelectValue placeholder="اختر منتدى" /></SelectTrigger>
                <SelectContent>
                  {(forumsQ.data ?? []).map((f) => <SelectItem key={f.id} value={f.id}>{f.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block">النوع</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block">العنوان</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان واضح ومختصر" />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block">المحتوى</label>
            <Textarea rows={10} value={content} onChange={(e) => setContent(e.target.value)} placeholder="اشرح تفاصيل موضوعك…" />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block">الوسوم</label>
            <div className="flex flex-wrap gap-1">
              {(tagsQ.data ?? []).map((t) => (
                <Badge
                  key={t.id}
                  variant={tagIds.includes(t.id) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleTag(t.id)}
                >#{t.name}</Badge>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => nav(-1)}>إلغاء</Button>
            <Button variant="hero" onClick={submit} disabled={submitting}>نشر</Button>
          </div>
        </Card>
      </div>
    </>
  );
}