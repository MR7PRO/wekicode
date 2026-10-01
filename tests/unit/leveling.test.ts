import { describe, it, expect } from "vitest";
import { computeLevelInfo, LEVEL_THRESHOLDS, MAX_LEVEL } from "@/lib/leveling";

describe("computeLevelInfo", () => {
  it("starts new users at level 1 with 0 progress", () => {
    const i = computeLevelInfo(0);
    expect(i.level).toBe(1);
    expect(i.progressInLevel).toBe(0);
  });
  it("clamps negative and fractional points", () => {
    expect(computeLevelInfo(-50).points).toBe(0);
    expect(computeLevelInfo(99.9).points).toBe(99);
  });
  it("levels up exactly at thresholds", () => {
    expect(computeLevelInfo(99).level).toBe(1);
    expect(computeLevelInfo(100).level).toBe(2);
    expect(computeLevelInfo(300).level).toBe(3);
  });
  it("caps at max level", () => {
    const i = computeLevelInfo(LEVEL_THRESHOLDS[MAX_LEVEL] * 10);
    expect(i.level).toBe(MAX_LEVEL);
    expect(i.isMaxLevel).toBe(true);
  });
  it("ignores a stale stored level", () => {
    expect(computeLevelInfo(0, 9).level).toBe(1);
  });
  it("keeps progress percentage within 0-100", () => {
    for (const p of [0, 50, 150, 999, 20000]) {
      const pct = computeLevelInfo(p).progressPercentage;
      expect(pct).toBeGreaterThanOrEqual(0);
      expect(pct).toBeLessThanOrEqual(100);
    }
  });
});
