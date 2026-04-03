import type { DeductionProposal } from "@/domain";

/** Landlord deduction proposals (spec §6.5) — wireframe seed. */
const SEED: DeductionProposal[] = [
  {
    proposalId: "ded-001",
    leaseId: "lease-001",
    amountCents: 40_000,
    reason: "Wall touch-up and move-out cleaning per linked evidence",
    linkedEvidenceIds: ["ev-3", "ev-4"],
    status: "ACTIVE",
    createdAt: "2026-04-01T17:00:00.000Z",
  },
  {
    proposalId: "ded-002",
    leaseId: "lease-002",
    amountCents: 25_000,
    reason: "Cabinet repair estimate and cleaning",
    linkedEvidenceIds: ["ev-5", "ev-6"],
    status: "ACTIVE",
    createdAt: "2026-03-20T09:00:00.000Z",
  },
];

export function listDeductionProposalsForLease(
  leaseId: string,
): DeductionProposal[] {
  return SEED.filter((p) => p.leaseId === leaseId);
}
