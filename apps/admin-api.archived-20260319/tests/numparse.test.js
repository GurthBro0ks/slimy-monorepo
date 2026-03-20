"use strict";

const { parsePower } = require("../lib/numparse");

describe("numparse shim", () => {
  test("returns numeric values for plain numbers", () => {
    expect(parsePower("1234")).toBe(1234);
    expect(parsePower(42)).toBe(42);
  });

  test("returns null for non-numeric values or suffixed strings", () => {
    expect(parsePower("10K")).toBeNull();
    expect(parsePower("abc")).toBeNull();
    expect(parsePower(undefined)).toBeNull();
  });
});
