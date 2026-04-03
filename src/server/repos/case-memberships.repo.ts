import "server-only";

import { getDb } from "@/server/db/client";

export type MembershipRole = "landlord" | "tenant";

export async function hasCaseAccess(
  leaseId: string,
  userId: string,
): Promise<boolean> {
  const db = getDb();
  if (!db) return true;

  const rows = await db<{ ok: boolean }[]>`
    SELECT (
      EXISTS (
        SELECT 1 FROM case_memberships m
        WHERE m.lease_id = ${leaseId} AND m.user_id = ${userId}::uuid
      )
      OR EXISTS (
        SELECT 1 FROM lease_cases lc
        WHERE lc.lease_id = ${leaseId} AND lc.landlord_user_id = ${userId}
      )
    ) AS ok
  `;
  return Boolean(rows[0]?.ok);
}

export async function getMembershipRole(
  leaseId: string,
  userId: string,
): Promise<MembershipRole | null> {
  const db = getDb();
  if (!db) return "landlord";

  const rows = await db<{ role: string }[]>`
    SELECT role FROM case_memberships
    WHERE lease_id = ${leaseId} AND user_id = ${userId}::uuid
    LIMIT 1
  `;
  const r = rows[0]?.role;
  if (r === "landlord" || r === "tenant") return r;

  const lc = await db<{ landlord_user_id: string }[]>`
    SELECT landlord_user_id FROM lease_cases WHERE lease_id = ${leaseId} LIMIT 1
  `;
  if (lc[0]?.landlord_user_id === userId) return "landlord";

  const tenant = await db<{ tenant_user_id: string | null }[]>`
    SELECT tenant_user_id FROM lease_cases WHERE lease_id = ${leaseId} LIMIT 1
  `;
  if (tenant[0]?.tenant_user_id === userId) return "tenant";

  return null;
}

export async function insertMembership(input: {
  leaseId: string;
  userId: string;
  role: MembershipRole;
  displayName: string;
  email?: string | null;
  hederaAccountId?: string | null;
}) {
  const db = getDb();
  if (!db) throw new Error("DATABASE_URL is not configured");

  await db`
    INSERT INTO case_memberships (
      lease_id, user_id, role, display_name, email, hedera_account_id
    )
    VALUES (
      ${input.leaseId},
      ${input.userId}::uuid,
      ${input.role},
      ${input.displayName},
      ${input.email ?? null},
      ${input.hederaAccountId ?? null}
    )
  `;
}

export async function updateTenantHederaAccount(
  leaseId: string,
  userId: string,
  hederaAccountId: string,
) {
  const db = getDb();
  if (!db) throw new Error("DATABASE_URL is not configured");

  await db`
    UPDATE case_memberships
    SET hedera_account_id = ${hederaAccountId}
    WHERE lease_id = ${leaseId}
      AND user_id = ${userId}::uuid
      AND role = 'tenant'
  `;
}
