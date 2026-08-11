import type { VerificationStatus, VerificationType } from "@/lib/trust/types";
import { isFeatureEnabled } from "@/lib/featureFlags";

export interface VerificationSession {
  sessionId: string | null;
  redirectUrl: string | null;
  status: VerificationStatus;
  message?: string;
}

export interface VerificationProvider {
  readonly id: string;
  readonly isConfigured: boolean;
  createVerificationSession(type: VerificationType): Promise<VerificationSession>;
  retrieveVerificationStatus(reference: string): Promise<VerificationStatus>;
  cancelVerificationSession(reference: string): Promise<void>;
  getRequiredActions(): string[];
}

export const PROVIDER_UNAVAILABLE_MESSAGE = "التحقق الرسمي من الهوية غير متاح حاليًا.";

/** Default provider: nothing is configured, so nothing can be verified. */
export const DisabledVerificationProvider: VerificationProvider = {
  id: "disabled",
  isConfigured: false,
  async createVerificationSession() {
    return { sessionId: null, redirectUrl: null, status: "not_started", message: PROVIDER_UNAVAILABLE_MESSAGE };
  },
  async retrieveVerificationStatus() { return "not_started"; },
  async cancelVerificationSession() { /* nothing to cancel */ },
  getRequiredActions() { return [PROVIDER_UNAVAILABLE_MESSAGE]; },
};

/** Manual WekiCode professional review — this is NOT government identity verification. */
export const ProfessionalReviewProvider: VerificationProvider = {
  id: "wekicode_professional_review",
  isConfigured: true,
  async createVerificationSession() {
    return { sessionId: null, redirectUrl: "/verification/professional", status: "not_started" };
  },
  async retrieveVerificationStatus() { return "under_review"; },
  async cancelVerificationSession() { /* handled through the request record */ },
  getRequiredActions() {
    return [
      "أكمل الملف المهني (الاسم، اسم المستخدم، النبذة، العنوان المهني).",
      "أضف 3 مهارات على الأقل.",
      "أضف رابط أعمال أو نماذج عمل.",
      "وافق على معايير جودة سوق WekiCode.",
    ];
  },
};

/**
 * TODO: Stripe Connect / Stripe Identity.
 * Requires server-side secrets, signed webhooks and an approved account.
 * Until then it must behave exactly like the disabled provider.
 */
export const StripeConnectVerificationProvider: VerificationProvider = {
  ...DisabledVerificationProvider,
  id: "stripe_connect_todo",
};

export function getIdentityProvider(): VerificationProvider {
  if (!isFeatureEnabled("identity_verification_enabled")) return DisabledVerificationProvider;
  return StripeConnectVerificationProvider;
}

export function getPaymentAccountProvider(): VerificationProvider {
  if (!isFeatureEnabled("payments_enabled")) return DisabledVerificationProvider;
  return StripeConnectVerificationProvider;
}

export function getProfessionalProvider(): VerificationProvider {
  if (!isFeatureEnabled("professional_verification_enabled")) return DisabledVerificationProvider;
  return ProfessionalReviewProvider;
}