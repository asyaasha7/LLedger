import "server-only";

import { listDueOutboxCaseEventIds } from "@/server/repos/case-events.repo";
import { publishCaseEventToHedera } from "@/server/services/publish-case-event-hedera";

export async function processHederaOutboxBatch(limit = 25): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
  results: { caseEventId: string; outcome: string }[];
}> {
  const ids = await listDueOutboxCaseEventIds(limit);
  const results: { caseEventId: string; outcome: string }[] = [];
  let succeeded = 0;
  let failed = 0;

  for (const caseEventId of ids) {
    const r = await publishCaseEventToHedera(caseEventId);
    const outcome = r.ok
      ? r.skipped
        ? "skipped_already_published"
        : "published"
      : r.reason;
    results.push({ caseEventId, outcome });
    if (r.ok) succeeded += 1;
    else failed += 1;
  }

  return {
    processed: ids.length,
    succeeded,
    failed,
    results,
  };
}
