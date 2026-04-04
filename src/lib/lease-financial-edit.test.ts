import { describe, expect, it } from "vitest";
import { canLandlordAdjustDepositOrDeduction } from "./lease-financial-edit";

describe("canLandlordAdjustDepositOrDeduction", () => {
  it("allows when no settlement row", () => {
    expect(canLandlordAdjustDepositOrDeduction("OPEN", undefined)).toBe(true);
  });

  it("blocks when settlement proposed or approved", () => {
    expect(canLandlordAdjustDepositOrDeduction("SETTLEMENT_PENDING", "PROPOSED")).toBe(
      false,
    );
    expect(canLandlordAdjustDepositOrDeduction("SETTLEMENT_PENDING", "APPROVED")).toBe(
      false,
    );
  });

  it("allows again after reject", () => {
    expect(canLandlordAdjustDepositOrDeduction("DISPUTED", "REJECTED")).toBe(true);
  });

  it("blocks late lease stages", () => {
    expect(canLandlordAdjustDepositOrDeduction("APPROVED_FOR_REFUND", undefined)).toBe(
      false,
    );
  });
});
