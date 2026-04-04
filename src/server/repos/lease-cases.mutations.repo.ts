import "server-only";

import { randomUUID } from "crypto";
import type postgres from "postgres";
import { appendCaseEvent } from "@/server/repos/case-events.repo";
import { getDb } from "@/server/db/client";

export type CreateLeaseCaseInput = {
  propertyRef: string;
  landlordUserId: string;
  landlordDisplayName: string;
  landlordEmail?: string | null;
  tenantDisplayName: string;
  tenantEmail?: string | null;
  depositCents: number;
  leaseStart: string;
  leaseEnd: string;
  notes: string;
  idempotencyKey?: string | null;
};

export async function createLeaseCaseWithMembership(
  input: CreateLeaseCaseInput,
): Promise<{
  leaseId: string;
  leaseRef: string;
  leaseCreatedCaseEventId: string;
  leaseCreatedPublicEventId: string;
}> {
  const db = getDb();
  if (!db) throw new Error("DATABASE_URL is not configured");

  const leaseId = `lease-${randomUUID()}`;
  const leaseRef = `LL-${Date.now().toString(36).toUpperCase()}`;
  const nextAction = "Invite your tenant to join this case";

  let leaseCreatedCaseEventId = "";
  let leaseCreatedPublicEventId = "";

  await db.begin(async (t) => {
    const sql = t as unknown as postgres.Sql;
    await sql`
      INSERT INTO lease_cases (
        lease_id,
        property_ref,
        lease_ref,
        landlord_user_id,
        landlord_display_name,
        landlord_email,
        tenant_user_id,
        tenant_display_name,
        tenant_email,
        deposit_cents,
        lease_start,
        lease_end,
        status,
        hedera_topic_id,
        hedera_refund_schedule_id,
        next_action,
        notes,
        idempotency_key
      )
      VALUES (
        ${leaseId},
        ${input.propertyRef.trim()},
        ${leaseRef},
        ${input.landlordUserId},
        ${input.landlordDisplayName.trim()},
        ${input.landlordEmail?.trim() ?? null},
        ${null},
        ${input.tenantDisplayName.trim()},
        ${input.tenantEmail?.trim().toLowerCase() ?? null},
        ${input.depositCents},
        ${input.leaseStart},
        ${input.leaseEnd},
        'OPEN',
        ${null},
        ${null},
        ${nextAction},
        ${input.notes.trim()},
        ${input.idempotencyKey?.trim() ?? null}
      )
    `;

    await sql`
      INSERT INTO case_memberships (
        lease_id, user_id, role, display_name, email
      )
      VALUES (
        ${leaseId},
        ${input.landlordUserId}::uuid,
        'landlord',
        ${input.landlordDisplayName.trim()},
        ${input.landlordEmail?.trim().toLowerCase() ?? null}
      )
    `;

    const created = await appendCaseEvent(
      {
        leaseId,
        eventType: "LEASE_CREATED",
        actorRole: "landlord",
        payload: {
          propertyRef: input.propertyRef.trim(),
          leaseRef,
          depositCents: input.depositCents,
          leaseStart: input.leaseStart,
          leaseEnd: input.leaseEnd,
        },
      },
      sql,
    );
    leaseCreatedCaseEventId = created.caseEventId;
    leaseCreatedPublicEventId = created.eventId;
  });

  return {
    leaseId,
    leaseRef,
    leaseCreatedCaseEventId,
    leaseCreatedPublicEventId,
  };
}

export async function findLeaseIdByIdempotencyKey(
  key: string,
): Promise<string | undefined> {
  const db = getDb();
  if (!db) return undefined;
  const rows = await db<{ lease_id: string }[]>`
    SELECT lease_id FROM lease_cases WHERE idempotency_key = ${key} LIMIT 1
  `;
  return rows[0]?.lease_id;
}
