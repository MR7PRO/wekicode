import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { callAiForum, fetchCachedSummary, SummaryResult } from "@/lib/ai/forum";
import { toast } from "sonner";

export function TopicSummaryCard({ topicId, repliesCount }: { topicId: string; repliesCount: number }) {
  const [summary, setSummary] = useState<SummaryResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchCachedSummary(topicId).then(setSummary).catch(() => {}); }, [topicId]);

  if (repliesCount < 4 && !summary) return null;

  const generate = async () => {
    setLoading(true);
    try {
      const r = await callAiForum<SummaryResult>("summarize_topic", { topic_id: topicId });
      setSummary(r);
      if (r.cached) toast.info("هذا الملخص محفوظ من قبل");
    } catch (e: any) { toast.error(e.message || "تعذر تشغيل المساعد الآن."); }
    finally { setLoading(false); }
  };

  return (
    <Card className="p-4 mb-4 border-primary/20 bg-primary/5">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="font-bold text-sm">ملخص النقاش</h3>
        {!summary && (
          <Button size="sm" variant="hero" className="mr-auto h-7" onClick={generate} disabled={loading}>
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "لخّص النقاش"}
          </Button>
        )}
      </div>
      {summary && (
        <div className="space-y-2 text-sm">
          <p className="whitespace-pre-wrap">{summary.summary}</p>
          {summary.key_points?.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold text-muted-foreground mb-1">أهم النقاط</div>
              <ul className="list-disc pr-5 text-xs space-y-1">
                {summary.key_points.map((k, i) => <li key={i}>{k}</li>)}
              </ul>
            </div>
          )}
          {summary.solution_summary && (
            <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/30 text-xs">
              <div className="font-semibold text-emerald-500 mb-1">الحل النهائي</div>
              {summary.solution_summary}
            </div>
          )}
          <p className="text-[10px] text-muted-foreground">ملخص ذكي — راجع الأصل لأي تفاصيل دقيقة.</p>
        </div>
      )}
    </Card>
  );
}