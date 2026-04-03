import { NextResponse } from "next/server";
import { processHederaOutboxBatch } from "@/server/services/process-hedera-outbox";

/**
 * POST with header `Authorization: Bearer <CRON_SECRET>` to drain pending HCS outbox.
 * Wire to Vercel Cron or an external scheduler.
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 503 },
    );
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await processHederaOutboxBatch(25);
  return NextResponse.json(result);
}
