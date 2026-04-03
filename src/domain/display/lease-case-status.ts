import type { LeaseCaseStatus } from "../entities";

export const LEASE_CASE_STATUS_LABELS: Record<LeaseCaseStatus, string> = {
  OPEN: "Open",
  EVIDENCE_IN_PROGRESS: "Evidence in progress",
  UNDER_REVIEW: "Under review",
  DISPUTED: "Disputed",
  SETTLEMENT_PENDING: "Settlement pending",
  APPROVED_FOR_REFUND: "Approved for refund",
  REFUND_SCHEDULED: "Refund scheduled",
  REFUND_COMPLETE: "Refund complete",
};
