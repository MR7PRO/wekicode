import { Star, PackageCheck, ShieldQuestion, CalendarDays } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SellerLevelBadge } from "./SellerLevelBadge";
import { VerificationBadge } from "./VerificationBadge";
import { TRUST_DISCLAIMER, type SellerLevelStatus, type VerificationSummary } from "@/lib/trust/types";
import { isFeatureEnabled } from "@/lib/featureFlags";

interface Props {
  level?: SellerLevelStatus | null;
  verification?: VerificationSummary | null;
  memberSince?: string | null;
  compact?: boolean;
}

export function TrustIndicators({ level, verification, memberSince, compact }: Props) {
  const showLevels = isFeatureEnabled("seller_levels_enabled");
  const showScore = isFeatureEnabled("trust_score_enabled");
  const paymentsOn = isFeatureEnabled("payments_enabled");
  const identityOn = isFeatureEnabled("identity_verification_enabled");

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {showLevels && level && <SellerLevelBadge level={level.current_level} />}
        {verification?.professional_verified && (
          <VerificationBadge type="professional_profile" status="approved" />
        )}
        {verification?.email_verified && <VerificationBadge type="email" status="approved" />}
        {identityOn && verification?.identity_verified && <VerificationBadge type="identity" status="approved" />}
        {paymentsOn && verification?.payment_verified && <VerificationBadge type="payment_account" status="approved" />}
      </div>

      {!compact && level && (
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-amber-500" />
            {level.reviews_count > 0 ? `${Number(level.average_rating).toFixed(1)} (${level.reviews_count})` : "لا توجد تقييمات بعد"}
          </span>
          <span className="inline-flex items-center gap-1">
            <PackageCheck className="w-3.5 h-3.5" /> {level.completed_orders_count} طلب مكتمل
          </span>
          {memberSince && (
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5" />
              عضو منذ {new Date(memberSince).toLocaleDateString("ar", { year: "numeric", month: "long" })}
            </span>
          )}
          {showScore && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-1">
                  <ShieldQuestion className="w-3.5 h-3.5" />
                  مؤشر الثقة: {level.has_enough_data ? `${level.trust_score}/100` : "بيانات غير كافية"}
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-right">{TRUST_DISCLAIMER}</TooltipContent>
            </Tooltip>
          )}
        </div>
      )}
    </div>
  );
}