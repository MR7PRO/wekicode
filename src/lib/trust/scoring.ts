/**
 * Pure display-side trust helpers.
 * The authoritative trust score and seller level are computed server-side
 * (recalculate_seller_trust); nothing here may be used to write those values.
 */
import type { SellerLevel, SellerLevelStatus } from "./types";

export const MIN_ORDERS_FOR_DATA = 3;
export const MIN_REVIEWS_FOR_DATA = 3;

export function clampTrustScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.min(100, Math.max(0, Math.round(score)));
}

export function hasEnoughTrustData(s: Pick<SellerLevelStatus, "completed_orders_count" | "reviews_count">): boolean {
  return s.completed_orders_count >= MIN_ORDERS_FOR_DATA || s.reviews_count >= MIN_REVIEWS_FOR_DATA;
}

export type TrustDisplay =
  | { kind: "insufficient_data"; label: string }
  | { kind: "score"; score: number; label: string };

/** A brand-new user must never be shown as untrustworthy — only as "not enough data". */
export function trustDisplay(status: SellerLevelStatus | null | undefined): TrustDisplay {
  if (!status || !hasEnoughTrustData(status)) {
    return { kind: "insufficient_data", label: "بيانات غير كافية" };
  }
  const score = clampTrustScore(status.trust_score);
  return { kind: "score", score, label: `${score}/100` };
}

export interface LevelInputs {
  completed_orders_count: number;
  average_rating: number;
  reviews_count: number;
  cancelled_orders_count: number;
  disputed_orders_count: number;
  on_time_delivery_rate: number;
  professional_verified: boolean;
  has_active_serious_restriction?: boolean;
}

const LEVEL_ORDER: SellerLevel[] = ["new", "active", "professional", "elite", "partner"];

/** Mirrors the server rules so the UI can preview the next level. Never authoritative. */
export function deriveSellerLevel(i: LevelInputs): SellerLevel {
  if (i.has_active_serious_restriction) return "new";
  const quality = i.average_rating >= 4.5 && i.reviews_count >= MIN_REVIEWS_FOR_DATA;
  const clean = i.disputed_orders_count === 0 && i.cancelled_orders_count <= 1;
  const onTime = i.on_time_delivery_rate >= 0.9;

  if (i.completed_orders_count >= 50 && quality && clean && onTime && i.professional_verified) return "partner";
  if (i.completed_orders_count >= 20 && quality && clean && onTime && i.professional_verified) return "elite";
  if (i.completed_orders_count >= 10 && i.average_rating >= 4.2 && i.reviews_count >= MIN_REVIEWS_FOR_DATA && clean) return "professional";
  if (i.completed_orders_count >= 1) return "active";
  return "new";
}

export function levelRank(level: SellerLevel): number {
  return LEVEL_ORDER.indexOf(level);
}

/** Users can never pick their own level. */
export function canUserSetOwnSellerLevel(): boolean {
  return false;
}
