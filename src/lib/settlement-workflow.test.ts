import { describe, expect, it } from "vitest";
import {
  applySettlementResponse,
  canLandlordSubmitProposal,
  canProposeDeductionSettlement,
  canRecordRefundExecuted,
  leaseStatusAfterSettlementOutcome,
} from "./settlement-workflow";

const proposed = (
  tenant: boolean,
  landlord: boolean,
): { status: "PROPOSED"; approvedByTenant: boolean; approvedByLandlord: boolean } => ({
  status: "PROPOSED",
  approvedByTenant: tenant,
  approvedByLandlord: landlord,
});

describe("applySettlementResponse", () => {
  it("rejects when not PROPOSED", () => {
    const r = applySettlementResponse(
      { status: "DRAFT", approvedByTenant: false, approvedByLandlord: false },
      { role: "tenant", decision: "approve" },
    );
    expect(r).toEqual({ ok: false, code: "not_open" });
  });

  it("reject transitions to REJECTED and clears flags", () => {
    const r = applySettlementResponse(proposed(false, true), {
      role: "tenant",
      decision: "reject",
    });
    expect(r).toMatchObject({
      ok: true,
      next: {
        status: "REJECTED",
        approvedByTenant: false,
        approvedByLandlord: false,
      },
      outcome: { kind: "reject", event: "SETTLEMENT_REJECTED" },
    });
  });

  it("full approve when tenant approves after landlord already approved", () => {
    const r = applySettlementResponse(proposed(false, true), {
      role: "tenant",
      decision: "approve",
    });
    expect(r).toMatchObject({
      ok: true,
      next: {
        status: "APPROVED",
        approvedByTenant: true,
        approvedByLandlord: true,
      },
      outcome: { kind: "full_approve", event: "SETTLEMENT_APPROVED" },
    });
  });

  it("partial approve when tenant approves first", () => {
    const r = applySettlementResponse(proposed(false, false), {
      role: "tenant",
      decision: "approve",
    });
    expect(r).toMatchObject({
      ok: true,
      next: {
        status: "PROPOSED",
        approvedByTenant: true,
        approvedByLandlord: false,
      },
      outcome: { kind: "partial_approve" },
    });
  });

  it("partial approve when only landlord approves and tenant has not", () => {
    const r = applySettlementResponse(proposed(false, false), {
      role: "landlord",
      decision: "approve",
    });
    expect(r).toMatchObject({
      ok: true,
      next: {
        status: "PROPOSED",
        approvedByTenant: false,
        approvedByLandlord: true,
      },
      outcome: { kind: "partial_approve" },
    });
  });

  it("full approve when landlord approves after tenant already true", () => {
    const r = applySettlementResponse(proposed(true, false), {
      role: "landlord",
      decision: "approve",
    });
    expect(r.ok && r.outcome.kind).toBe("full_approve");
  });

  it("idempotent full state: second approve does not re-open", () => {
    const r = applySettlementResponse(
      { status: "APPROVED", approvedByTenant: true, approvedByLandlord: true },
      { role: "tenant", decision: "approve" },
    );
    expect(r).toEqual({ ok: false, code: "not_open" });
  });
});

describe("leaseStatusAfterSettlementOutcome", () => {
  it("maps reject and full approve", () => {
    expect(
      leaseStatusAfterSettlementOutcome({
        kind: "reject",
        event: "SETTLEMENT_REJECTED",
      }),
    ).toBe("DISPUTED");
    expect(
      leaseStatusAfterSettlementOutcome({
        kind: "full_approve",
        event: "SETTLEMENT_APPROVED",
      }),
    ).toBe("APPROVED_FOR_REFUND");
    expect(
      leaseStatusAfterSettlementOutcome({ kind: "partial_approve" }),
    ).toBeUndefined();
  });
});

describe("canProposeDeductionSettlement", () => {
  it("blocks late-stage leases", () => {
    expect(canProposeDeductionSettlement("OPEN")).toBe(true);
    expect(canProposeDeductionSettlement("APPROVED_FOR_REFUND")).toBe(false);
    expect(canProposeDeductionSettlement("REFUND_SCHEDULED")).toBe(false);
    expect(canProposeDeductionSettlement("REFUND_COMPLETE")).toBe(false);
  });
});

describe("canLandlordSubmitProposal", () => {
  it("respects settlement status", () => {
    expect(canLandlordSubmitProposal("OPEN", undefined)).toBe(true);
    expect(canLandlordSubmitProposal("OPEN", "PROPOSED")).toBe(true);
    expect(canLandlordSubmitProposal("OPEN", "REJECTED")).toBe(true);
    expect(canLandlordSubmitProposal("OPEN", "APPROVED")).toBe(false);
    expect(canLandlordSubmitProposal("APPROVED_FOR_REFUND", "PROPOSED")).toBe(
      false,
    );
  });
});

describe("canRecordRefundExecuted", () => {
  it("requires scheduled lease, approved settlement, and schedule id", () => {
    expect(
      canRecordRefundExecuted({
        leaseStatus: "REFUND_SCHEDULED",
        settlementStatus: "APPROVED",
        hederaScheduleId: "0.0.1",
      }),
    ).toBe(true);
    expect(
      canRecordRefundExecuted({
        leaseStatus: "APPROVED_FOR_REFUND",
        settlementStatus: "APPROVED",
        hederaScheduleId: "0.0.1",
      }),
    ).toBe(false);
    expect(
      canRecordRefundExecuted({
        leaseStatus: "REFUND_SCHEDULED",
        settlementStatus: "EXECUTED",
        hederaScheduleId: "0.0.1",
      }),
    ).toBe(false);
    expect(
      canRecordRefundExecuted({
        leaseStatus: "REFUND_SCHEDULED",
        settlementStatus: "APPROVED",
        hederaScheduleId: null,
      }),
    ).toBe(false);
    expect(
      canRecordRefundExecuted({
        leaseStatus: "REFUND_SCHEDULED",
        settlementStatus: "APPROVED",
        hederaScheduleId: "   ",
      }),
    ).toBe(false);
  });
});
