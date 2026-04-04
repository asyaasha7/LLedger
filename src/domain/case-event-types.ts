/**
 * Normalized HCS / workflow event names (spec §6).
 * Mirror Node + app-emitted events should map into this vocabulary.
 */
export type CaseEventType =
  | "LEASE_CREATED"
  | "TENANT_JOINED"
  | "EVIDENCE_SUBMITTED"
  | "EVIDENCE_ACKNOWLEDGED"
  | "EVIDENCE_DISPUTED"
  | "COMMENT_ADDED"
  | "MORE_INFO_REQUESTED"
  | "DEDUCTION_PROPOSED"
  | "SETTLEMENT_APPROVED"
  | "SETTLEMENT_REJECTED"
  | "REFUND_SCHEDULED"
  | "REFUND_EXECUTED"
  | "AI_REVIEW_COMPLETED";
