import type { SettlementStatus } from "@/domain";

export type SettlementActorRole = "landlord" | "tenant";

export type SettlementDecisionState = {
  status: SettlementStatus;
  approvedByTenant: boolean;
  approvedByLandlord: boolean;
};

export type SettlementResponseOutcome =
  | { kind: "reject"; event: "SETTLEMENT_REJECTED" }
  | { kind: "partial_approve" }
  | { kind: "full_approve"; event: "SETTLEMENT_APPROVED" };

export type ApplySettlementResponseResult =
  | { ok: false; code: "not_open" }
  | {
      ok: true;
      next: SettlementDecisionState;
      outcome: SettlementResponseOutcome;
    };

/**
 * Pure state step for tenant/landlord approve or reject on a PROPOSED settlement.
 */
export function applySettlementResponse(
  state: SettlementDecisionState,
  input: { role: SettlementActorRole; decision: "approve" | "reject" },
): ApplySettlementResponseResult {
  if (state.status !== "PROPOSED") {
    return { ok: false, code: "not_open" };
  }

  if (input.decision === "reject") {
    return {
      ok: true,
      next: {
        status: "REJECTED",
        approvedByTenant: false,
        approvedByLandlord: false,
      },
      outcome: { kind: "reject", event: "SETTLEMENT_REJECTED" },
    };
  }

  const approvedByTenant =
    input.role === "tenant" ? true : state.approvedByTenant;
  const approvedByLandlord =
    input.role === "landlord" ? true : state.approvedByLandlord;

  const fullyApproved = approvedByTenant && approvedByLandlord;
  const next: SettlementDecisionState = {
    status: fullyApproved ? "APPROVED" : "PROPOSED",
    approvedByTenant,
    approvedByLandlord,
  };

  if (fullyApproved) {
    return {
      ok: true,
      next,
      outcome: { kind: "full_approve", event: "SETTLEMENT_APPROVED" },
    };
  }

  return { ok: true, next, outcome: { kind: "partial_approve" } };
}

/** Lease row status after a successful settlement response outcome. */
export function leaseStatusAfterSettlementOutcome(
  outcome: SettlementResponseOutcome,
): "DISPUTED" | "APPROVED_FOR_REFUND" | undefined {
  if (outcome.kind === "reject") return "DISPUTED";
  if (outcome.kind === "full_approve") return "APPROVED_FOR_REFUND";
  return undefined;
}

const LEASE_TERMINAL_FOR_NEW_PROPOSAL = new Set<string>([
  "APPROVED_FOR_REFUND",
  "REFUND_SCHEDULED",
  "REFUND_COMPLETE",
]);

export function canProposeDeductionSettlement(leaseStatus: string): boolean {
  return !LEASE_TERMINAL_FOR_NEW_PROPOSAL.has(leaseStatus);
}

const SETTLEMENT_BLOCKS_REPROPOSE: ReadonlySet<SettlementStatus> = new Set([
  "APPROVED",
  "EXECUTED",
]);

export function canLandlordSubmitProposal(
  leaseStatus: string,
  settlementStatus: SettlementStatus | undefined,
): boolean {
  if (!canProposeDeductionSettlement(leaseStatus)) return false;
  if (settlementStatus === undefined) return true;
  return !SETTLEMENT_BLOCKS_REPROPOSE.has(settlementStatus);
}

/** Landlord confirms on-chain/off-chain refund after a schedule was recorded. */
export function canRecordRefundExecuted(input: {
  leaseStatus: string;
  settlementStatus: SettlementStatus | undefined;
  hederaScheduleId: string | null | undefined;
}): boolean {
  return (
    input.leaseStatus === "REFUND_SCHEDULED" &&
    input.settlementStatus === "APPROVED" &&
    Boolean(input.hederaScheduleId?.trim())
  );
}
