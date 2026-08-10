/**
 * Payment provider abstraction.
 *
 * IMPORTANT SECURITY NOTES
 * - No provider secret ever lives in this file or anywhere in the frontend.
 * - The frontend only ever calls edge functions, which hold the secrets.
 * - Nothing here marks an order as paid. Only a verified server-side webhook
 *   may transition a payment_intent to `paid`.
 * - There is NO escrow. Do not claim funds are held or protected.
 */
import { supabase } from "@/integrations/supabase/client";
import { isFeatureEnabled } from "@/lib/featureFlags";

export type PaymentProviderId = "stripe" | "paypal" | "manual" | "none";

export interface CheckoutRequest {
  orderId: string;
  amount: number;
  currency: string;
}

export interface CheckoutResult {
  ok: boolean;
  /** Hosted checkout URL, when the provider supports one. */
  url?: string;
  paymentIntentId?: string;
  message?: string;
}

export interface PaymentStatusResult {
  status: "created" | "pending" | "paid" | "failed" | "cancelled" | "refunded" | "unknown";
  message?: string;
}

export interface PaymentProvider {
  id: PaymentProviderId;
  label: string;
  /** True only when the server side is actually configured. */
  isConfigured(): boolean;
  createCheckout(req: CheckoutRequest): Promise<CheckoutResult>;
  verifyPaymentStatus(orderId: string): Promise<PaymentStatusResult>;
  refundPayment(orderId: string): Promise<{ ok: boolean; message?: string }>;
  createSellerOnboardingLink(): Promise<{ ok: boolean; url?: string; message?: string }>;
}

const NOT_CONFIGURED = "الدفع الإلكتروني غير مفعّل حاليًا.";

/** Manual mode: the two parties agree outside the platform. WekiCode does not move money. */
class ManualPaymentProvider implements PaymentProvider {
  id: PaymentProviderId = "manual";
  label = "اتفاق يدوي خارج المنصة";
  isConfigured() { return isFeatureEnabled("manual_payment_enabled"); }
  async createCheckout(req: CheckoutRequest): Promise<CheckoutResult> {
    const { data, error } = await supabase.functions.invoke("create-payment-intent", {
      body: { orderId: req.orderId, provider: "manual" },
    });
    if (error) return { ok: false, message: error.message };
    return { ok: true, paymentIntentId: data?.paymentIntentId, message: "WekiCode لا يدير الدفع لهذا الطلب حاليًا." };
  }
  async verifyPaymentStatus() { return { status: "unknown" as const, message: "يتم تأكيد الدفع بين الطرفين خارج المنصة." }; }
  async refundPayment() { return { ok: false, message: "الاسترداد يتم بين الطرفين مباشرة." }; }
  async createSellerOnboardingLink() { return { ok: false, message: "لا يلزم حساب استلام في الوضع اليدوي." }; }
}

/** TODO(Phase 10): wire real Stripe once keys + legal setup exist. */
class StripeProvider implements PaymentProvider {
  id: PaymentProviderId = "stripe";
  label = "Stripe";
  isConfigured() { return isFeatureEnabled("provider_stripe_enabled") && isFeatureEnabled("payments_enabled"); }
  async createCheckout(req: CheckoutRequest): Promise<CheckoutResult> {
    if (!this.isConfigured()) return { ok: false, message: NOT_CONFIGURED };
    const { data, error } = await supabase.functions.invoke("create-payment-intent", {
      body: { orderId: req.orderId, provider: "stripe" },
    });
    if (error) return { ok: false, message: error.message };
    return { ok: !!data?.url, url: data?.url, paymentIntentId: data?.paymentIntentId, message: data?.message };
  }
  async verifyPaymentStatus(orderId: string): Promise<PaymentStatusResult> {
    if (!this.isConfigured()) return { status: "unknown", message: NOT_CONFIGURED };
    const { data } = await supabase.functions.invoke("create-payment-intent", {
      body: { orderId, provider: "stripe", action: "status" },
    });
    return { status: data?.status ?? "unknown" };
  }
  async refundPayment() { return { ok: false, message: "الاسترداد غير مفعّل بعد." }; }
  async createSellerOnboardingLink() {
    if (!this.isConfigured()) return { ok: false, message: NOT_CONFIGURED };
    const { data, error } = await supabase.functions.invoke("connect-seller-account", { body: { provider: "stripe" } });
    if (error) return { ok: false, message: error.message };
    return { ok: !!data?.url, url: data?.url, message: data?.message };
  }
}

/** TODO(Phase 10): wire real PayPal once merchant account exists. */
class PayPalProvider implements PaymentProvider {
  id: PaymentProviderId = "paypal";
  label = "PayPal";
  isConfigured() { return isFeatureEnabled("provider_paypal_enabled") && isFeatureEnabled("payments_enabled"); }
  async createCheckout(): Promise<CheckoutResult> { return { ok: false, message: NOT_CONFIGURED }; }
  async verifyPaymentStatus(): Promise<PaymentStatusResult> { return { status: "unknown", message: NOT_CONFIGURED }; }
  async refundPayment() { return { ok: false, message: NOT_CONFIGURED }; }
  async createSellerOnboardingLink() { return { ok: false, message: NOT_CONFIGURED }; }
}

const PROVIDERS: Record<Exclude<PaymentProviderId, "none">, PaymentProvider> = {
  stripe: new StripeProvider(),
  paypal: new PayPalProvider(),
  manual: new ManualPaymentProvider(),
};

export function getProvider(id: PaymentProviderId): PaymentProvider | null {
  if (id === "none") return null;
  return PROVIDERS[id] ?? null;
}

/** The provider actually usable right now, or null when nothing is configured. */
export function getActiveProvider(): PaymentProvider | null {
  if (isFeatureEnabled("payments_enabled")) {
    if (PROVIDERS.stripe.isConfigured()) return PROVIDERS.stripe;
    if (PROVIDERS.paypal.isConfigured()) return PROVIDERS.paypal;
  }
  if (PROVIDERS.manual.isConfigured()) return PROVIDERS.manual;
  return null;
}

export function isOnlinePaymentAvailable(): boolean {
  const p = getActiveProvider();
  return !!p && p.id !== "manual";
}

export const PAYMENT_DISABLED_MESSAGE = NOT_CONFIGURED;
export const MANUAL_PAYMENT_NOTICE = "WekiCode لا يدير الدفع لهذا الطلب حاليًا. الاتفاق والدفع يتمان مباشرة بينك وبين الطرف الآخر.";

/** Estimate the platform cut for display only — the database recomputes it authoritatively. */
export function estimateFees(price: number, percentage: number, fixedFee: number) {
  const fee = Math.round((price * percentage / 100 + fixedFee) * 100) / 100;
  return { fee, sellerAmount: Math.max(Math.round((price - fee) * 100) / 100, 0) };
}