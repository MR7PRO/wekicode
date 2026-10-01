import { describe, it, expect } from "vitest";
import {
  allowedOrderTransitions, canTransitionOrder, canViewOrder, canClientSetPaymentStatus,
  calculatePlatformFee, calculateSellerPayout,
} from "@/lib/marketplace/orderState";
import { validateReview, calculateRatingAverage, isValidRating } from "@/lib/marketplace/reviewRules";
import { TEST_IDS } from "@/test/factories";

describe("order state machine", () => {
  it("only the seller can accept a pending order", () => {
    expect(canTransitionOrder("pending", "accepted", "seller")).toBe(true);
    expect(canTransitionOrder("pending", "accepted", "buyer")).toBe(false);
    expect(canTransitionOrder("pending", "accepted", "other")).toBe(false);
  });
  it("only the buyer can complete a submitted order", () => {
    expect(canTransitionOrder("submitted", "completed", "buyer")).toBe(true);
    expect(canTransitionOrder("submitted", "completed", "seller")).toBe(false);
  });
  it("cancelled is terminal", () => {
    for (const a of ["buyer", "seller", "staff", "other"] as const) expect(allowedOrderTransitions("cancelled", a)).toEqual([]);
  });
  it("only staff resolve disputes", () => {
    expect(allowedOrderTransitions("disputed", "staff").sort()).toEqual(["cancelled", "completed"]);
    expect(allowedOrderTransitions("disputed", "buyer")).toEqual([]);
  });
  it("outsiders can never view or act", () => {
    expect(canViewOrder("other")).toBe(false);
    expect(allowedOrderTransitions("pending", "other")).toEqual([]);
  });
  it("client can never mark an order paid", () => {
    for (const s of ["paid", "succeeded", "released", "refunded"]) expect(canClientSetPaymentStatus(s)).toBe(false);
  });
});

describe("fees", () => {
  it("computes percentage + fixed fee, rounded", () => {
    expect(calculatePlatformFee(500, 5)).toBe(25);
    expect(calculatePlatformFee(99.99, 10, 1)).toBe(11);
  });
  it("never exceeds the amount or goes negative", () => {
    expect(calculatePlatformFee(10, 100, 50)).toBe(10);
    expect(calculatePlatformFee(-100, 5)).toBe(0);
    expect(calculatePlatformFee(100, -5)).toBe(0);
  });
  it("payout is amount minus fee, never negative", () => {
    expect(calculateSellerPayout(500, 25)).toBe(475);
    expect(calculateSellerPayout(10, 50)).toBe(0);
  });
});

describe("review rules", () => {
  const base = {
    orderStatus: "completed" as const, reviewerId: TEST_IDS.userB, buyerId: TEST_IDS.userB,
    sellerId: TEST_IDS.userA, revieweeId: TEST_IDS.userA, alreadyReviewed: false, rating: 5,
  };
  it("accepts a valid buyer review", () => expect(validateReview(base).ok).toBe(true));
  it("rejects reviews before completion", () =>
    expect(validateReview({ ...base, orderStatus: "in_progress" }).reason).toBe("order_not_completed"));
  it("rejects outsiders", () =>
    expect(validateReview({ ...base, reviewerId: TEST_IDS.moderator }).reason).toBe("not_a_participant"));
  it("rejects self review", () =>
    expect(validateReview({ ...base, revieweeId: TEST_IDS.userB }).reason).toBe("self_review"));
  it("rejects duplicates", () =>
    expect(validateReview({ ...base, alreadyReviewed: true }).reason).toBe("duplicate_review"));
  it("rejects invalid ratings", () => {
    for (const r of [0, 6, 4.5, NaN]) expect(isValidRating(r)).toBe(false);
  });
  it("averages only visible reviews", () => {
    expect(calculateRatingAverage([
      { rating: 5 }, { rating: 4 }, { rating: 1, is_hidden: true }, { rating: 1, is_public: false },
    ])).toBe(4.5);
    expect(calculateRatingAverage([])).toBe(0);
  });
});
