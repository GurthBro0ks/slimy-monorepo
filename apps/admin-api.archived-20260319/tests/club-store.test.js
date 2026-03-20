"use strict";

const { canonicalize } = require("../lib/club-store");

describe("club-store shim", () => {
  test("canonicalize lowercases input", () => {
    expect(canonicalize("TestUser")).toBe("testuser");
    expect(canonicalize("  Mixed Case ")).toBe("  mixed case ");
  });

  test("canonicalize handles nullish values", () => {
    expect(canonicalize(null)).toBe("");
    expect(canonicalize(undefined)).toBe("");
  });
});
