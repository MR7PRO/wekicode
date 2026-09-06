/**
 * Pure order/payment state rules shared by UI and tests.
 * The database remains the authority; this only prevents the client from
 * offering an illegal transition in the first place.
 */
import type { OrderStatus } from "./types";

export type OrderActor = "buyer" | "seller" | "staff" | "other";

const TRANSITIONS: Record<OrderStatus, { to: OrderStatus; by: OrderActor[] }[]> = {
  pending: [
    { to: "accepted", by: ["seller"] },
    { to: "cancelled", by: ["buyer", "seller", "staff"] },
  ],
  accepted: [
    { to: "in_progress", by: ["seller"] },
    { to: "cancelled", by: ["buyer", "seller", "staff"] },
  ],
  in_progress: [
    { to: "submitted", by: ["seller"] },
    { to: "disputed", by: ["buyer", "seller"] },
    { to: "cancelled", by: ["staff"] },
  ],
  submitted: [
    { to: "revision_requested", by: ["buyer"] },
    { to: "completed", by: ["buyer"] },
    { to: "disputed", by: ["buyer", "seller"] },
  ],
  revision_requested: [
    { to: "submitted", by: ["seller"] },
    { to: "disputed", by: ["buyer", "seller"] },
  ],
  completed: [{ to: "disputed", by: ["buyer"] }],
  cancelled: [],
  disputed: [
    { to: "completed", by: ["staff"] },
    { to: "cancelled", by: ["staff"] },
  ],
};

export function allowedOrderTransitions(from: OrderStatus, actor: OrderActor): OrderStatus[] {
  return (TRANSITIONS[from] ?? []).filter((t) => t.by.includes(actor)).map((t) => t.to);
}

export function canTransitionOrder(from: OrderStatus, to: OrderStatus, actor: OrderActor): boolean {
  return allowedOrderTransitions(from, actor).includes(to);
}

/** Only buyer, seller and staff may open an order at all. */
export function canViewOrder(actor: OrderActor): boolean {
  return actor !== "other";
}

/** The client can never declare an order paid — only a verified server webhook can. */
export const CLIENT_SETTABLE_PAYMENT_STATUSES = [] as const;
export function canClientSetPaymentStatus(_status: string): boolean {
  void _status;
  return false;
}

/** Platform fee, rounded to 2 decimals, never negative. */
export function calculatePlatformFee(amount: number, percentage: number, fixedFee = 0): number {
  const safeAmount = Math.max(0, Number(amount) || 0);
  const safePct = Math.min(100, Math.max(0, Number(percentage) || 0));
  const fee = (safeAmount * safePct) / 100 + Math.max(0, Number(fixedFee) || 0);
  return Math.round(Math.min(fee, safeAmount) * 100) / 100;
}

export function calculateSellerPayout(amount: number, fee: number): number {
  return Math.round(Math.max(0, (Number(amount) || 0) - Math.max(0, Number(fee) || 0)) * 100) / 100;
}
