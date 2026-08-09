import { Bell, BellRing, Smartphone } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/seo/SEOHead";
import { toast } from "@/hooks/use-toast";
import { useNotificationPreferences, type NotificationPrefs } from "@/hooks/useNotificationPreferences";
import { usePushNotifications } from "@/hooks/usePushNotifications";

const rows: { key: keyof NotificationPrefs; label: string; hint?: string }[] = [
  { key: "in_app_enabled", label: "إشعارات داخل التطبيق" },
  { key: "replies_enabled", label: "الردود على مواضيعي" },
  { key: "mentions_enabled", label: "المنشن" },
  { key: "solutions_enabled", label: "الحلول المعتمدة" },
  { key: "achievements_enabled", label: "الشارات والإنجازات" },
  { key: "followed_content_enabled", label: "محتوى أتابعه" },
  { key: "weekly_digest_enabled", label: "ملخص أسبوعي" },
  { key: "quiet_hours_enabled", label: "عدم الإزعاج" },
];

export default function NotificationSettings() {
  const { prefs, loading, update } = useNotificationPreferences();
  const push = usePushNotifications();

  const enablePush = async () => {
    const res = await push.enable();
    if (res.ok) {
      toast({ title: "تم تفعيل إشعارات الهاتف" });
      return;
    }
    const messages: Record<string, string> = {
      unsupported: "الإشعارات غير مدعومة على هذا المتصفح.",
      denied: "تم رفض إذن الإشعارات من المتصفح.",
      not_configured: "إشعارات الهاتف غير مفعّلة على الخادم بعد.",
      auth: "سجّل الدخول أولًا.",
      error: "تعذّر تفعيل الإشعارات.",
    };
    toast({ title: messages[res.reason ?? "error"], variant: "destructive" });
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="إعدادات الإشعارات" description="تحكم في إشعارات WekiCode." path="/settings/notifications" noindex />
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-2xl pb-24">
        <h1 className="text-2xl font-bold flex items-center gap-2 mb-6">
          <Bell className="w-6 h-6 text-primary" /> إعدادات الإشعارات
        </h1>

        <section className="rounded-2xl border border-border/60 bg-card/60 p-4 mb-4">
          <div className="flex items-start gap-3">
            <Smartphone className="w-5 h-5 text-primary mt-1" />
            <div className="flex-1">
              <h2 className="font-semibold text-sm mb-1">إشعارات الهاتف</h2>
              <p className="text-xs text-muted-foreground mb-3">
                سنرسل لك تنبيهات عن الردود على مواضيعك، الحلول، والشارات المهمة فقط.
              </p>
              {!push.supported ? (
                <p className="text-xs text-muted-foreground">الإشعارات غير مدعومة على هذا المتصفح.</p>
              ) : push.subscribed ? (
                <Button size="sm" variant="outline" disabled={push.busy} onClick={push.disable}>
                  إيقاف إشعارات الهاتف
                </Button>
              ) : (
                <Button size="sm" disabled={push.busy} onClick={enablePush} className="gap-1">
                  <BellRing className="w-4 h-4" /> تفعيل إشعارات WekiCode
                </Button>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border/60 bg-card/60 divide-y divide-border/50">
          {rows.map((row) => (
            <div key={row.key} className="flex items-center justify-between gap-4 p-4">
              <span className="text-sm">{row.label}</span>
              <Switch
                checked={!!prefs[row.key]}
                disabled={loading}
                onCheckedChange={(v) => update({ [row.key]: v } as Partial<NotificationPrefs>)}
              />
            </div>
          ))}
        </section>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}