import { BadgeCheck, ShieldCheck, Mail, Phone, CreditCard, Building2, Clock, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  VERIFICATION_TYPE_LABELS, VERIFICATION_TYPE_MEANING, VERIFICATION_DISCLAIMER,
  VERIFICATION_STATUS_LABELS, type VerificationStatus, type VerificationType,
} from "@/lib/trust/types";

const ICONS: Record<VerificationType, typeof BadgeCheck> = {
  email: Mail,
  phone: Phone,
  professional_profile: BadgeCheck,
  identity: ShieldCheck,
  payment_account: CreditCard,
  business: Building2,
};

interface Props {
  type: VerificationType;
  status: VerificationStatus;
  size?: "sm" | "md";
  showLabel?: boolean;
  showTooltip?: boolean;
  className?: string;
}

export function VerificationBadge({
  type, status, size = "sm", showLabel = true, showTooltip = true, className,
}: Props) {
  const Icon =
    status === "under_review" || status === "pending" ? Clock
    : status === "action_required" || status === "rejected" || status === "expired" || status === "suspended" ? AlertTriangle
    : ICONS[type];

  const tone =
    status === "approved" ? "border-primary/40 bg-primary/10 text-primary"
    : status === "under_review" || status === "pending" ? "border-border bg-muted/60 text-muted-foreground"
    : status === "rejected" || status === "suspended" || status === "expired" ? "border-destructive/40 bg-destructive/10 text-destructive"
    : status === "action_required" ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
    : "border-border bg-muted/40 text-muted-foreground";

  const badge = (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        tone, className,
      )}
    >
      <Icon className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      {showLabel && <span>{VERIFICATION_TYPE_LABELS[type]}</span>}
    </span>
  );

  if (!showTooltip) return badge;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent className="max-w-xs text-right leading-relaxed">
        <p className="font-semibold">{VERIFICATION_TYPE_LABELS[type]}</p>
        <p className="text-xs mt-1">{VERIFICATION_TYPE_MEANING[type]}</p>
        <p className="text-xs mt-1 opacity-80">الحالة: {VERIFICATION_STATUS_LABELS[status]}</p>
        <p className="text-[11px] mt-1 opacity-70">{VERIFICATION_DISCLAIMER}</p>
      </TooltipContent>
    </Tooltip>
  );
}