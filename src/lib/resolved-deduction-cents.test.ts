import { describe, expect, it } from "vitest";
import { resolvedDeductionAmountCents } from "./resolved-deduction-cents";

describe("resolvedDeductionAmountCents", () => {
  it("prefers the active deduction proposal over settlement", () => {
    expect(
      resolvedDeductionAmountCents({
        activeDeductionProposal: { amountCents: 100 },
        settlement: { deductionAmountCents: 200 },
      }),
    ).toBe(100);
  });

  it("uses settlement when there is no active proposal", () => {
    expect(
      resolvedDeductionAmountCents({
        settlement: { deductionAmountCents: 89_250 },
      }),
    ).toBe(89_250);
  });

  it("returns 0 when neither source exists", () => {
    expect(resolvedDeductionAmountCents({})).toBe(0);
  });
});
