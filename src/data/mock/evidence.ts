import type { EvidenceItem } from "@/domain";

/** Mock SHA-256 placeholders — real uploads will replace at ingest. */
const H = (suffix: string) =>
  `sha256:mock${suffix.padStart(56, "0").slice(0, 56)}`;

const SEED: EvidenceItem[] = [
  {
    evidenceId: "ev-1",
    leaseId: "lease-001",
    submittedByUserId: "user-tenant-jordan",
    submitterRole: "tenant",
    evidenceType: "MOVE_IN_PHOTO",
    category: "Move-In",
    title: "Kitchen · move-in baseline",
    description:
      "Full kitchen at key handoff; counters, sink, and cabinets documented for condition baseline.",
    roomTag: "Kitchen",
    fileHash: H("01"),
    encryptedStorageRef: "blob:vault:lease-001/ev-1 ciphertext",
    createdAt: "2026-04-02T14:04:00.000Z",
    reviewStatus: "SUBMITTED",
  },
  {
    evidenceId: "ev-2",
    leaseId: "lease-001",
    submittedByUserId: "user-tenant-jordan",
    submitterRole: "tenant",
    evidenceType: "MOVE_IN_PHOTO",
    category: "Move-In",
    title: "Hallway · flooring at move-in",
    description: "Entry through hall; establishes wear state at start of tenancy.",
    roomTag: "Hallway",
    fileHash: H("02"),
    encryptedStorageRef: "blob:vault:lease-001/ev-2 ciphertext",
    createdAt: "2026-04-02T14:04:00.000Z",
    reviewStatus: "SUBMITTED",
  },
  {
    evidenceId: "ev-3",
    leaseId: "lease-001",
    submittedByUserId: "user-landlord-demo",
    submitterRole: "landlord",
    evidenceType: "MOVE_OUT_PHOTO",
    category: "Move-Out",
    title: "Living room · move-out walk-through",
    description:
      "Final walk-through: blinds, carpet edge, and general condition at lease end.",
    roomTag: "Living room",
    fileHash: H("03"),
    encryptedStorageRef: "blob:vault:lease-001/ev-3 ciphertext",
    createdAt: "2026-03-28T18:00:00.000Z",
    reviewStatus: "ACKNOWLEDGED",
  },
  {
    evidenceId: "ev-4",
    leaseId: "lease-001",
    submittedByUserId: "user-landlord-demo",
    submitterRole: "landlord",
    evidenceType: "DAMAGE_PHOTO",
    category: "Damage",
    title: "Entry · wall touch-up zone",
    description:
      "Scuffing near closet; landlord cites repainting; tenant disputes extent vs. normal use.",
    roomTag: "Entry",
    fileHash: H("04"),
    encryptedStorageRef: "blob:vault:lease-001/ev-4 ciphertext",
    createdAt: "2026-03-29T10:30:00.000Z",
    reviewStatus: "DISPUTED",
  },
  {
    evidenceId: "ev-5",
    leaseId: "lease-002",
    submittedByUserId: "user-tenant-sam",
    submitterRole: "tenant",
    evidenceType: "REPAIR_RECEIPT",
    category: "Receipts",
    title: "Cleaning invoice",
    description: "Move-out professional clean",
    fileHash: H("05"),
    encryptedStorageRef: "blob:vault:lease-002/ev-5 ciphertext",
    createdAt: "2026-03-30T12:00:00.000Z",
    reviewStatus: "SUBMITTED",
  },
  {
    evidenceId: "ev-6",
    leaseId: "lease-002",
    submittedByUserId: "user-landlord-demo",
    submitterRole: "landlord",
    evidenceType: "DAMAGE_PHOTO",
    category: "Damage",
    title: "Cabinet hinge",
    description: "Kitchen lower, left side",
    roomTag: "Kitchen",
    fileHash: H("06"),
    encryptedStorageRef: "blob:vault:lease-002/ev-6 ciphertext",
    createdAt: "2026-03-30T15:00:00.000Z",
    reviewStatus: "SUBMITTED",
  },
];

export function listEvidenceForCase(leaseId: string): EvidenceItem[] {
  return SEED.filter((e) => e.leaseId === leaseId);
}
