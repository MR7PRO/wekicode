import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Smartphone, Trash2, Wifi, Bell, CheckCircle2, XCircle } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/seo/SEOHead";
import { toast } from "@/hooks/use-toast";
import { clearAppCaches, isStandalone } from "@/pwa/pwaUtils";
import { useOfflineSavedItems } from "@/hooks/useOfflineSavedItems";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";

function Status({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-sm">
      {ok ? (
        <CheckCircle2 className="w-4 h-4 text-success" />
      ) : (
        <XCircle className="w-4 h-4 text-muted-foreground" />
      )}
      {label}
    </span>
  );
}

export default function AppSettings() {
  const { items, clear } = useOfflineSavedItems();
  const { canInstall, install, isIOS } = useInstallPrompt();
  const [swActive, setSwActive] = useState(false);
  const installed = isStandalone();

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.getRegistration().then((r) => setSwActive(!!r?.active));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="إعدادات التطبيق" description="حالة التطبيق والمحتوى المحفوظ بدون اتصال." path="/settings/app" noindex />
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-2xl pb-24 space-y-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Smartphone className="w-6 h-6 text-primary" /> إعدادات التطبيق
        </h1>

        <section className="rounded-2xl border border-border/60 bg-card/60 p-4 space-y-2">
          <h2 className="font-semibold text-sm mb-2">حالة التطبيق</h2>
          <Status ok={installed} label={installed ? "مثبّت على الجهاز" : "غير مثبّت"} />
          <Status ok={swActive} label={swActive ? "وضع العمل بدون اتصال مفعّل" : "وضع العمل بدون اتصال غير مفعّل"} />
          {!installed && (
            <div className="pt-2">
              {canInstall ? (
                <Button size="sm" onClick={install}>تثبيت التطبيق</Button>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {isIOS
                    ? "من زر المشاركة في Safari اختر Add to Home Screen."
                    : "استخدم خيار «تثبيت التطبيق» من قائمة المتصفح."}
                </p>
              )}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border/60 bg-card/60 p-4">
          <h2 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <Wifi className="w-4 h-4 text-primary" /> المحتوى المحفوظ بدون اتصال
          </h2>
          <p className="text-sm text-muted-foreground mb-3">{items.length} عنصر محفوظ على هذا الجهاز.</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link to="/saved-offline">عرض المحفوظات</Link>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="gap-1"
              onClick={async () => {
                clear();
                await clearAppCaches();
                toast({ title: "تم مسح المحتوى المحفوظ" });
              }}
            >
              <Trash2 className="w-4 h-4" /> مسح الذاكرة المؤقتة
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border border-border/60 bg-card/60 p-4">
          <h2 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" /> الإشعارات
          </h2>
          <Button size="sm" variant="outline" asChild>
            <Link to="/settings/notifications">إدارة تفضيلات الإشعارات</Link>
          </Button>
        </section>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}