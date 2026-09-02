import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { fetchMyRestrictions } from "@/lib/trust/api";
import { RESTRICTION_TYPE_LABELS, type AccountRestriction } from "@/lib/trust/types";
import { isFeatureEnabled } from "@/lib/featureFlags";
import { toast } from "sonner";
import { ShieldAlert, Loader2 } from "lucide-react";

export default function SecuritySettings() {
  const { user } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [restrictions, setRestrictions] = useState<AccountRestriction[]>([]);

  useEffect(() => {
    if (user) fetchMyRestrictions(user.id).then(setRestrictions);
  }, [user]);

  const changePassword = async () => {
    if (password.length < 8) return toast.error("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
    if (password !== confirm) return toast.error("كلمتا المرور غير متطابقتين");
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) return toast.error("تعذر تحديث كلمة المرور");
    setPassword(""); setConfirm("");
    toast.success("تم تحديث كلمة المرور");
  };

  return (
    <PageShell title="أمان الحساب" description="إعدادات أمان حساب WekiCode" path="/settings/security" noindex width="narrow">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <ShieldAlert className="w-6 h-6 text-primary" /> أمان الحساب
      </h1>

      <Card className="mb-5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">تغيير كلمة المرور</CardTitle>
          <CardDescription>استخدم كلمة مرور قوية وغير مستخدمة في مواقع أخرى.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>كلمة المرور الجديدة</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>تأكيد كلمة المرور</Label>
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          <Button onClick={changePassword} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 animate-spin ml-2" />} تحديث كلمة المرور
          </Button>
        </CardContent>
      </Card>

      {isFeatureEnabled("account_mfa_enabled") && (
        <Card className="mb-5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">التحقق بخطوتين</CardTitle>
            <CardDescription>سيتوفر قريبًا لحسابات WekiCode.</CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card className={restrictions.length ? "border-destructive/40" : undefined}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">قيود الحساب</CardTitle>
          <CardDescription>
            {restrictions.length === 0 ? "لا توجد قيود نشطة على حسابك." : "توجد قيود نشطة على حسابك."}
          </CardDescription>
        </CardHeader>
        {restrictions.length > 0 && (
          <CardContent className="space-y-3">
            {restrictions.map((r) => (
              <div key={r.id} className="rounded-lg border p-3 text-sm">
                <p className="font-medium">{RESTRICTION_TYPE_LABELS[r.restriction_type] ?? r.restriction_type}</p>
                {r.public_message && <p className="text-xs text-muted-foreground mt-1">{r.public_message}</p>}
              </div>
            ))}
            {isFeatureEnabled("appeals_enabled") && (
              <Button asChild variant="outline" size="sm"><Link to="/appeals">تقديم تظلّم</Link></Button>
            )}
          </CardContent>
        )}
      </Card>
    </PageShell>
  );
}
