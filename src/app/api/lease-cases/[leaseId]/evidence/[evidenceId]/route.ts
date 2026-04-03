import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/auth/session";
import {
  getMembershipRole,
  hasCaseAccess,
} from "@/server/repos/case-memberships.repo";
import { applyEvidenceReviewAction } from "@/server/repos/evidence.repo";
import { publishCaseEventToHedera } from "@/server/services/publish-case-event-hedera";
import { isDatabaseConfigured } from "@/server/db/client";
import type { EvidenceReviewAction } from "@/server/repos/evidence.repo";
import type { UserRole } from "@/domain";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ leaseId: string; evidenceId: string }> },
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

  const { leaseId, evidenceId } = await context.params;
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

  const action = (body as { action?: string }).action;
  const note =
    typeof (body as { note?: unknown }).note === "string"
      ? (body as { note: string }).note
      : null;

  if (action !== "acknowledge" && action !== "dispute") {
    return NextResponse.json(
      { error: "action must be \"acknowledge\" or \"dispute\"" },
      { status: 400 },
    );
  }

  let result;
  try {
    result = await applyEvidenceReviewAction({
      leaseId,
      evidenceId,
      reviewerUserId: user.id,
      reviewerRole: role as UserRole,
      action: action as EvidenceReviewAction,
      note,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  if (!result.ok) {
    const status =
      result.code === "not_found"
        ? 404
        : result.code === "cannot_review_own"
          ? 403
          : 409;
    const message =
      result.code === "not_found"
        ? "Evidence not found"
        : result.code === "cannot_review_own"
          ? "You cannot review your own submission"
          : "Evidence is not awaiting review";
    return NextResponse.json({ error: message }, { status });
  }

  const hedera = await publishCaseEventToHedera(result.caseEventId);

  return NextResponse.json({
    reviewStatus: action === "acknowledge" ? "ACKNOWLEDGED" : "DISPUTED",
    eventId: result.eventId,
    hedera: hedera.ok
      ? { published: !hedera.skipped }
      : { error: hedera.reason },
  });
}
