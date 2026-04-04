import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/auth/session";
import {
  getMembershipRole,
  hasCaseAccess,
} from "@/server/repos/case-memberships.repo";
import {
  countEvidenceIdsOnLease,
  replaceActiveDeductionProposal,
} from "@/server/repos/deduction-proposals.repo";
import { getSettlementForLease } from "@/server/repos/settlements.repo";
import { getLeaseCaseById } from "@/server/repos/lease-cases.repo";
import { isDatabaseConfigured } from "@/server/db/client";
import { parseDepositDollarsToCents } from "@/lib/parse-deposit-cents";
import { canLandlordAdjustDepositOrDeduction } from "@/lib/lease-financial-edit";
import type { SettlementStatus } from "@/domain";

export async function POST(
  request: Request,
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

  const lease = await getLeaseCaseById(leaseId, { viewerId: user.id });
  if (!lease) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const settlement = await getSettlementForLease(leaseId);
  if (
    !canLandlordAdjustDepositOrDeduction(
      lease.status,
      settlement?.status as SettlementStatus | undefined,
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Deposit and deduction cannot be changed while settlement is proposed or approved, or after refund is in progress.",
      },
      { status: 409 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const deductionDollars = String(
    (body as { deductionDollars?: unknown }).deductionDollars ?? "",
  ).trim();
  const reason = String((body as { reason?: unknown }).reason ?? "").trim();
  const linkedEvidenceIds = Array.isArray(
    (body as { linkedEvidenceIds?: unknown }).linkedEvidenceIds,
  )
    ? (body as { linkedEvidenceIds: string[] }).linkedEvidenceIds.map((s) =>
        String(s).trim(),
      )
    : [];

  const amountCents = parseDepositDollarsToCents(deductionDollars);
  if (amountCents === null || amountCents < 0) {
    return NextResponse.json(
      { error: "Valid deduction amount (USD) is required" },
      { status: 400 },
    );
  }
  if (amountCents > lease.depositCents) {
    return NextResponse.json(
      { error: "Deduction cannot exceed the security deposit" },
      { status: 400 },
    );
  }
  if (reason.length < 3) {
    return NextResponse.json(
      { error: "Reason must be at least 3 characters" },
      { status: 400 },
    );
  }

  const uniqueIds = [...new Set(linkedEvidenceIds.filter(Boolean))];
  if (uniqueIds.length > 0) {
    const n = await countEvidenceIdsOnLease(leaseId, uniqueIds);
    if (n !== uniqueIds.length) {
      return NextResponse.json(
        { error: "One or more evidence IDs are not on this case" },
        { status: 400 },
      );
    }
  }

  const { proposalId } = await replaceActiveDeductionProposal({
    leaseId,
    amountCents,
    reason,
    linkedEvidenceIds: uniqueIds,
  });

  return NextResponse.json({ proposalId, amountCents, reason });
}
