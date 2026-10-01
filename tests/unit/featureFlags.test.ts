import { describe, it, expect } from "vitest";
import { isFeatureEnabled } from "@/lib/featureFlags";

describe("feature flag safety defaults", () => {
  it("keeps real payments and providers off by default", () => {
    expect(isFeatureEnabled("payments_enabled")).toBe(false);
    expect(isFeatureEnabled("provider_stripe_enabled")).toBe(false);
    expect(isFeatureEnabled("provider_paypal_enabled")).toBe(false);
  });
  it("keeps official identity verification off until a provider exists", () => {
    expect(isFeatureEnabled("identity_verification_enabled")).toBe(false);
  });
  it("enables core marketplace and trust features", () => {
    for (const k of ["marketplace_enabled", "orders_enabled", "reviews_enabled", "trust_system_enabled", "appeals_enabled"] as const) {
      expect(isFeatureEnabled(k)).toBe(true);
    }
  });
});
