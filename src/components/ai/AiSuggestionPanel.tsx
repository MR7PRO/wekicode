import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Check, AlertTriangle, X } from "lucide-react";
import { callAiForum, SuggestTopicResult, DuplicatesResult } from "@/lib/ai/forum";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface Props {
  title: string;
  content: string;
  type: string;
  forumId?: string;
  onApplyTitle: (t: string) => void;
  onAddTag: (tagName: string) => void;
}

export function AiSuggestionPanel({ title, content, type, forumId, onApplyTitle, onAddTag }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [sugg, setSugg] = useState<SuggestTopicResult | null>(null);
  const [dups, setDups] = useState<DuplicatesResult | null>(null);

  const guard = () => {
    if (!title.trim() && !content.trim()) {
      toast.error("اكتب العنوان أو المحتوى أولًا");
      return false;
    }
    return true;
  };

  const run = async (label: string, fn: () => Promise<void>) => {
    if (!guard()) return;
    setBusy(label);
    try { await fn(); }
    catch (e: any) { toast.error(e.message || "تعذر تشغيل المساعد الآن."); }
    finally { setBusy(null); }
  };

  return (
    <Card className="p-4 border-primary/20 bg-primary/5">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="font-bold text-sm">مساعد WekiCode</h3>
        <Badge variant="outline" className="text-[9px] mr-auto">اقتراحات ذكية</Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <Button size="sm" variant="outline" disabled={!!busy}
          onClick={() => run("suggest", async () => {
            const r = await callAiForum<SuggestTopicResult>("suggest_topic", { title, content, type });
            setSugg(r);
          })}>
          {busy === "suggest" ? <Loader2 className="w-3 h-3 animate-spin" /> : "اقتراح ذكي (عنوان/وسوم)"}
        </Button>
        <Button size="sm" variant="outline" disabled={!!busy}
          onClick={() => run("dupes", async () => {
            const r = await callAiForum<DuplicatesResult>("detect_duplicates", { title, content, forum_id: forumId });
            setDups(r);
          })}>
          {busy === "dupes" ? <Loader2 className="w-3 h-3 animate-spin" /> : "افحص التكرار"}
        </Button>
      </div>

      {sugg && (
        <div className="space-y-3 mb-3">
          {sugg.improvedTitle && (
            <div className="p-2 rounded bg-background/60 border">
              <div className="text-[10px] text-muted-foreground mb-1">عنوان مقترح</div>
              <div className="text-sm mb-2">{sugg.improvedTitle}</div>
              <Button size="sm" variant="hero" className="h-7" onClick={() => { onApplyTitle(sugg.improvedTitle!); toast.success("تم تطبيق العنوان"); }}>
                <Check className="w-3 h-3 ml-1" /> استخدم هذا العنوان
              </Button>
            </div>
          )}
          {sugg.suggestedTags && sugg.suggestedTags.length > 0 && (
            <div>
              <div className="text-[10px] text-muted-foreground mb-1">وسوم مقترحة</div>
              <div className="flex flex-wrap gap-1">
                {sugg.suggestedTags.map((t) => (
                  <Badge key={t} variant="outline" className="cursor-pointer" onClick={() => onAddTag(t)}>#{t} +</Badge>
                ))}
              </div>
            </div>
          )}
          {sugg.missingDetails && sugg.missingDetails.length > 0 && (
            <div>
              <div className="text-[10px] text-muted-foreground mb-1">تفاصيل ينبغي إضافتها</div>
              <ul className="text-xs space-y-1">
                {sugg.missingDetails.map((d, i) => <li key={i} className="flex items-start gap-1"><AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5" />{d}</li>)}
              </ul>
            </div>
          )}
          {typeof sugg.clarityScore === "number" && (
            <div className="text-[10px] text-muted-foreground">درجة الوضوح: {sugg.clarityScore}/10</div>
          )}
        </div>
      )}

      {dups && (
        <div className="mb-2">
          {dups.possibleDuplicates.length === 0 ? (
            <div className="text-xs text-muted-foreground">لم نجد مواضيع مشابهة بوضوح.</div>
          ) : (
            <>
              <div className="text-xs font-semibold mb-1 flex items-center gap-1 text-amber-500">
                <AlertTriangle className="w-3 h-3" /> قد يكون سؤالك مكررًا
              </div>
              <ul className="space-y-1">
                {dups.possibleDuplicates.slice(0, 3).map((d) => (
                  <li key={d.topic_id} className="text-xs p-2 rounded border bg-background/60">
                    <Link to={d.url} target="_blank" className="font-semibold hover:text-primary">{d.title}</Link>
                    {d.reason && <div className="text-[10px] text-muted-foreground mt-0.5">{d.reason}</div>}
                  </li>
                ))}
              </ul>
            </>
          )}
          <Button size="sm" variant="ghost" className="h-6 mt-2 text-[10px]" onClick={() => setDups(null)}>
            <X className="w-3 h-3 ml-1" /> إغلاق
          </Button>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground mt-2">الاقتراحات الذكية للمساعدة فقط، راجعها قبل النشر.</p>
    </Card>
  );
}