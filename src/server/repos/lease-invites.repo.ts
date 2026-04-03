import "server-only";

import { randomBytes } from "crypto";
import type postgres from "postgres";
import { getDb } from "@/server/db/client";

export async function createLeaseInvite(input: {
  leaseId: string;
  email: string;
  createdByUserId: string;
  ttlDays?: number;
}) {
  const db = getDb();
  if (!db) throw new Error("DATABASE_URL is not configured");

  const token = randomBytes(24).toString("hex");
  const ttlMs = (input.ttlDays ?? 14) * 864e5;
  const expiresAt = new Date(Date.now() + ttlMs);

  await db`
    INSERT INTO lease_invites (
      lease_id, email, token, role, expires_at, created_by_user_id
    )
    VALUES (
      ${input.leaseId},
      ${input.email.trim().toLowerCase()},
      ${token},
      'tenant',
      ${expiresAt.toISOString()},
      ${input.createdByUserId}::uuid
    )
  `;

  return { token, expiresAt };
}

export async function getInviteByToken(token: string) {
  const db = getDb();
  if (!db) return undefined;

  const rows = await db<{
    id: string;
    lease_id: string;
    email: string;
    expires_at: Date | string;
    accepted_at: Date | string | null;
  }[]>`
    SELECT id, lease_id, email, expires_at, accepted_at
    FROM lease_invites
    WHERE token = ${token}
    LIMIT 1
  `;
  return rows[0];
}

export async function acceptLeaseInvite(input: {
  token: string;
  userId: string;
  userEmail: string;
  displayName: string;
}) {
  const db = getDb();
  if (!db) throw new Error("DATABASE_URL is not configured");

  const invite = await getInviteByToken(input.token);
  if (!invite || invite.accepted_at) {
    return { ok: false as const, reason: "invalid_or_used" as const };
  }
  if (new Date(invite.expires_at) < new Date()) {
    return { ok: false as const, reason: "expired" as const };
  }
  const emailMatch =
    invite.email.trim().toLowerCase() ===
    input.userEmail.trim().toLowerCase();
  if (!emailMatch) {
    return { ok: false as const, reason: "email_mismatch" as const };
  }

  await db.begin(async (t) => {
    const sql = t as unknown as postgres.Sql;
    await sql`
      UPDATE lease_invites
      SET accepted_at = now()
      WHERE id = ${invite.id} AND accepted_at IS NULL
    `;
    await sql`
      UPDATE lease_cases
      SET
        tenant_user_id = ${input.userId},
        tenant_display_name = ${input.displayName},
        tenant_email = ${input.userEmail.trim().toLowerCase()},
        updated_at = now()
      WHERE lease_id = ${invite.lease_id}
    `;
    await sql`
      INSERT INTO case_memberships (
        lease_id, user_id, role, display_name, email
      )
      VALUES (
        ${invite.lease_id},
        ${input.userId}::uuid,
        'tenant',
        ${input.displayName},
        ${input.userEmail.trim().toLowerCase()}
      )
      ON CONFLICT (lease_id, user_id) DO NOTHING
    `;
  });

  return { ok: true as const, leaseId: invite.lease_id };
}
