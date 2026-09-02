import { useEffect, useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchPrivacyPreferences, savePrivacyPreferences, fetchExportRequests, requestDataExport,
  fetchDeletionRequest, requestAccountDeletion, cancelAccountDeletion,
} from "@/lib/trust/api";
import { isFeatureEnabled } from "@/lib/featureFlags";
import { toast } from "sonner";
import { Lock } from "lucide-react";

export default function PrivacySettings() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState({ analytics_enabled: true, personalization_enabled: true, marketing_enabled: false });
  const [exports, setExports] = useState<{ id: string; status: string; requested_at: string }[]>([]);
  const [deletion, setDeletion] = useState<{ id: string; status: string; scheduled_for: string | null } | null>(null);
  const [reason, setReason] = useState("");

  const reload = async () => {
    if (!user) return;
    const [p, e, d] = await Promise.all([
      fetchPrivacyPreferences(user.id), fetchExportRequests(user.id), fetchDeletionRequest(user.id),
    ]);
    if (p) setPrefs({ analytics_enabled: p.analytics_enabled, personalization_enabled: p.personalization_enabled, marketing_enabled: p.marketing_enabled });
    setExports(e);
    setDeletion(d);
  };

  useEffect(() => { reload(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user]);

  const toggle = async (key: keyof typeof prefs, value: boolean) => {
    if (!user) return;
    setPrefs((p) => ({ ...p, [key]: value }));
    try {
      await savePrivacyPreferences(user.id, { [key]: value });
      toast.success("تم حفظ التفضيل");
    } catch {
      toast.error("تعذر الحفظ");
    }
  };

  return (
    <PageShell title="الخصوصية والبيانات" description="تفضيلات الخصوصية وطلبات البيانات" path="/settings/privacy" noindex width="narrow">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Lock className="w-6 h-6 text-primary" /> الخصوصية والبيانات
      </h1>

      <Card className="mb-5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">تفضيلات الخصوصية</CardTitle>
          <CardDescription>تحكّم بكيفية استخدام بياناتك داخل المنصة.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {([
            ["analytics_enabled", "تحليلات الاستخدام", "قياس الاستخدام لتحسين المنصة."],
            ["personalization_enabled", "التخصيص", "اقتراح محتوى وخدمات مناسبة لك."],
            ["marketing_enabled", "رسائل تسويقية", "استقبال تحديثات وعروض عبر البريد."],
          ] as const).map(([key, title, desc]) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{title}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <Switch checked={prefs[key]} onCheckedChange={(v) => toggle(key, v)} />
            </div>
          ))}
        </CardContent>
      </Card>

      {isFeatureEnabled("data_export_enabled") && (
        <Card className="mb-5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">تصدير بياناتي</CardTitle>
            <CardDescription>يمكن تقديم طلب واحد كل 24 ساعة.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              onClick={async () => {
                if (!user) return;
                try { await requestDataExport(user.id); toast.success("تم استلام طلب التصدير"); reload(); }
                catch { toast.error("تعذر تقديم الطلب الآن"); }
              }}
            >
              طلب نسخة من بياناتي
            </Button>
            {exports.length > 0 && (
              <ul className="text-xs text-muted-foreground space-y-1">
                {exports.map((e) => (
                  <li key={e.id}>{new Date(e.requested_at).toLocaleDateString("ar")} — {e.status}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {isFeatureEnabled("account_deletion_enabled") && (
        <Card className="border-destructive/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-destructive">حذف الحساب</CardTitle>
            <CardDescription>لا يمكن الحذف أثناء وجود طلبات نشطة. تُجدول العملية بعد 14 يومًا.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {deletion ? (
              <>
                <p className="text-sm">
                  الحالة: {deletion.status === "blocked_pending_orders" ? "موقوف بسبب طلبات نشطة" : "مجدول"}
                  {deletion.scheduled_for && ` — ${new Date(deletion.scheduled_for).toLocaleDateString("ar")}`}
                </p>
                <Button variant="outline" onClick={async () => { await cancelAccountDeletion(deletion.id); toast.success("تم إلغاء طلب الحذف"); reload(); }}>
                  إلغاء طلب الحذف
                </Button>
              </>
            ) : (
              <>
                <Textarea rows={3} placeholder="سبب الحذف (اختياري)" value={reason} onChange={(e) => setReason(e.target.value)} />
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (!user) return;
                    const { blocked } = await requestAccountDeletion(user.id, reason);
                    toast[blocked ? "error" : "success"](blocked ? "لديك طلبات نشطة، أكملها أولًا" : "تم جدولة حذف الحساب");
                    reload();
                  }}
                >
                  طلب حذف الحساب
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
