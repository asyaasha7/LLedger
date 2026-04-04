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
import type postgres from "postgres";
import { appendCaseEvent } from "@/server/repos/case-events.repo";
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

export async function getEvidenceItemByIds(
  leaseId: string,
  evidenceId: string,
): Promise<EvidenceItem | null> {
  const db = getDb();
  if (!db) return null;

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
    WHERE lease_id = ${leaseId} AND evidence_id = ${evidenceId}
    LIMIT 1
  `;
  const row = rows[0];
  return row ? mapEvidenceRow(row) : null;
}

export async function insertEvidenceItem(input: {
  leaseId: string;
  evidenceId: string;
  submittedByUserId: string;
  submitterRole: UserRole;
  evidenceType: EvidenceType;
  category: EvidenceCategory;
  title: string;
  description: string;
  roomTag?: string | null;
  fileHash: string;
  encryptedStorageRef: string;
}): Promise<{ caseEventId: string; eventId: string }> {
  const db = getDb();
  if (!db) throw new Error("DATABASE_URL is not configured");

  let caseEventId = "";
  let eventId = "";

  await db.begin(async (t) => {
    const sql = t as unknown as postgres.Sql;
    await sql`
      INSERT INTO evidence_items (
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
        review_status
      )
      VALUES (
        ${input.evidenceId},
        ${input.leaseId},
        ${input.submittedByUserId},
        ${input.submitterRole},
        ${input.evidenceType},
        ${input.category},
        ${input.title},
        ${input.description},
        ${input.roomTag ?? null},
        ${input.fileHash},
        ${input.encryptedStorageRef},
        'SUBMITTED'
      )
    `;

    const appended = await appendCaseEvent(
      {
        leaseId: input.leaseId,
        eventType: "EVIDENCE_SUBMITTED",
        actorRole: input.submitterRole,
        payload: {
          evidenceId: input.evidenceId,
          fileHash: input.fileHash,
          evidenceType: input.evidenceType,
          storageKey: input.encryptedStorageRef,
          title: input.title,
        },
      },
      sql,
    );
    caseEventId = appended.caseEventId;
    eventId = appended.eventId;
  });

  return { caseEventId, eventId };
}

export type EvidenceReviewAction = "acknowledge" | "dispute";

export async function applyEvidenceReviewAction(input: {
  leaseId: string;
  evidenceId: string;
  reviewerUserId: string;
  reviewerRole: UserRole;
  action: EvidenceReviewAction;
  note?: string | null;
}): Promise<
  | { ok: true; caseEventId: string; eventId: string }
  | {
      ok: false;
      code: "not_found" | "cannot_review_own" | "invalid_status";
    }
> {
  const db = getDb();
  if (!db) throw new Error("DATABASE_URL is not configured");

  const eventType =
    input.action === "acknowledge"
      ? "EVIDENCE_ACKNOWLEDGED"
      : "EVIDENCE_DISPUTED";
  const newStatus =
    input.action === "acknowledge" ? "ACKNOWLEDGED" : "DISPUTED";

  type TxResult =
    | { err: "not_found" | "cannot_review_own" | "invalid_status" }
    | { ok: true; caseEventId: string; eventId: string };

  const tx = await db.begin(async (t) => {
    const sql = t as unknown as postgres.Sql;
    const rows = await sql<EvidenceRow[]>`
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
      WHERE lease_id = ${input.leaseId} AND evidence_id = ${input.evidenceId}
      FOR UPDATE
    `;
    const row = rows[0];
    if (!row) {
      return { err: "not_found" } as const;
    }
    if (row.submitter_role === input.reviewerRole) {
      return { err: "cannot_review_own" } as const;
    }
    if (row.review_status !== "SUBMITTED") {
      return { err: "invalid_status" } as const;
    }

    await sql`
      UPDATE evidence_items
      SET review_status = ${newStatus}
      WHERE lease_id = ${input.leaseId} AND evidence_id = ${input.evidenceId}
    `;

    const note = input.note?.trim() || null;
    const payload: Record<string, string> = {
      evidenceId: row.evidence_id,
      fileHash: row.file_hash,
      title: row.title,
      reviewerUserId: input.reviewerUserId,
    };
    if (note && input.action === "dispute") {
      payload.reason = note;
    }

    const appended = await appendCaseEvent(
      {
        leaseId: input.leaseId,
        eventType,
        actorRole: input.reviewerRole,
        payload,
      },
      sql,
    );
    return {
      ok: true as const,
      caseEventId: appended.caseEventId,
      eventId: appended.eventId,
    };
  });

  const result = tx as TxResult;
  if ("err" in result) {
    return { ok: false, code: result.err };
  }
  return { ok: true, caseEventId: result.caseEventId, eventId: result.eventId };
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
