import { NextResponse } from "next/server";
import { getLeaseCaseById } from "@/server/repos/lease-cases.repo";

export async function GET(
  _request: Request,
  context: { params: Promise<{ leaseId: string }> },
) {
  const { leaseId } = await context.params;
  const leaseCase = await getLeaseCaseById(leaseId);
  if (!leaseCase) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(leaseCase);
}
