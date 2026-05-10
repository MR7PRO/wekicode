import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface BookmarkButtonProps {
  itemId: string;
  itemType: "question" | "article";
  variant?: "icon" | "button";
  size?: "sm" | "default";
  className?: string;
}

export function BookmarkButton({ itemId, itemType, variant = "button", size = "sm", className }: BookmarkButtonProps) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) { setSaved(false); return; }
    let ignore = false;
    (async () => {
      const { data } = await (supabase as any)
        .from("bookmarks")
        .select("id")
        .eq("user_id", user.id)
        .eq("item_type", itemType)
        .eq("item_id", itemId)
        .maybeSingle();
      if (!ignore) setSaved(!!data);
    })();
    return () => { ignore = true; };
  }, [user, itemId, itemType]);

  const toggle = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!user) {
      toast({ title: "يجب تسجيل الدخول", description: "سجّل الدخول لحفظ المحتوى", variant: "destructive" });
      return;
    }
    setLoading(true);
    if (saved) {
      await (supabase as any).from("bookmarks").delete()
        .eq("user_id", user.id).eq("item_type", itemType).eq("item_id", itemId);
      setSaved(false);
      toast({ title: "تم إزالة من المحفوظات" });
    } else {
      const { error } = await (supabase as any).from("bookmarks").insert({
        user_id: user.id, item_type: itemType, item_id: itemId,
      });
      if (!error) { setSaved(true); toast({ title: "تم الحفظ ✅", description: "ستجده في صفحة محفوظاتي" }); }
    }
    setLoading(false);
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        aria-label={saved ? "إزالة من المحفوظات" : "حفظ"}
        className={cn(
          "p-2 rounded-lg transition-colors",
          saved ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary hover:bg-primary/10",
          className,
        )}
      >
        {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
      </button>
    );
  }

  return (
    <Button
      type="button"
      variant={saved ? "default" : "outline"}
      size={size}
      onClick={toggle}
      disabled={loading}
      className={className}
    >
      {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
      {saved ? "محفوظ" : "احفظ"}
    </Button>
  );
}
