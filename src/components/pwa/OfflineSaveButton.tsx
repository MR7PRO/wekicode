import { useEffect, useState } from "react";
import { CloudDownload, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { isOfflineSaved, type OfflineItemType } from "@/pwa/pwaUtils";
import { useOfflineSavedItems } from "@/hooks/useOfflineSavedItems";
import { useFeature } from "@/hooks/useFeatureFlags";

interface Props {
  id: string;
  type: OfflineItemType;
  title: string;
  url: string;
  excerpt?: string;
  content?: string;
  tags?: string[];
  author?: string;
  className?: string;
}

export function OfflineSaveButton({ id, type, title, url, excerpt, content, tags, author, className }: Props) {
  const { enabled } = useFeature("offline_reading");
  const { save, remove } = useOfflineSavedItems();
  const [saved, setSaved] = useState(false);

  useEffect(() => setSaved(isOfflineSaved(id, type)), [id, type]);

  if (!enabled) return null;

  const toggle = () => {
    if (saved) {
      remove(id, type);
      setSaved(false);
      toast({ title: "تمت الإزالة من المحفوظات" });
    } else {
      save({ id, type, title, url, excerpt, content: content?.slice(0, 20000), tags, author });
      setSaved(true);
      toast({ title: "محفوظ بدون اتصال" });
    }
  };

  return (
    <Button size="sm" variant={saved ? "secondary" : "outline"} onClick={toggle} className={className}>
      {saved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <CloudDownload className="w-3.5 h-3.5" />}
      <span className="text-xs">{saved ? "محفوظ بدون اتصال" : "حفظ للقراءة بدون اتصال"}</span>
    </Button>
  );
}