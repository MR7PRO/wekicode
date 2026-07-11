import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, Loader2 } from "lucide-react";
import { callAiForum, ConvertArticleResult, fetchArticleByTopic } from "@/lib/ai/forum";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export function ConvertToArticleButton({ topicId }: { topicId: string }) {
  const [existing, setExisting] = useState<{ id: string; slug: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  useEffect(() => { fetchArticleByTopic(topicId).then((a) => a && setExisting({ id: a.id, slug: a.slug })).catch(() => {}); }, [topicId]);

  const run = async () => {
    setBusy(true);
    try {
      const r = await callAiForum<ConvertArticleResult>("convert_to_article", { topic_id: topicId });
      toast.success(r.already ? "المقال موجود مسبقًا" : "تم إنشاء مسودة المقال");
      nav(`/knowledge/${r.article_id}`);
    } catch (e: any) { toast.error(e.message || "تعذر تشغيل المساعد الآن."); }
    finally { setBusy(false); }
  };

  if (existing) {
    return (
      <Button size="sm" variant="outline" className="gap-1" onClick={() => nav(`/knowledge/${existing.id}`)}>
        <BookOpen className="w-3 h-3" /> عرض المقال المستخرج
      </Button>
    );
  }
  return (
    <Button size="sm" variant="outline" className="gap-1" onClick={run} disabled={busy}>
      {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <BookOpen className="w-3 h-3" />} حوّل إلى مقال
    </Button>
  );
}