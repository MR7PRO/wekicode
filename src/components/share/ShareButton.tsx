import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  text?: string;
  url?: string;
  className?: string;
  variant?: "outline" | "ghost" | "secondary";
  label?: string;
}

export function ShareButton({ title, text, url, className, variant = "outline", label = "مشاركة" }: Props) {
  const share = async () => {
    const shareUrl = url || window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, text: text?.slice(0, 160), url: shareUrl });
        return;
      }
    } catch {
      return; // user cancelled
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: "تم نسخ الرابط" });
    } catch {
      toast({ title: "تعذّر نسخ الرابط", variant: "destructive" });
    }
  };

  return (
    <Button size="sm" variant={variant} onClick={share} className={cn("gap-1", className)}>
      <Share2 className="w-3.5 h-3.5" />
      <span className="text-xs">{label}</span>
    </Button>
  );
}