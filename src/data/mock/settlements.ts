import type { Settlement } from "@/domain";

/**
 * Placeholder settlements — amounts align with case deposits; Hedera schedule id
 * fills in once refund scheduling is implemented.
 */
const BY_LEASE: Record<string, Settlement> = {
  "lease-001": {
    settlementId: "set-lease-001",
    leaseId: "lease-001",
    depositAmountCents: 320_000,
    deductionAmountCents: 89_250,
    refundAmountCents: 230_750,
    status: "PROPOSED",
    approvedByTenant: false,
    approvedByLandlord: true,
    hederaScheduleId: null,
    createdAt: "2026-04-01T16:00:00.000Z",
  },
  "lease-002": {
    settlementId: "set-lease-002",
    leaseId: "lease-002",
    depositAmountCents: 180_000,
    deductionAmountCents: 25_000,
    refundAmountCents: 155_000,
    status: "PROPOSED",
    approvedByTenant: false,
    approvedByLandlord: false,
    hederaScheduleId: null,
    createdAt: "2026-03-15T11:00:00.000Z",
  },
};

export function getSettlementForLease(
  leaseId: string,
): Settlement | undefined {
  return BY_LEASE[leaseId];
}
