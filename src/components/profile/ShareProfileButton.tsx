import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export function ShareProfileButton({ userId }: { userId: string }) {
  const [copied, setCopied] = useState(false);

  const onShare = async () => {
    const url = `${window.location.origin}/u/${userId}`;
    try {
      if (navigator.share) {
        try {
          await navigator.share({ title: "ملفي الشخصي على WekiCode", url });
          return;
        } catch { /* fall back to clipboard */ }
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: "تم نسخ رابط ملفك ✅", description: url });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "تعذر النسخ", variant: "destructive" });
    }
  };

  return (
    <Button variant="outline" onClick={onShare}>
      {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
      {copied ? "تم النسخ" : "شارك ملفك"}
    </Button>
  );
}
