import { useEffect, useState } from "react";
import { Copy, Check, UserPlus, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFeature } from "@/hooks/useFeatureFlags";
import { trackEvent } from "@/lib/analytics";
import { toast } from "@/hooks/use-toast";

export function InviteCard() {
  const { user } = useAuth();
  const { enabled } = useFeature("referrals");
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user || !enabled) { setLoading(false); return; }
    let alive = true;
    supabase.rpc("get_or_create_invite_code").then(({ data, error }) => {
      if (!alive) return;
      if (!error && typeof data === "string") setCode(data);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [user, enabled]);

  if (!user || !enabled) return null;

  const link = code ? `${window.location.origin}/auth?invite=${code}` : "";

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      trackEvent("invite_copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "تعذر النسخ", description: "انسخ الرابط يدويًا", variant: "destructive" });
    }
  };

  return (
    <Card className="p-4 border-border/50 glass">
      <h3 className="font-bold text-sm mb-1 flex items-center gap-2">
        <UserPlus className="w-4 h-4 text-primary" /> ادعُ صديقًا مهتمًا بالبرمجة
      </h3>
      <p className="text-[11px] text-muted-foreground mb-3">
        تحصل على 25 نقطة بعد انضمام صديقك وإكماله للإعداد الأولي.
      </p>
      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> جارٍ التحميل…
        </div>
      ) : !code ? (
        <p className="text-[11px] text-muted-foreground">هذه الميزة غير متاحة حاليًا.</p>
      ) : (
        <div className="flex items-center gap-2">
          <code className="flex-1 text-[11px] px-2 py-1.5 rounded-md bg-muted/40 border border-border/50 truncate" dir="ltr">
            {link}
          </code>
          <Button size="sm" variant="outline" onClick={copy} aria-label="نسخ رابط الدعوة">
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
      )}
    </Card>
  );
}