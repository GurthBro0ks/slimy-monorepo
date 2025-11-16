import { describe, it, expect } from "vitest";
import { CodeDeduplicator, deduplicateCodes } from "@/lib/codes/deduplication";

const mockCodes: Code[] = [
  {
    code: "DUPLICATE123",
    source: "snelp",
    ts: new Date().toISOString(),
    tags: ["active"],
    expires: null,
    region: "global",
    description: "First duplicate",
  },
  {
    code: "DUPLICATE123",
    source: "reddit",
    ts: new Date(Date.now() - 1000).toISOString(), // 1 second older
    tags: ["reddit"],
    expires: null,
    region: "global",
    description: "Second duplicate",
  },
  {
    code: "UNIQUE456",
    source: "snelp",
    ts: new Date().toISOString(),
    tags: ["active"],
    expires: null,
    region: "global",
    description: "Unique code",
  },
];

describe("CodeDeduplicator", () => {
  let deduplicator: CodeDeduplicator;

  beforeEach(() => {
    deduplicator = new CodeDeduplicator();
  });

  describe("basic deduplication", () => {
    it("should remove exact duplicates", () => {
      const duplicateCodes = [
        mockCodes[0],
        { ...mockCodes[0] }, // Exact duplicate
        mockCodes[2],
      ];

      const result = deduplicator.deduplicate(duplicateCodes);

      expect(result.codes).toHaveLength(2);
      expect(result.stats.total).toBe(3);
      expect(result.stats.unique).toBe(2);
      expect(result.stats.duplicates).toBe(1);
    });

    it("should handle case-insensitive duplicates", () => {
      const caseVariants = [
        { ...mockCodes[0], code: "duplicate123" },
        { ...mockCodes[0], code: "DUPLICATE123" },
        { ...mockCodes[0], code: "Duplicate123" },
      ];

      const result = deduplicator.deduplicate(caseVariants);

      expect(result.codes).toHaveLength(1);
      expect(result.stats.duplicates).toBe(2); // 2 duplicates of the same normalized code
    });

    it("should preserve all unique codes", () => {
      const result = deduplicator.deduplicate(mockCodes);

      expect(result.codes).toHaveLength(2); // DUPLICATE123 (1) + UNIQUE456 (1)
      expect(result.codes.some(c => c.code === "DUPLICATE123")).toBe(true);
      expect(result.codes.some(c => c.code === "UNIQUE456")).toBe(true);
    });
  });

  describe("strategy selection", () => {
    it("should select newest code by default (newest strategy)", () => {
      const result = deduplicator.deduplicate(mockCodes);

      // Should select the first DUPLICATE123 (newer timestamp)
      const duplicateCode = result.codes.find(c => c.code === "DUPLICATE123");
      expect(duplicateCode?.source).toBe("snelp");
      expect(duplicateCode?.description).toBe("First duplicate");
    });

    it("should select oldest code when configured", () => {
      const oldestDeduplicator = new CodeDeduplicator({
        strategy: "oldest",
      });

      const result = oldestDeduplicator.deduplicate(mockCodes);

      // Should select the second DUPLICATE123 (older timestamp)
      const duplicateCode = result.codes.find(c => c.code === "DUPLICATE123");
      expect(duplicateCode?.source).toBe("reddit");
      expect(duplicateCode?.description).toBe("Second duplicate");
    });

    it("should select by priority order", () => {
      const priorityDeduplicator = new CodeDeduplicator({
        strategy: "highest_priority",
        priorityOrder: ["reddit", "snelp"], // Reddit has higher priority
      });

      const result = priorityDeduplicator.deduplicate(mockCodes);

      // Should select reddit version despite being older
      const duplicateCode = result.codes.find(c => c.code === "DUPLICATE123");
      expect(duplicateCode?.source).toBe("reddit");
    });
  });

  describe("merge strategy", () => {
    it("should merge codes when configured", () => {
      const mergeDeduplicator = new CodeDeduplicator({
        strategy: "merge",
        mergeTags: true,
        mergeDescriptions: false,
      });

      const result = mergeDeduplicator.deduplicate(mockCodes);

      expect(result.codes).toHaveLength(2);
      expect(result.stats.merged).toBe(1);

      const mergedCode = result.codes.find(c => c.code === "DUPLICATE123");
      expect(mergedCode?.tags).toContain("active");
      expect(mergedCode?.tags).toContain("reddit");
      expect(mergedCode?.description).toBe("First duplicate"); // First description preserved
    });

    it("should merge descriptions when enabled", () => {
      const mergeDeduplicator = new CodeDeduplicator({
        strategy: "merge",
        mergeTags: false,
        mergeDescriptions: true,
      });

      // Create codes with different descriptions
      const codesWithDescriptions = [
        { ...mockCodes[0], description: "Short desc" },
        { ...mockCodes[1], description: "This is a much longer description that should be selected" },
      ];

      const result = mergeDeduplicator.deduplicate(codesWithDescriptions);

      const mergedCode = result.codes.find(c => c.code === "DUPLICATE123");
      expect(mergedCode?.description).toBe("This is a much longer description that should be selected");
    });

    it("should handle merge failures gracefully", () => {
      const mergeDeduplicator = new CodeDeduplicator({
        strategy: "merge",
      });

      // Empty array should not cause issues
      const result = mergeDeduplicator.deduplicate([]);

      expect(result.codes).toHaveLength(0);
      expect(result.stats.merged).toBe(0);
    });
  });

  describe("disabled deduplication", () => {
    it("should return all codes when disabled", () => {
      const disabledDeduplicator = new CodeDeduplicator({
        enabled: false,
      });

      const result = disabledDeduplicator.deduplicate(mockCodes);

      expect(result.codes).toHaveLength(3); // All codes returned
      expect(result.stats.unique).toBe(3);
      expect(result.stats.duplicates).toBe(0);
    });
  });

  describe("validation", () => {
    it("should validate deduplication results", () => {
      const result = deduplicator.deduplicate(mockCodes);
      const validation = deduplicator.validateDeduplication(result);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("should detect validation errors", () => {
      const invalidResult = {
        codes: [
          mockCodes[0],
          mockCodes[0], // Duplicate in result
        ],
        duplicates: {},
        stats: { total: 2, unique: 1, duplicates: 0, merged: 0 }, // Wrong stats
      };

      const validation = deduplicator.validateDeduplication(invalidResult);

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe("utility function", () => {
    it("should deduplicate codes with utility function", () => {
      const result = deduplicateCodes(mockCodes);

      expect(result).toHaveLength(2);
      expect(result.some(c => c.code === "DUPLICATE123")).toBe(true);
      expect(result.some(c => c.code === "UNIQUE456")).toBe(true);
    });

    it("should accept configuration in utility function", () => {
      const result = deduplicateCodes(mockCodes, {
        strategy: "oldest",
      });

      const duplicateCode = result.find(c => c.code === "DUPLICATE123");
      expect(duplicateCode?.source).toBe("reddit"); // Oldest selected
    });
  });

  describe("edge cases", () => {
    it("should handle empty input", () => {
      const result = deduplicator.deduplicate([]);

      expect(result.codes).toHaveLength(0);
      expect(result.stats.total).toBe(0);
    });

    it("should handle single code", () => {
      const result = deduplicator.deduplicate([mockCodes[0]]);

      expect(result.codes).toHaveLength(1);
      expect(result.stats.unique).toBe(1);
      expect(result.stats.duplicates).toBe(0);
    });

    it("should handle codes with special characters", () => {
      const specialCodes = [
        { ...mockCodes[0], code: "CODE-123_ABC" },
        { ...mockCodes[0], code: "code-123_abc" }, // Same when normalized
      ];

      const result = deduplicator.deduplicate(specialCodes);

      expect(result.codes).toHaveLength(1);
    });

    it("should normalize codes correctly", () => {
      const codesWithSpaces = [
        { ...mockCodes[0], code: "CODE 123" },
        { ...mockCodes[0], code: "CODE123" },
      ];

      const result = deduplicator.deduplicate(codesWithSpaces);

      expect(result.codes).toHaveLength(1);
    });
  });
});
