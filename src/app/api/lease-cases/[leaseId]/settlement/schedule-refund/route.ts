import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/auth/session";
import {
  getMembershipRole,
  hasCaseAccess,
} from "@/server/repos/case-memberships.repo";
import { recordRefundScheduled } from "@/server/repos/settlements.mutations.repo";
import { publishCaseEventToHedera } from "@/server/services/publish-case-event-hedera";
import { isDatabaseConfigured } from "@/server/db/client";

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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const scheduleId = String((body as { scheduleId?: unknown }).scheduleId ?? "");

  const result = await recordRefundScheduled({ leaseId, scheduleId });

  if (!result.ok) {
    let status = 500;
    let msg = "Request failed";
    switch (result.code) {
      case "not_found":
        status = 404;
        msg = "No settlement on file";
        break;
      case "not_approved":
        status = 409;
        msg = "Settlement must be fully approved";
        break;
      case "lease_not_ready":
        status = 409;
        msg = "Case must be approved for refund before scheduling";
        break;
      case "already_scheduled":
        status = 409;
        msg = "Refund already scheduled";
        break;
      case "invalid_schedule":
        status = 400;
        msg = "scheduleId is required";
        break;
      case "no_database":
        status = 503;
        msg = "Database unavailable";
        break;
      default:
        break;
    }
    return NextResponse.json({ error: msg }, { status });
  }

  const hedera = await publishCaseEventToHedera(result.caseEventId);

  return NextResponse.json({
    caseEventId: result.caseEventId,
    hedera: hedera.ok
      ? { published: !hedera.skipped }
      : { error: hedera.reason },
  });
}
