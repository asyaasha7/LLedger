/**
 * High-level stages for progress UI — not the same as LeaseCaseStatus enum
 * (multiple statuses can map to one stage).
 */
export const CASE_WORKFLOW_STAGES = [
  { id: "lease", label: "Lease opened" },
  { id: "evidence", label: "Evidence" },
  { id: "review", label: "Review" },
  { id: "settlement", label: "Settlement" },
  { id: "refund", label: "Refund (Hedera)" },
] as const;

export type CaseWorkflowStageId = (typeof CASE_WORKFLOW_STAGES)[number]["id"];
