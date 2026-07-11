import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, Copy } from "lucide-react";
import { callAiForum, AnswerDraftResult } from "@/lib/ai/forum";
import { toast } from "sonner";

const INTENTS = [
  { v: "رد مختصر", l: "رد مختصر" },
  { v: "شرح تفصيلي", l: "شرح تفصيلي" },
  { v: "حل تقني", l: "حل تقني" },
  { v: "صياغة ألطف", l: "صياغة ألطف" },
];

export function AiReplyAssistant({ topicId, onInsert }: { topicId: string; onInsert: (text: string) => void }) {
  const [open, setOpen] = useState(false);
  const [intent, setIntent] = useState("رد مختصر");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<AnswerDraftResult | null>(null);

  const gen = async () => {
    setBusy(true);
    try {
      const r = await callAiForum<AnswerDraftResult>("answer_draft", { topic_id: topicId, intent, notes });
      setDraft(r);
    } catch (e: any) { toast.error(e.message || "تعذر تشغيل المساعد الآن."); }
    finally { setBusy(false); }
  };

  if (!open) {
    return (
      <Button size="sm" variant="outline" className="gap-1 mb-2" onClick={() => setOpen(true)}>
        <Sparkles className="w-3 h-3" /> ساعدني أكتب رد
      </Button>
    );
  }

  return (
    <Card className="p-3 mb-2 border-primary/20 bg-primary/5">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-3 h-3 text-primary" />
        <span className="text-xs font-bold">رد مقترح</span>
        <Button size="sm" variant="ghost" className="mr-auto h-6 text-[10px]" onClick={() => setOpen(false)}>إغلاق</Button>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <Select value={intent} onValueChange={setIntent}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>{INTENTS.map(i => <SelectItem key={i.v} value={i.v}>{i.l}</SelectItem>)}</SelectContent>
        </Select>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="ملاحظات (اختياري)" className="h-8 text-xs" />
      </div>
      <Button size="sm" variant="hero" onClick={gen} disabled={busy} className="w-full h-8">
        {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : "توليد مسودة"}
      </Button>
      {draft && (
        <div className="mt-2 space-y-2">
          <div className="p-2 rounded bg-background/60 border text-xs whitespace-pre-wrap">{draft.draftReply}</div>
          {draft.cautionNotes && draft.cautionNotes.length > 0 && (
            <ul className="text-[10px] text-amber-500 list-disc pr-4">
              {draft.cautionNotes.map((n, i) => <li key={i}>{n}</li>)}
            </ul>
          )}
          <div className="flex gap-1">
            <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => { onInsert(draft.draftReply); toast.success("تم إدراجه في الرد"); }}>
              <Copy className="w-3 h-3 ml-1" /> أدرج في مربع الرد
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground">هذا رد مقترح بالذكاء الاصطناعي، راجعه قبل النشر.</p>
        </div>
      )}
    </Card>
  );
}