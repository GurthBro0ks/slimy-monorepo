"use strict";

const { parsePower } = require("../../../lib/numparse");
const vision = require("../../../lib/club-vision");

describe("numparse.parsePower", () => {
  test("parses clean grouped numbers", () => {
    const result = parsePower("123,456,789");
    expect(result.value).toBe(123456789);
    expect(result.corrected).toBe(false);
    expect(result.reason).toBeUndefined();
  });

  test("parses suffixes (K/M/B)", () => {
    expect(parsePower("2.5B").value).toBe(2.5e9);
    expect(parsePower("325M").value).toBe(325e6);
    expect(parsePower("12.3K").value).toBe(12300);
  });

  test("normalizes common OCR digit confusions", () => {
    const result = parsePower("1O,0I2,l34");
    expect(result.value).toBe(10012134);
    expect(result.corrected).toBe(true);
    expect(result.reason).toContain("normalized_ocr_digits");
  });

  test("trims inflated trailing digits", () => {
    const result = parsePower("2180102088");
    expect(result.value).toBe(218010208);
    expect(result.corrected).toBe(true);
    expect(result.reason).toContain("trimmed_trailing_digit");
  });

  test("fixes invalid grouping like 1,234,5678", () => {
    const result = parsePower("1,234,5678");
    expect(result.value).toBe(1234567);
    expect(result.corrected).toBe(true);
    expect(result.reason).toContain("normalized_grouping");
  });
});

describe("club-vision pipeline wiring", () => {
  test("parseManageMembersImageEnsemble uses parsePower anti-inflation heuristics", async () => {
    const text = [
      "Alice 2180102088",
      "Bob 1,234,5678",
      "Charlie 1O,0I2,l34",
    ].join("\n");

    const result = await vision.parseManageMembersImageEnsemble(text, "total", { text });
    const alice = result.rows.find((r) => r.canonical === "alice");
    const bob = result.rows.find((r) => r.canonical === "bob");
    const charlie = result.rows.find((r) => r.canonical === "charlie");

    expect(alice.value).toBe(218010208);
    expect(alice.corrected).toBe(true);
    expect(bob.value).toBe(1234567);
    expect(bob.corrected).toBe(true);
    expect(charlie.value).toBe(10012134);
    expect(charlie.corrected).toBe(true);
    expect(result.metric).toBe("total");
    expect(result.ensembleMetadata.totalMembers).toBe(3);
  });
});
