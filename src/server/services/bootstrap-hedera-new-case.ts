import "server-only";

import { getDb } from "@/server/db/client";
import {
  getCaseEventRowById,
  markCaseEventHederaFailed,
  markCaseEventHederaPublished,
} from "@/server/repos/case-events.repo";
import { createLeaseCaseTopic } from "@/server/hedera/create-case-topic";
import { getHederaOperatorClient } from "@/server/hedera/operator-client";
import { flattenPayloadForHcs } from "@/lib/hedera/flatten-payload-for-hcs";
import { submitCaseEventHcsMessage } from "@/server/hedera/submit-case-event-message";

export type BootstrapHederaNewCaseResult =
  | { ok: true; topicId: string; transactionId: string }
  | { ok: false; skipped: true }
  | { ok: false; error: string };

/**
 * After DB commit: create topic, persist on lease, publish LEASE_CREATED to HCS,
 * mark case_events + outbox.
 */
export async function bootstrapHederaForNewLeaseCase(input: {
  leaseId: string;
  leaseCreatedCaseEventId: string;
  publicEventId: string;
}): Promise<BootstrapHederaNewCaseResult> {
  const client = getHederaOperatorClient();
  if (!client) {
    return { ok: false, skipped: true };
  }

  const db = getDb();
  if (!db) {
    return { ok: false, error: "DATABASE_URL is not configured" };
  }

  const row = await getCaseEventRowById(input.leaseCreatedCaseEventId);
  if (!row || row.event_type !== "LEASE_CREATED") {
    return { ok: false, error: "LEASE_CREATED case_event not found" };
  }

  try {
    const topicId = await createLeaseCaseTopic(client, input.leaseId);

    await db`
      UPDATE lease_cases
      SET hedera_topic_id = ${topicId}, updated_at = now()
      WHERE lease_id = ${input.leaseId}
    `;

    const body = flattenPayloadForHcs(row.payload);

    const submit = await submitCaseEventHcsMessage(client, topicId, {
      v: 1,
      leaseId: input.leaseId,
      eventType: row.event_type,
      actorRole: row.actor_role,
      eventId: input.publicEventId,
      body,
    });

    await markCaseEventHederaPublished({
      caseEventId: input.leaseCreatedCaseEventId,
      topicId,
      topicSequenceNumber: submit.topicSequenceNumber,
      runningHashHex: submit.runningHashHex,
      transactionId: submit.transactionId,
    });

    return { ok: true, topicId, transactionId: submit.transactionId };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await markCaseEventHederaFailed(input.leaseCreatedCaseEventId, msg);
    return { ok: false, error: msg };
  } finally {
    try {
      client.close();
    } catch {
      /* ignore */
    }
  }
}
