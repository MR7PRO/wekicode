import { useState } from "react";
import { MoreVertical, Pin, Lock, Unlock, Star, EyeOff, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { moderateTopic, deleteTopic } from "@/lib/forum/api";
import { toast } from "sonner";

interface Props {
  topicId: string;
  isPinned: boolean;
  isLocked: boolean;
  isFeatured: boolean;
  onChange?: () => void;
  onDeleted?: () => void;
}

export function ForumModerationMenu({ topicId, isPinned, isLocked, isFeatured, onChange, onDeleted }: Props) {
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>, ok: string) => {
    setBusy(true);
    try { await fn(); toast.success(ok); onChange?.(); }
    catch (e: any) { toast.error(e.message || "فشل"); }
    finally { setBusy(false); }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="outline" className="h-8 w-8" aria-label="أدوات الإشراف">
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MoreVertical className="w-3.5 h-3.5" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48" dir="rtl">
        <DropdownMenuItem onClick={() => run(() => moderateTopic(topicId, { is_pinned: !isPinned }), isPinned ? "أُلغي التثبيت" : "تم التثبيت")}>
          <Pin className="w-4 h-4 ml-2" /> {isPinned ? "إلغاء التثبيت" : "تثبيت"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => run(() => moderateTopic(topicId, { is_locked: !isLocked }), isLocked ? "فتح النقاش" : "إغلاق النقاش")}>
          {isLocked ? <Unlock className="w-4 h-4 ml-2" /> : <Lock className="w-4 h-4 ml-2" />}
          {isLocked ? "فتح النقاش" : "إغلاق النقاش"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => run(() => moderateTopic(topicId, { is_featured: !isFeatured }), isFeatured ? "أُلغي التمييز" : "تم التمييز")}>
          <Star className="w-4 h-4 ml-2" /> {isFeatured ? "إلغاء التمييز" : "تمييز"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => run(() => moderateTopic(topicId, { status: "hidden" }), "تم الإخفاء")}>
          <EyeOff className="w-4 h-4 ml-2" /> إخفاء
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive"
          onClick={async () => {
            if (!confirm("حذف الموضوع نهائيًا؟")) return;
            setBusy(true);
            try { await deleteTopic(topicId); toast.success("تم الحذف"); onDeleted?.(); }
            catch (e: any) { toast.error(e.message || "فشل"); }
            finally { setBusy(false); }
          }}
        >
          <Trash2 className="w-4 h-4 ml-2" /> حذف
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}