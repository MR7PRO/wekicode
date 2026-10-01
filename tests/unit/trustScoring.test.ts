import { describe, it, expect } from "vitest";
import { clampTrustScore, trustDisplay, deriveSellerLevel, canUserSetOwnSellerLevel, levelRank } from "@/lib/trust/scoring";
import { createTestSellerLevel } from "@/test/factories";

const baseInputs = {
  completed_orders_count: 0, average_rating: 0, reviews_count: 0, cancelled_orders_count: 0,
  disputed_orders_count: 0, on_time_delivery_rate: 0, professional_verified: false,
};

describe("trust scoring (display only)", () => {
  it("clamps scores to 0-100", () => {
    expect(clampTrustScore(150)).toBe(100);
    expect(clampTrustScore(-5)).toBe(0);
    expect(clampTrustScore(NaN)).toBe(0);
  });
  it("never labels new users as untrustworthy", () => {
    expect(trustDisplay(createTestSellerLevel({ trust_score: 5 })).kind).toBe("insufficient_data");
    expect(trustDisplay(null).kind).toBe("insufficient_data");
  });
  it("shows a score once there is enough data", () => {
    const d = trustDisplay(createTestSellerLevel({ completed_orders_count: 5, trust_score: 82 }));
    expect(d).toEqual({ kind: "score", score: 82, label: "82/100" });
  });
});

describe("seller levels", () => {
  it("new → active after first completed order", () => {
    expect(deriveSellerLevel(baseInputs)).toBe("new");
    expect(deriveSellerLevel({ ...baseInputs, completed_orders_count: 1 })).toBe("active");
  });
  it("elite/partner require professional verification", () => {
    const strong = { ...baseInputs, completed_orders_count: 60, average_rating: 4.9, reviews_count: 40, on_time_delivery_rate: 0.97 };
    expect(deriveSellerLevel(strong)).toBe("professional");
    expect(deriveSellerLevel({ ...strong, professional_verified: true })).toBe("partner");
  });
  it("disputes block higher levels", () => {
    const i = { ...baseInputs, completed_orders_count: 30, average_rating: 4.9, reviews_count: 10, on_time_delivery_rate: 1, professional_verified: true, disputed_orders_count: 1 };
    expect(deriveSellerLevel(i)).toBe("active");
  });
  it("serious restrictions reset to new", () => {
    expect(deriveSellerLevel({ ...baseInputs, completed_orders_count: 99, has_active_serious_restriction: true })).toBe("new");
  });
  it("levels are ordered and never self-assignable", () => {
    expect(levelRank("partner")).toBeGreaterThan(levelRank("elite"));
    expect(canUserSetOwnSellerLevel()).toBe(false);
  });
});
