import { describe, it, expect } from "vitest";
import { getUsageLevel, getMockUsageData } from "@/lib/usage-thresholds";

describe("Usage Thresholds", () => {
  describe("getUsageLevel", () => {
    it("should return 'free' for spend at or below free limit (100)", () => {
      expect(getUsageLevel(0)).toBe("free");
      expect(getUsageLevel(100)).toBe("free");
    });

    it("should return 'pro' for spend above free limit and at or below pro limit (1000)", () => {
      expect(getUsageLevel(101)).toBe("pro");
      expect(getUsageLevel(500)).toBe("pro");
      expect(getUsageLevel(1000)).toBe("pro");
    });

    it("should return 'over_cap' for spend above pro limit", () => {
      expect(getUsageLevel(1001)).toBe("over_cap");
      expect(getUsageLevel(5000)).toBe("over_cap");
    });
  });

  describe("getMockUsageData", () => {
    it("should return 'ok' status for low free usage", () => {
      const data = getMockUsageData(50);
      expect(data.level).toBe("free");
      expect(data.modelProbeStatus).toBe("ok");
    });

    it("should return 'soft_cap' status for high pro usage (950)", () => {
      const data = getMockUsageData(950);
      expect(data.level).toBe("pro");
      expect(data.modelProbeStatus).toBe("soft_cap");
    });

    it("should return 'hard_cap' status for over cap usage (1001)", () => {
      const data = getMockUsageData(1001);
      expect(data.level).toBe("over_cap");
      expect(data.modelProbeStatus).toBe("hard_cap");
    });
  });
});
