import type { LeaseCase, LeaseCaseStatus } from "@/domain";
import { routes } from "@/config/routes";

const SETTLEMENT_REVIEW_STATUSES: ReadonlySet<LeaseCaseStatus> = new Set([
  "SETTLEMENT_PENDING",
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
  if (caseData.status === "APPROVED_FOR_REFUND") {
    return {
      href: r.settlement,
      label: "Schedule refund",
    };
  }
  if (caseData.status === "REFUND_SCHEDULED") {
    return {
      href: r.settlement,
      label: "Confirm refund executed",
    };
  }
  if (caseData.status === "REFUND_COMPLETE") {
    return {
      href: r.timeline,
      label: "View ledger",
    };
  }
  return {
    href: r.evidenceUpload,
    label: "Upload evidence",
  };
}
