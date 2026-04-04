import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/auth/session";
import { isDatabaseConfigured } from "@/server/db/client";
import { getLeaseCaseById } from "@/server/repos/lease-cases.repo";
import { getMembershipRole, hasCaseAccess } from "@/server/repos/case-memberships.repo";
import { getSettlementForLease } from "@/server/repos/settlements.repo";
import { updateLeaseDepositCents } from "@/server/repos/lease-cases.mutations.repo";
import { parseDepositDollarsToCents } from "@/lib/parse-deposit-cents";
import { canLandlordAdjustDepositOrDeduction } from "@/lib/lease-financial-edit";
import type { SettlementStatus } from "@/domain";

export async function GET(
  _request: Request,
  context: { params: Promise<{ leaseId: string }> },
) {
  const { leaseId } = await context.params;
  if (isDatabaseConfigured()) {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const leaseCase = await getLeaseCaseById(leaseId, { viewerId: user.id });
    if (!leaseCase) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(leaseCase);
  }

  const leaseCase = await getLeaseCaseById(leaseId);
  if (!leaseCase) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(leaseCase);
}

/** Landlord-only: adjust recorded security deposit before settlement locks. */
export async function PATCH(
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
          "Deposit cannot be changed while settlement is proposed or approved, or after refund is in progress.",
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

  const depositDollars = String(
    (body as { depositDollars?: unknown }).depositDollars ?? "",
  ).trim();
  const depositCents = parseDepositDollarsToCents(depositDollars);
  if (depositCents === null || depositCents <= 0) {
    return NextResponse.json(
      { error: "Valid deposit amount (USD) is required" },
      { status: 400 },
    );
  }

  const result = await updateLeaseDepositCents({
    leaseId,
    landlordUserId: user.id,
    depositCents,
  });

  if (!result.ok) {
    const status = result.code === "not_found" ? 404 : 403;
    return NextResponse.json({ error: result.code }, { status });
  }

  return NextResponse.json({ depositCents });
}

