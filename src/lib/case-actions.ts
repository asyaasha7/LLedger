import type { LeaseCase, LeaseCaseStatus } from "@/domain";
import { routes } from "@/config/routes";

const SETTLEMENT_REVIEW_STATUSES: ReadonlySet<LeaseCaseStatus> = new Set([
  "SETTLEMENT_PENDING",
]);

const REFUND_TRACKING_STATUSES: ReadonlySet<LeaseCaseStatus> = new Set([
  "APPROVED_FOR_REFUND",
  "REFUND_SCHEDULED",
]);

export function caseNeedsSettlementReview(status: LeaseCaseStatus): boolean {
  return SETTLEMENT_REVIEW_STATUSES.has(status);
}

export function getCasePrimaryAction(caseData: LeaseCase): {
  href: string;
  label: string;
} {
  const r = routes.case(caseData.leaseId);
  if (caseNeedsSettlementReview(caseData.status)) {
    return {
      href: r.settlement,
      label: "Review settlement",
    };
  }
  if (REFUND_TRACKING_STATUSES.has(caseData.status)) {
    return {
      href: r.timeline,
      label: "View refund status",
    };
  }
  return {
    href: r.evidenceUpload,
    label: "Upload evidence",
  };
}
