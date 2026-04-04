/**
 * LeaseLedger domain model — rental evidence, dispute, and deposit settlement
 * with private off-chain evidence + Hedera trust trail (HCS / scheduled txs).
 *
 * Raw files stay encrypted off-chain; chain carries hashes, refs, and workflow events only.
 */

import type { CaseEventType } from "./case-event-types";
import type { Participant, UserRole } from "./participants";

export type CaseId = string;

/** Case lifecycle (spec §8). Drives UI state and refund gating. */
export type LeaseCaseStatus =
  | "OPEN"
  | "EVIDENCE_IN_PROGRESS"
  | "UNDER_REVIEW"
  | "DISPUTED"
  | "SETTLEMENT_PENDING"
  | "APPROVED_FOR_REFUND"
  | "REFUND_SCHEDULED"
  | "REFUND_COMPLETE";

/** Amount stored in minor units (e.g. USD cents). */
export type MoneyCents = number;

/** Opaque handle to encrypted blob storage (S3, vault, etc.) — never a public URL to raw bytes. */
export type EncryptedStorageRef = string;

/** Hex or multihash string for content addressing (spec §6.2). */
export type ContentHash = string;

export interface LeasePeriod {
  start: string;
  end: string;
}

/**
 * Primary workflow aggregate (spec §7.1).
 * `leaseId` is the canonical id (URL param `/cases/[caseId]` uses the same value).
 */
export interface LeaseCase {
  leaseId: CaseId;
  /** Property / unit label shown in UI. */
  propertyRef: string;
  /** Human-readable registry label (distinct from on-chain ids). */
  leaseRef: string;
  landlord: Participant;
  tenant: Participant;
  depositCents: MoneyCents;
  lease: LeasePeriod;
  status: LeaseCaseStatus;
  /** Hedera Consensus Service topic for this case (null until provisioned). */
  hederaTopicId: string | null;
  /** Scheduled transaction id for refund execution when in flow (null until created). */
  hederaRefundScheduleId: string | null;
  /** Short copy for “next step” surfaces. */
  nextAction: string;
}

/** Granular evidence kinds (spec §6.2). */
export type EvidenceType =
  | "MOVE_IN_PHOTO"
  | "MOVE_OUT_PHOTO"
  | "DAMAGE_PHOTO"
  | "VIDEO"
  | "INVOICE"
  | "REPAIR_RECEIPT"
  | "NOTE"
  | "DOCUMENT"
  | "OTHER";

/** Evidence review state (spec §8). */
export type EvidenceReviewStatus =
  | "SUBMITTED"
  | "ACKNOWLEDGED"
  | "DISPUTED"
  | "COMMENTED";

/** UI filter buckets for the evidence library (maps to `category`). */
export type EvidenceCategory = "Move-In" | "Move-Out" | "Damage" | "Receipts";

export interface EvidenceItem {
  evidenceId: string;
  leaseId: CaseId;
  submittedByUserId: string;
  submitterRole: UserRole;
  evidenceType: EvidenceType;
  category: EvidenceCategory;
  title: string;
  description: string;
  roomTag?: string;
  fileHash: ContentHash;
  encryptedStorageRef: EncryptedStorageRef;
  /** ISO 8601 — source of truth for ordering; UI may format. */
  createdAt: string;
  reviewStatus: EvidenceReviewStatus;
}

export const EVIDENCE_FILTER_LABELS = [
  "All",
  "Move-In",
  "Move-Out",
  "Damage",
  "Receipts",
] as const;

export type EvidenceFilterLabel = (typeof EVIDENCE_FILTER_LABELS)[number];

export type ReviewActionType =
  | "ACKNOWLEDGE"
  | "DISPUTE"
  | "COMMENT"
  | "REQUEST_MORE";

export interface ReviewAction {
  reviewActionId: string;
  leaseId: CaseId;
  evidenceId: string;
  actorUserId: string;
  actorRole: UserRole;
  actionType: ReviewActionType;
  comment?: string;
  createdAt: string;
}

export type DeductionProposalStatus = "DRAFT" | "ACTIVE" | "SUPERSEDED" | "VOID";

export interface DeductionProposal {
  proposalId: string;
  leaseId: CaseId;
  amountCents: MoneyCents;
  reason: string;
  linkedEvidenceIds: string[];
  status: DeductionProposalStatus;
  createdAt: string;
}

export type SettlementStatus =
  | "DRAFT"
  | "PROPOSED"
  | "APPROVED"
  | "REJECTED"
  | "EXECUTED";

export interface Settlement {
  settlementId: string;
  leaseId: CaseId;
  depositAmountCents: MoneyCents;
  deductionAmountCents: MoneyCents;
  refundAmountCents: MoneyCents;
  status: SettlementStatus;
  approvedByTenant: boolean;
  approvedByLandlord: boolean;
  hederaScheduleId: string | null;
  createdAt: string;
}

/** Normalized timeline row for Hedera + app parity (spec §7.6). */
export interface CaseEvent {
  eventId: string;
  leaseId: CaseId;
  eventType: CaseEventType;
  actorRole: UserRole;
  source: "app" | "hedera_mirror" | "scheduled_tx";
  sourceRef?: string;
  timestamp: string;
  payload?: Record<string, unknown>;
}

export type TimelineTone = "neutral" | "success" | "risk" | "ai";

/** UI projection of the case timeline (can be built from CaseEvent[] later). */
export interface TimelineEvent {
  id: string;
  caseId: CaseId;
  title: string;
  actorLabel: string;
  timestampLabel: string;
  detail: string;
  tone: TimelineTone;
  /** When present, ties the row to the HCS vocabulary. */
  eventType?: CaseEventType;
  /** Hedera sync / Mirror verification badge copy. */
  hederaLabel?: string;
}

export type { CaseEventType } from "./case-event-types";
export type { Participant, UserRole } from "./participants";
