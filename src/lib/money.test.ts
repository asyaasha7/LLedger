import { describe, expect, it } from "vitest";
import { refundAmountCents } from "./money";

describe("refundAmountCents", () => {
  it("subtracts deduction from deposit", () => {
    expect(refundAmountCents(240_000, 40_000)).toBe(200_000);
  });

  it("never returns negative", () => {
    expect(refundAmountCents(1000, 5000)).toBe(0);
  });

  it("handles zero deduction", () => {
    expect(refundAmountCents(180_000, 0)).toBe(180_000);
  });
});
