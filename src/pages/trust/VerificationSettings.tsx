import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { VerificationBadge } from "@/components/trust/VerificationBadge";
import { fetchMyVerifications, fetchSellerLevel } from "@/lib/trust/api";
import {
  VERIFICATION_DISCLAIMER, VERIFICATION_TYPE_LABELS, VERIFICATION_TYPE_MEANING,
  VERIFICATION_STATUS_LABELS, SELLER_LEVEL_CRITERIA, SELLER_LEVEL_LABELS,
  type SellerLevelStatus, type UserVerification, type VerificationType, type VerificationStatus,
} from "@/lib/trust/types";
import { isFeatureEnabled } from "@/lib/featureFlags";
import { ShieldCheck } from "lucide-react";

const ORDER: VerificationType[] = ["email", "professional_profile", "identity", "payment_account"];

export default function VerificationSettings() {
  const { user } = useAuth();
  const [rows, setRows] = useState<UserVerification[]>([]);
  const [level, setLevel] = useState<SellerLevelStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [v, l] = await Promise.all([fetchMyVerifications(user.id), fetchSellerLevel(user.id)]);
      setRows(v);
      setLevel(l);
      setLoading(false);
    })();
  }, [user]);

  const statusOf = (t: VerificationType): VerificationStatus => {
    if (t === "email" && user?.email_confirmed_at) return "approved";
    return (rows.find((r) => r.verification_type === t)?.status ?? "not_started") as VerificationStatus;
  };

  const identityOn = isFeatureEnabled("identity_verification_enabled");
  const paymentsOn = isFeatureEnabled("payments_enabled");
  const proOn = isFeatureEnabled("professional_verification_enabled");

  return (
    <PageShell title="التحقق من الحساب" description="حالة التحقق لحسابك في WekiCode" path="/settings/verification" noindex width="narrow">
      <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
        <ShieldCheck className="w-6 h-6 text-primary" /> التحقق من الحساب
      </h1>
      <p className="text-sm text-muted-foreground mb-6">{VERIFICATION_DISCLAIMER}</p>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="space-y-4">
          {ORDER.map((t) => {
            const disabled =
              (t === "identity" && !identityOn) ||
              (t === "payment_account" && !paymentsOn) ||
              (t === "professional_profile" && !proOn);
            const status = statusOf(t);
            return (
              <Card key={t}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">{VERIFICATION_TYPE_LABELS[t]}</CardTitle>
                      <CardDescription className="mt-1">{VERIFICATION_TYPE_MEANING[t]}</CardDescription>
                    </div>
                    <VerificationBadge type={t} status={status} showLabel={false} />
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-3 pt-0">
                  <span className="text-xs text-muted-foreground">
                    الحالة: {disabled ? "غير مفعّل حاليًا" : VERIFICATION_STATUS_LABELS[status]}
                  </span>
                  {t === "professional_profile" && proOn && status !== "approved" && (
                    <Button asChild size="sm">
                      <Link to="/verification/professional">تقديم طلب التحقق المهني</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {isFeatureEnabled("seller_levels_enabled") && level && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">مستواك الحالي: {SELLER_LEVEL_LABELS[level.current_level]}</CardTitle>
                <CardDescription>{SELLER_LEVEL_CRITERIA[level.current_level]}</CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                {level.completed_orders_count} طلب مكتمل · {level.reviews_count} تقييم
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </PageShell>
  );
}
