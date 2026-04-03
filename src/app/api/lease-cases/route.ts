import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/auth/session";
import { parseCreateLeaseBody } from "@/lib/create-lease-body";
import { isDatabaseConfigured } from "@/server/db/client";
import {
  createLeaseCaseWithMembership,
  findLeaseIdByIdempotencyKey,
} from "@/server/repos/lease-cases.mutations.repo";
import {
  listLeaseCasesForUser,
} from "@/server/repos/lease-cases.repo";
import { bootstrapHederaForNewLeaseCase } from "@/server/services/bootstrap-hedera-new-case";

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

  const parsed = parseCreateLeaseBody(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }
  const d = parsed.data;

  try {
    const {
      leaseId,
      leaseRef,
      leaseCreatedCaseEventId,
      leaseCreatedPublicEventId,
    } = await createLeaseCaseWithMembership({
      propertyRef: d.propertyRef,
      landlordUserId: user.id,
      landlordDisplayName: d.landlordDisplayName,
      landlordEmail: user.email ?? null,
      tenantDisplayName: d.tenantDisplayName,
      tenantEmail: d.tenantEmail,
      depositCents: d.depositCents,
      leaseStart: d.leaseStart,
      leaseEnd: d.leaseEnd,
      notes: d.notes,
      idempotencyKey: idempotencyKey ?? null,
    });

    const hedera = await bootstrapHederaForNewLeaseCase({
      leaseId,
      leaseCreatedCaseEventId,
      publicEventId: leaseCreatedPublicEventId,
    });

    const hederaJson =
      hedera.ok
        ? {
            topicId: hedera.topicId,
            transactionId: hedera.transactionId,
          }
        : "skipped" in hedera && hedera.skipped
          ? { skipped: true as const }
          : { error: (hedera as { error: string }).error };

    return NextResponse.json(
      { leaseId, leaseRef, hedera: hederaJson },
      { status: 201 },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Create failed";
    if (message.includes("unique") || message.includes("duplicate")) {
      return NextResponse.json({ error: "Conflict" }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
