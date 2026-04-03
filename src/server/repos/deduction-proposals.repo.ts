import "server-only";

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
