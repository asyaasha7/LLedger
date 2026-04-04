import type { LeaseCase } from "@/domain";

const SEED: LeaseCase[] = [
  {
    leaseId: "lease-001",
    propertyRef: "1847 Market St · Unit 4B",
    leaseRef: "LL-2024-4B-MKT",
    landlord: {
      userId: "user-landlord-demo",
      role: "landlord",
      displayName: "You",
    },
    tenant: {
      userId: "user-tenant-jordan",
      role: "tenant",
      displayName: "Jordan Lee",
      email: "jordan@example.com",
    },
    depositCents: 320_000,
    lease: { start: "2024-06-01", end: "2025-05-31" },
    status: "SETTLEMENT_PENDING",
    hederaTopicId: null,
    hederaRefundScheduleId: null,
    nextAction:
      "Tenant: review settlement and respond (approve or reject)",
  },
  {
    leaseId: "lease-002",
    propertyRef: "12 Oak Street",
    leaseRef: "Lease-002",
    landlord: {
      userId: "user-landlord-demo",
      role: "landlord",
      displayName: "You",
    },
    tenant: {
      userId: "user-tenant-sam",
      role: "tenant",
      displayName: "Sam Rivera",
    },
    depositCents: 180_000,
    lease: { start: "2024-01-15", end: "2025-01-14" },
    status: "EVIDENCE_IN_PROGRESS",
    hederaTopicId: null,
    hederaRefundScheduleId: null,
    nextAction: "Upload move-out evidence",
  },
];

export function listCases(): readonly LeaseCase[] {
  return SEED;
}

/** `caseId` route param is the canonical `leaseId`. */
export function findCaseById(caseId: string): LeaseCase | undefined {
  return SEED.find((c) => c.leaseId === caseId);
}
