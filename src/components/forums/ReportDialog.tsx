import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Flag } from "lucide-react";
import { createReport } from "@/lib/forum/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const REASONS = [
  { v: "spam", l: "بريد مزعج" },
  { v: "offensive", l: "محتوى مسيء" },
  { v: "off_topic", l: "خارج الموضوع" },
  { v: "duplicate", l: "مكرر" },
  { v: "other", l: "أخرى" },
];

export function ReportDialog({ topicId, replyId }: { topicId?: string; replyId?: string }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("spam");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!user) return toast.error("سجّل الدخول للإبلاغ");
    setBusy(true);
    try {
      await createReport({ reporterId: user.id, topicId, replyId, reason, details: details.trim() || undefined });
      toast.success("تم استلام بلاغك");
      setOpen(false); setDetails("");
    } catch (e: any) { toast.error(e.message || "فشل الإرسال"); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1">
          <Flag className="w-3 h-3" /> إبلاغ
        </Button>
      </DialogTrigger>
      <DialogContent dir="rtl">
        <DialogHeader><DialogTitle>الإبلاغ عن محتوى</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold block mb-1">السبب</label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => <SelectItem key={r.v} value={r.v}>{r.l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1">تفاصيل (اختياري)</label>
            <Textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3} placeholder="اشرح المشكلة…" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button onClick={submit} disabled={busy}>إرسال</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}