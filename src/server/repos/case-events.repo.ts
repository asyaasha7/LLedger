import "server-only";

import { randomUUID } from "crypto";
import type postgres from "postgres";

type JsonPayload = postgres.JSONValue;
import { getDb } from "@/server/db/client";

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
  const db = client ?? getDb();
  if (!db) throw new Error("DATABASE_URL is not configured");

  const eventId = `evt_${randomUUID()}`;
  const rows = await db<{ id: string }[]>`
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
      ${db.json(input.payload)},
      'pending'
    )
    RETURNING id
  `;

  const caseEventId = rows[0]!.id;
  await db`
    INSERT INTO hedera_outbox (case_event_id, status, next_attempt_at)
    VALUES (${caseEventId}, 'pending', now())
    ON CONFLICT (case_event_id) DO NOTHING
  `;

  return { eventId, caseEventId };
}
