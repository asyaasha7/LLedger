import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/auth/session";
import { parseDepositDollarsToCents } from "@/lib/parse-deposit-cents";
import { isDatabaseConfigured } from "@/server/db/client";
import {
  createLeaseCaseWithMembership,
  findLeaseIdByIdempotencyKey,
} from "@/server/repos/lease-cases.mutations.repo";
import {
  listLeaseCasesForUser,
} from "@/server/repos/lease-cases.repo";

export async function GET() {
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
  const cases = await listLeaseCasesForUser(user.id);
  return NextResponse.json({ cases });
}

export async function POST(request: Request) {
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

  const idempotencyKey = request.headers.get("Idempotency-Key")?.trim();
  if (idempotencyKey) {
    const existing = await findLeaseIdByIdempotencyKey(idempotencyKey);
    if (existing) {
      return NextResponse.json(
        { leaseId: existing, idempotentReplay: true },
        { status: 200 },
      );
    }
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const propertyRef = String(body.propertyRef ?? "").trim();
  const landlordDisplayName = String(body.landlordDisplayName ?? "").trim();
  const tenantDisplayName = String(body.tenantDisplayName ?? "").trim();
  const tenantEmail = body.tenantEmail
    ? String(body.tenantEmail).trim()
    : null;
  const leaseStart = String(body.leaseStart ?? "").trim();
  const leaseEnd = String(body.leaseEnd ?? "").trim();
  const notes = String(body.notes ?? "").trim();
  const depositCents =
    typeof body.depositCents === "number" && Number.isFinite(body.depositCents)
      ? Math.round(body.depositCents)
      : parseDepositDollarsToCents(String(body.depositDollars ?? ""));

  if (!propertyRef || !landlordDisplayName || !tenantDisplayName) {
    return NextResponse.json(
      { error: "propertyRef, landlordDisplayName, and tenantDisplayName are required" },
      { status: 400 },
    );
  }
  if (depositCents === null || depositCents < 0) {
    return NextResponse.json(
      { error: "Valid depositDollars or depositCents is required" },
      { status: 400 },
    );
  }
  if (!leaseStart || !leaseEnd) {
    return NextResponse.json(
      { error: "leaseStart and leaseEnd are required (YYYY-MM-DD)" },
      { status: 400 },
    );
  }

  try {
    const { leaseId, leaseRef } = await createLeaseCaseWithMembership({
      propertyRef,
      landlordUserId: user.id,
      landlordDisplayName,
      landlordEmail: user.email ?? null,
      tenantDisplayName,
      tenantEmail,
      depositCents,
      leaseStart,
      leaseEnd,
      notes,
      idempotencyKey: idempotencyKey ?? null,
    });
    return NextResponse.json({ leaseId, leaseRef }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Create failed";
    if (message.includes("unique") || message.includes("duplicate")) {
      return NextResponse.json({ error: "Conflict" }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
