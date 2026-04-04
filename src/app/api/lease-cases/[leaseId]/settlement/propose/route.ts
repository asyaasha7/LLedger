import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/auth/session";
import {
  getMembershipRole,
  hasCaseAccess,
} from "@/server/repos/case-memberships.repo";
import { listDeductionProposalsForLease } from "@/server/repos/deduction-proposals.repo";
import { proposeDeductionSettlement } from "@/server/repos/settlements.mutations.repo";
import { publishCaseEventToHedera } from "@/server/services/publish-case-event-hedera";
import { getDb, isDatabaseConfigured } from "@/server/db/client";
import {
  canLandlordSubmitProposal,
  canProposeDeductionSettlement,
} from "@/lib/settlement-workflow";
import { getSettlementForLease } from "@/server/repos/settlements.repo";

export async function POST(
  _request: Request,
  context: { params: Promise<{ leaseId: string }> },
) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "DATABASE_URL is not configured" },
      { status: 503 },
    );
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { leaseId } = await context.params;
  if (!(await hasCaseAccess(leaseId, user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const role = await getMembershipRole(leaseId, user.id);
  if (role !== "landlord") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const leaseRows = await db<
    { deposit_cents: string | bigint; status: string }[]
  >`
    SELECT deposit_cents, status FROM lease_cases
    WHERE lease_id = ${leaseId} LIMIT 1
  `;
  const leaseRow = leaseRows[0];
  if (!leaseRow) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  const leaseStatus = leaseRow.status;
  if (!canProposeDeductionSettlement(leaseStatus)) {
    return NextResponse.json(
      { error: "Settlement proposal is not allowed for this case status" },
      { status: 409 },
    );
  }

  const existing = await getSettlementForLease(leaseId);
  if (!canLandlordSubmitProposal(leaseStatus, existing?.status)) {
    return NextResponse.json(
      { error: "A finalized settlement already exists for this case" },
      { status: 409 },
    );
  }

  const proposals = await listDeductionProposalsForLease(leaseId);
  const active = proposals.find((p) => p.status === "ACTIVE");
  if (!active) {
    return NextResponse.json(
      { error: "No active deduction proposal to publish" },
      { status: 400 },
    );
  }

  const depositCents = Number(leaseRow.deposit_cents);
  const result = await proposeDeductionSettlement({
    leaseId,
    proposalId: active.proposalId,
    depositCents,
    deductionCents: active.amountCents,
    reason: active.reason,
    linkedEvidenceIds: active.linkedEvidenceIds,
  });

  if (!result.ok) {
    if (result.code === "lease_not_found") {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  const hedera = await publishCaseEventToHedera(result.caseEventId);

  return NextResponse.json({
    caseEventId: result.caseEventId,
    hedera: hedera.ok
      ? { published: !hedera.skipped }
      : { error: hedera.reason },
  });
}
