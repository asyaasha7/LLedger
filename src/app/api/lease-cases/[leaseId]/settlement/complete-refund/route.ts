import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/auth/session";
import {
  getMembershipRole,
  hasCaseAccess,
} from "@/server/repos/case-memberships.repo";
import { recordRefundExecuted } from "@/server/repos/settlements.mutations.repo";
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

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    /* optional body */
  }

  const executionTxId =
    typeof (body as { executionTxId?: unknown }).executionTxId === "string"
      ? (body as { executionTxId: string }).executionTxId
      : null;

  const result = await recordRefundExecuted({ leaseId, executionTxId });

  if (!result.ok) {
    let status = 500;
    let msg = "Request failed";
    switch (result.code) {
      case "not_found":
        status = 404;
        msg = "No settlement on file";
        break;
      case "lease_not_scheduled":
        status = 409;
        msg = "Refund must be scheduled before marking executed";
        break;
      case "no_schedule_on_settlement":
        status = 409;
        msg = "Missing schedule reference on settlement";
        break;
      case "already_executed":
        status = 409;
        msg = "Refund already marked complete";
        break;
      case "settlement_not_approved":
        status = 409;
        msg = "Settlement is not in an executable state";
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
