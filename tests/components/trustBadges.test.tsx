import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "@/test/render";
import { VerificationBadge } from "@/components/trust/VerificationBadge";
import { SellerLevelBadge } from "@/components/trust/SellerLevelBadge";
import { SELLER_LEVEL_LABELS, VERIFICATION_TYPE_LABELS } from "@/lib/trust/types";

describe("SellerLevelBadge", () => {
  it.each(["new", "active", "professional", "elite", "partner"] as const)("renders %s label", (level) => {
    renderWithProviders(<SellerLevelBadge level={level} />);
    expect(screen.getByText(SELLER_LEVEL_LABELS[level])).toBeInTheDocument();
  });
});

describe("VerificationBadge", () => {
  it("shows the verification type label when approved", () => {
    renderWithProviders(<VerificationBadge type="email" status="approved" showTooltip={false} />);
    expect(screen.getByText(new RegExp(VERIFICATION_TYPE_LABELS.email))).toBeInTheDocument();
  });
  it("renders a non-approved status without crashing", () => {
    const { container } = renderWithProviders(<VerificationBadge type="identity" status="rejected" showTooltip={false} />);
    expect(container.textContent?.length).toBeGreaterThan(0);
  });
});
