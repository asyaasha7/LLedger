import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/auth/session";
import {
  getMembershipRole,
  hasCaseAccess,
} from "@/server/repos/case-memberships.repo";
import { respondToSettlement } from "@/server/repos/settlements.mutations.repo";
import { publishCaseEventToHedera } from "@/server/services/publish-case-event-hedera";
import { isDatabaseConfigured } from "@/server/db/client";
import type { UserRole } from "@/domain";

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
  if (role !== "landlord" && role !== "tenant") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const decision = (body as { decision?: string }).decision;
  if (decision !== "approve" && decision !== "reject") {
    return NextResponse.json(
      { error: 'decision must be "approve" or "reject"' },
      { status: 400 },
    );
  }

  const result = await respondToSettlement({
    leaseId,
    role: role as UserRole,
    decision,
  });

  if (!result.ok) {
    const status =
      result.code === "not_found"
        ? 404
        : result.code === "not_open"
          ? 409
          : 403;
    const msg =
      result.code === "not_found"
        ? "No settlement on file"
        : result.code === "not_open"
          ? "Settlement is not open for response"
          : "Invalid role";
    return NextResponse.json({ error: msg }, { status });
  }

  let hedera: Awaited<ReturnType<typeof publishCaseEventToHedera>> | null =
    null;
  if (result.caseEventId) {
    hedera = await publishCaseEventToHedera(result.caseEventId);
  }

  return NextResponse.json({
    eventType: result.eventType,
    hedera: hedera
      ? hedera.ok
        ? { published: !hedera.skipped }
        : { error: hedera.reason }
      : null,
  });
}
