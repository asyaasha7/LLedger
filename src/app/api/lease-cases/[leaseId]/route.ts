import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/auth/session";
import { isDatabaseConfigured } from "@/server/db/client";
import { getLeaseCaseById } from "@/server/repos/lease-cases.repo";

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
