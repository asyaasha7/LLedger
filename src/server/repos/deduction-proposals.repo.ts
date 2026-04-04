import "server-only";

import { randomUUID } from "crypto";
import type postgres from "postgres";
import type { DeductionProposal, DeductionProposalStatus } from "@/domain";
import {
  listDeductionProposalsForLease as listDeductionProposalsForLeaseMock,
} from "@/data/mock/deduction-proposals";
import { getDb } from "@/server/db/client";

type ProposalRow = {
  proposal_id: string;
  lease_id: string;
  amount_cents: string | bigint;
  reason: string;
  linked_evidence_ids: string[];
  status: string;
  created_at: Date | string;
};

function isoTimestamp(v: Date | string): string {
  if (v instanceof Date) return v.toISOString();
  return new Date(v).toISOString();
}

function mapRow(row: ProposalRow): DeductionProposal {
  return {
    proposalId: row.proposal_id,
    leaseId: row.lease_id,
    amountCents: Number(row.amount_cents),
    reason: row.reason,
    linkedEvidenceIds: [...row.linked_evidence_ids],
    status: row.status as DeductionProposalStatus,
    createdAt: isoTimestamp(row.created_at),
  };
}

export async function listDeductionProposalsForLease(
  leaseId: string,
): Promise<DeductionProposal[]> {
  const db = getDb();
  if (!db) return listDeductionProposalsForLeaseMock(leaseId);

  const rows = await db<ProposalRow[]>`
    SELECT
      proposal_id,
      lease_id,
      amount_cents,
      reason,
      linked_evidence_ids,
      status,
      created_at
    FROM deduction_proposals
    WHERE lease_id = ${leaseId}
    ORDER BY created_at ASC
  `;
  return rows.map(mapRow);
}

/** Supersede any ACTIVE row and insert a new ACTIVE proposal (landlord workflow). */
export async function replaceActiveDeductionProposal(input: {
  leaseId: string;
  amountCents: number;
  reason: string;
  linkedEvidenceIds: string[];
}): Promise<{ proposalId: string }> {
  const db = getDb();
  if (!db) throw new Error("DATABASE_URL is not configured");

  const proposalId = `ded-${randomUUID()}`;

  await db.begin(async (t) => {
    const sql = t as unknown as postgres.Sql;
    await sql`
      UPDATE deduction_proposals
      SET status = 'SUPERSEDED'
      WHERE lease_id = ${input.leaseId} AND status = 'ACTIVE'
    `;
    await sql`
      INSERT INTO deduction_proposals (
        proposal_id,
        lease_id,
        amount_cents,
        reason,
        linked_evidence_ids,
        status
      )
      VALUES (
        ${proposalId},
        ${input.leaseId},
        ${input.amountCents},
        ${input.reason.trim()},
        ${sql.array(input.linkedEvidenceIds)},
        'ACTIVE'
      )
    `;
  });

  return { proposalId };
}

export async function countEvidenceIdsOnLease(
  leaseId: string,
  evidenceIds: string[],
): Promise<number> {
  if (evidenceIds.length === 0) return 0;
  const pg = getDb();
  if (!pg) return evidenceIds.length;

  const rows = await pg<{ count: string }[]>`
    SELECT COUNT(*)::text AS count
    FROM evidence_items
    WHERE lease_id = ${leaseId}
      AND evidence_id IN ${pg(evidenceIds)}
  `;
  return Number(rows[0]?.count ?? 0);
}
