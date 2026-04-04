import type { SettlementStatus } from "@/domain";

const LEASE_BLOCKS_DEPOSIT_OR_DEDUCTION_EDIT = new Set<string>([
  "APPROVED_FOR_REFUND",
  "REFUND_SCHEDULED",
  "REFUND_COMPLETE",
]);

/**
 * Landlord may change recorded deposit or active deduction before settlement is
 * locked for counterparty review / approval.
 */
export function canLandlordAdjustDepositOrDeduction(
  leaseStatus: string,
  settlementStatus: SettlementStatus | undefined,
): boolean {
  if (LEASE_BLOCKS_DEPOSIT_OR_DEDUCTION_EDIT.has(leaseStatus)) return false;
  if (!settlementStatus) return true;
  if (settlementStatus === "REJECTED") return true;
  return false;
}
