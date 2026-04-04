import "server-only";

import { randomUUID } from "crypto";
import type postgres from "postgres";
import { getDb } from "@/server/db/client";

type JsonPayload = postgres.JSONValue;
type Sql = postgres.Sql;

export async function appendCaseEvent(
  input: {
    leaseId: string;
    eventType: string;
    actorRole: string;
    payload: JsonPayload;
    source?: string;
  },
  client?: Sql,
) {
  const sql = client ?? getDb();
  if (!sql) throw new Error("DATABASE_URL is not configured");

  const eventId = `evt_${randomUUID()}`;
  const rows = await sql<{ id: string }[]>`
    INSERT INTO case_events (
      event_id,
      lease_id,
      event_type,
      actor_role,
      source,
      payload,
      hedera_sync_status
    )
    VALUES (
      ${eventId},
      ${input.leaseId},
      ${input.eventType},
      ${input.actorRole},
      ${input.source ?? "app"},
      ${sql.json(input.payload)},
      'pending'
    )
    RETURNING id
  `;

  const caseEventId = rows[0]!.id;
  await sql`
    INSERT INTO hedera_outbox (case_event_id, status, next_attempt_at)
    VALUES (${caseEventId}, 'pending', now())
    ON CONFLICT (case_event_id) DO NOTHING
  `;

  return { eventId, caseEventId };
}

export async function markCaseEventHederaPublished(input: {
  caseEventId: string;
  topicId: string;
  topicSequenceNumber: string;
  runningHashHex: string;
  transactionId: string;
}) {
  const db = getDb();
  if (!db) throw new Error("DATABASE_URL is not configured");

  await db`
    UPDATE case_events
    SET
      hedera_sync_status = 'published',
      topic_id = ${input.topicId},
      topic_sequence = ${input.topicSequenceNumber}::bigint,
      running_hash = ${input.runningHashHex},
      transaction_id = ${input.transactionId}
    WHERE id = ${input.caseEventId}::uuid
  `;

  await db`
    UPDATE hedera_outbox
    SET status = 'completed', last_error = NULL
    WHERE case_event_id = ${input.caseEventId}::uuid
  `;
}

export async function markCaseEventHederaFailed(
  caseEventId: string,
  message: string,
) {
  const db = getDb();
  if (!db) throw new Error("DATABASE_URL is not configured");

  await db`
    UPDATE case_events
    SET hedera_sync_status = 'failed'
    WHERE id = ${caseEventId}::uuid
  `;

  await db`
    UPDATE hedera_outbox
    SET
      status = 'failed',
      last_error = ${message.slice(0, 2000)},
      attempt_count = attempt_count + 1
    WHERE case_event_id = ${caseEventId}::uuid
  `;
}

export async function getCaseEventRowById(caseEventId: string) {
  const db = getDb();
  if (!db) return undefined;

  const rows = await db<{
    id: string;
    event_id: string;
    lease_id: string;
    event_type: string;
    actor_role: string;
    payload: unknown;
    hedera_sync_status: string;
  }[]>`
    SELECT
      id,
      event_id,
      lease_id,
      event_type,
      actor_role,
      payload,
      hedera_sync_status
    FROM case_events
    WHERE id = ${caseEventId}::uuid
    LIMIT 1
  `;
  return rows[0];
}

export type CaseEventTimelineRow = {
  id: string;
  event_id: string;
  lease_id: string;
  event_type: string;
  actor_role: string;
  payload: unknown;
  created_at: string;
  hedera_sync_status: string;
  topic_sequence: string | null;
  transaction_id: string | null;
  running_hash: string | null;
  topic_id: string | null;
};

export async function listCaseEventsForLeaseTimeline(
  leaseId: string,
): Promise<CaseEventTimelineRow[]> {
  const db = getDb();
  if (!db) return [];

  const rows = await db<{
    id: string;
    event_id: string;
    lease_id: string;
    event_type: string;
    actor_role: string;
    payload: unknown;
    created_at: Date | string;
    hedera_sync_status: string;
    topic_sequence: bigint | string | null;
    transaction_id: string | null;
    running_hash: string | null;
    topic_id: string | null;
  }[]>`
    SELECT
      id,
      event_id,
      lease_id,
      event_type,
      actor_role,
      payload,
      created_at,
      hedera_sync_status,
      topic_sequence::text AS topic_sequence,
      transaction_id,
      running_hash,
      topic_id
    FROM case_events
    WHERE lease_id = ${leaseId}
    ORDER BY created_at ASC
  `;

  return rows.map((r) => ({
    id: r.id,
    event_id: r.event_id,
    lease_id: r.lease_id,
    event_type: r.event_type,
    actor_role: r.actor_role,
    payload: r.payload,
    created_at:
      r.created_at instanceof Date
        ? r.created_at.toISOString()
        : String(r.created_at),
    hedera_sync_status: r.hedera_sync_status,
    topic_sequence: r.topic_sequence != null ? String(r.topic_sequence) : null,
    transaction_id: r.transaction_id,
    running_hash: r.running_hash,
    topic_id: r.topic_id,
  }));
}

export async function listDueOutboxCaseEventIds(limit: number): Promise<
  string[]
> {
  const db = getDb();
  if (!db) return [];

  const rows = await db<{ case_event_id: string }[]>`
    SELECT o.case_event_id::text AS case_event_id
    FROM hedera_outbox o
    INNER JOIN case_events ce ON ce.id = o.case_event_id
    WHERE ce.hedera_sync_status = 'pending'
      AND o.status = 'pending'
      AND o.next_attempt_at <= now()
    ORDER BY o.next_attempt_at ASC
    LIMIT ${limit}
  `;
  return rows.map((r) => r.case_event_id);
}

export async function scheduleOutboxRetry(
  caseEventId: string,
  lastError: string,
) {
  const db = getDb();
  if (!db) return;

  const rows = await db<{ attempt_count: number }[]>`
    SELECT attempt_count FROM hedera_outbox
    WHERE case_event_id = ${caseEventId}::uuid
    LIMIT 1
  `;
  const n = rows[0]?.attempt_count ?? 0;
  const delaySec = Math.min(30 * 2 ** Math.min(n, 10), 3600);
  const next = new Date(Date.now() + delaySec * 1000).toISOString();

  await db`
    UPDATE hedera_outbox
    SET
      last_error = ${lastError.slice(0, 2000)},
      attempt_count = attempt_count + 1,
      next_attempt_at = ${next},
      status = 'pending'
    WHERE case_event_id = ${caseEventId}::uuid
  `;
}
