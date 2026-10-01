import { describe, it, expect } from "vitest";
import { absUrl, breadcrumbLd, clamp, SITE_URL } from "@/lib/seo";

describe("seo helpers", () => {
  it("builds absolute URLs with or without leading slash", () => {
    expect(absUrl("/forums")).toBe(`${SITE_URL}/forums`);
    expect(absUrl("forums")).toBe(`${SITE_URL}/forums`);
  });
  it("builds ordered breadcrumb JSON-LD", () => {
    const ld = breadcrumbLd([{ name: "الرئيسية", path: "/" }, { name: "المنتديات", path: "/forums" }]);
    expect(ld["@type"]).toBe("BreadcrumbList");
    expect(ld.itemListElement.map((x) => x.position)).toEqual([1, 2]);
    expect(ld.itemListElement[1].item).toBe(`${SITE_URL}/forums`);
  });
  it("clamps descriptions and collapses whitespace", () => {
    expect(clamp("  a   b  ")).toBe("a b");
    expect(clamp(null)).toBe("");
    const out = clamp("x".repeat(300), 155);
    expect(out.length).toBe(155);
    expect(out.endsWith("…")).toBe(true);
  });
});
