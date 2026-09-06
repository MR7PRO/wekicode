/** Pure client-side review validation. The database enforces the same rules. */
import type { OrderStatus } from "./types";

export interface ReviewContext {
  orderStatus: OrderStatus;
  reviewerId: string;
  buyerId: string;
  sellerId: string;
  revieweeId: string;
  alreadyReviewed: boolean;
  rating: number;
}

export type ReviewRejection =
  | "order_not_completed"
  | "not_a_participant"
  | "self_review"
  | "duplicate_review"
  | "invalid_rating";

export function isValidRating(rating: unknown): boolean {
  return typeof rating === "number" && Number.isInteger(rating) && rating >= 1 && rating <= 5;
}

export function validateReview(ctx: ReviewContext): { ok: boolean; reason?: ReviewRejection } {
  if (ctx.orderStatus !== "completed") return { ok: false, reason: "order_not_completed" };
  if (ctx.reviewerId !== ctx.buyerId && ctx.reviewerId !== ctx.sellerId) return { ok: false, reason: "not_a_participant" };
  if (ctx.reviewerId === ctx.revieweeId) return { ok: false, reason: "self_review" };
  if (ctx.alreadyReviewed) return { ok: false, reason: "duplicate_review" };
  if (!isValidRating(ctx.rating)) return { ok: false, reason: "invalid_rating" };
  return { ok: true };
}

/** Average of visible (non-hidden, public) reviews, rounded to one decimal. */
export function calculateRatingAverage(reviews: { rating: number; is_public?: boolean; is_hidden?: boolean }[]): number {
  const visible = reviews.filter((r) => r.is_hidden !== true && r.is_public !== false && isValidRating(r.rating));
  if (visible.length === 0) return 0;
  const sum = visible.reduce((a, r) => a + r.rating, 0);
  return Math.round((sum / visible.length) * 10) / 10;
}
