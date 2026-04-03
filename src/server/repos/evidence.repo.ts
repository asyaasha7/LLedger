import "server-only";

import type {
  EvidenceCategory,
  EvidenceItem,
  EvidenceReviewStatus,
  EvidenceType,
  UserRole,
} from "@/domain";
import {
  listEvidenceForCase as listEvidenceForCaseMock,
} from "@/data/mock/evidence";
import { listCases as listCasesMock } from "@/data/mock/cases";
import { getDb } from "@/server/db/client";

type EvidenceRow = {
  evidence_id: string;
  lease_id: string;
  submitted_by_user_id: string;
  submitter_role: string;
  evidence_type: string;
  category: string;
  title: string;
  description: string;
  room_tag: string | null;
  file_hash: string;
  encrypted_storage_ref: string;
  review_status: string;
  created_at: Date | string;
};

function isoTimestamp(v: Date | string): string {
  if (v instanceof Date) return v.toISOString();
  return new Date(v).toISOString();
}

function mapEvidenceRow(row: EvidenceRow): EvidenceItem {
  const item: EvidenceItem = {
    evidenceId: row.evidence_id,
    leaseId: row.lease_id,
    submittedByUserId: row.submitted_by_user_id,
    submitterRole: row.submitter_role as UserRole,
    evidenceType: row.evidence_type as EvidenceType,
    category: row.category as EvidenceCategory,
    title: row.title,
    description: row.description,
    fileHash: row.file_hash,
    encryptedStorageRef: row.encrypted_storage_ref,
    createdAt: isoTimestamp(row.created_at),
    reviewStatus: row.review_status as EvidenceReviewStatus,
  };
  if (row.room_tag) item.roomTag = row.room_tag;
  return item;
}

export async function listEvidenceForCase(
  leaseId: string,
): Promise<EvidenceItem[]> {
  const db = getDb();
  if (!db) return listEvidenceForCaseMock(leaseId);

  const rows = await db<EvidenceRow[]>`
    SELECT
      evidence_id,
      lease_id,
      submitted_by_user_id,
      submitter_role,
      evidence_type,
      category,
      title,
      description,
      room_tag,
      file_hash,
      encrypted_storage_ref,
      review_status,
      created_at
    FROM evidence_items
    WHERE lease_id = ${leaseId}
    ORDER BY created_at ASC
  `;
  return rows.map(mapEvidenceRow);
}

export async function countDisputedEvidenceGlobally(): Promise<number> {
  const db = getDb();
  if (!db) {
    return listCasesMock().reduce((sum, c) => {
      const disputed = listEvidenceForCaseMock(c.leaseId).filter(
        (e) => e.reviewStatus === "DISPUTED",
      ).length;
      return sum + disputed;
    }, 0);
  }

  const rows = await db<{ count: string }[]>`
    SELECT COUNT(*)::text AS count
    FROM evidence_items
    WHERE review_status = 'DISPUTED'
  `;
  return Number(rows[0]?.count ?? 0);
}
