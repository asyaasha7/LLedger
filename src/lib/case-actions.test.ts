import { describe, expect, it } from "vitest";
import { getCasePrimaryAction } from "./case-actions";
import type { LeaseCase } from "@/domain";

function minimalCase(
  status: LeaseCase["status"],
  overrides: Partial<LeaseCase> = {},
): LeaseCase {
  return {
    leaseId: "lease-x",
    propertyRef: "A",
    leaseRef: "LL-X",
    landlord: {
      userId: "l1",
      role: "landlord",
      displayName: "L",
    },
    tenant: {
      userId: "t1",
      role: "tenant",
      displayName: "T",
    },
    depositCents: 100_000,
    lease: { start: "2024-01-01", end: "2025-01-01" },
    status,
    hederaTopicId: null,
    hederaRefundScheduleId: null,
    nextAction: "",
    ...overrides,
  };
}

describe("getCasePrimaryAction", () => {
  it("routes settlement and refund stages", () => {
    expect(
      getCasePrimaryAction(minimalCase("SETTLEMENT_PENDING")).label,
    ).toBe("Review settlement");
    expect(
      getCasePrimaryAction(minimalCase("APPROVED_FOR_REFUND")).label,
    ).toBe("Schedule refund");
    expect(
      getCasePrimaryAction(minimalCase("REFUND_SCHEDULED")).label,
    ).toBe("Confirm refund executed");
    expect(getCasePrimaryAction(minimalCase("REFUND_COMPLETE")).label).toBe(
      "View ledger",
    );
  });

  it("defaults to evidence upload for open work", () => {
    expect(getCasePrimaryAction(minimalCase("OPEN")).label).toBe(
      "Upload evidence",
    );
  });
});
