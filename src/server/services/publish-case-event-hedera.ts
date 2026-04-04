import "server-only";

import { flattenPayloadForHcs } from "@/lib/hedera/flatten-payload-for-hcs";
import { isHederaOperational } from "@/config/hedera";
import { getDb } from "@/server/db/client";
import { getHederaOperatorClient } from "@/server/hedera/operator-client";
import { submitCaseEventHcsMessage } from "@/server/hedera/submit-case-event-message";
import {
  getCaseEventRowById,
  markCaseEventHederaFailed,
  markCaseEventHederaPublished,
  scheduleOutboxRetry,
} from "@/server/repos/case-events.repo";

export type PublishCaseEventResult =
  | { ok: true; skipped?: boolean }
  | { ok: false; reason: string };

/**
 * Publishes a pending case_events row to the lease HCS topic (idempotent if already published).
 */
export async function publishCaseEventToHedera(
  caseEventId: string,
): Promise<PublishCaseEventResult> {
  if (!isHederaOperational()) {
    return { ok: false, reason: "hedera_disabled" };
  }

  const row = await getCaseEventRowById(caseEventId);
  if (!row) {
    return { ok: false, reason: "event_not_found" };
  }
  if (row.hedera_sync_status === "published") {
    return { ok: true, skipped: true };
  }

  const db = getDb();
  if (!db) {
    return { ok: false, reason: "no_database" };
  }

  const leaseRows = await db<{ hedera_topic_id: string | null }[]>`
    SELECT hedera_topic_id FROM lease_cases WHERE lease_id = ${row.lease_id} LIMIT 1
  `;
  const topicId = leaseRows[0]?.hedera_topic_id?.trim() ?? null;
  if (!topicId) {
    await scheduleOutboxRetry(caseEventId, "no_topic_yet");
    return { ok: false, reason: "no_topic" };
  }

  const client = getHederaOperatorClient();
  if (!client) {
    return { ok: false, reason: "no_client" };
  }

  try {
    const body = flattenPayloadForHcs(row.payload);
    const submit = await submitCaseEventHcsMessage(client, topicId, {
      v: 1,
      leaseId: row.lease_id,
      eventType: row.event_type,
      actorRole: row.actor_role,
      eventId: row.event_id,
      body,
    });

    await markCaseEventHederaPublished({
      caseEventId,
      topicId,
      topicSequenceNumber: submit.topicSequenceNumber,
      runningHashHex: submit.runningHashHex,
      transactionId: submit.transactionId,
    });

    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await markCaseEventHederaFailed(caseEventId, msg);
    return { ok: false, reason: msg };
  } finally {
    try {
      client.close();
    } catch {
      /* ignore */
    }
  }
}
