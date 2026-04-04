import { describe, expect, it } from "vitest";
import { parseDepositDollarsToCents } from "./parse-deposit-cents";

describe("parseDepositDollarsToCents", () => {
  it("parses plain dollars to cents", () => {
    expect(parseDepositDollarsToCents("2400")).toBe(240_000);
    expect(parseDepositDollarsToCents(100)).toBe(10_000);
    expect(parseDepositDollarsToCents("99.99")).toBe(9999);
  });

  it("strips currency formatting", () => {
    expect(parseDepositDollarsToCents("$2,400.50")).toBe(240_050);
    expect(parseDepositDollarsToCents(" $1,000 ")).toBe(100_000);
  });

  it("returns null for invalid values", () => {
    expect(parseDepositDollarsToCents("")).toBeNull();
    expect(parseDepositDollarsToCents("abc")).toBeNull();
    expect(parseDepositDollarsToCents(-1)).toBeNull();
    expect(parseDepositDollarsToCents(NaN)).toBeNull();
  });
});
