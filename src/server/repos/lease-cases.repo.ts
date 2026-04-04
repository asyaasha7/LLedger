import "server-only";

import type { LeaseCase, LeaseCaseStatus } from "@/domain";
import { findCaseById as findCaseByIdMock, listCases as listCasesMock } from "@/data/mock/cases";
import { getDb } from "@/server/db/client";
import { hasCaseAccess } from "@/server/repos/case-memberships.repo";

type LeaseCaseRow = {
  lease_id: string;
  property_ref: string;
  lease_ref: string;
  landlord_user_id: string;
  landlord_display_name: string;
  landlord_email: string | null;
  tenant_user_id: string | null;
  tenant_display_name: string | null;
  tenant_email: string | null;
  deposit_cents: string | bigint;
  lease_start: string | Date;
  lease_end: string | Date;
  status: string;
  hedera_topic_id: string | null;
  hedera_refund_schedule_id: string | null;
  next_action: string;
};

function isoDate(d: string | Date): string {
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return String(d).slice(0, 10);
}

function mapRow(row: LeaseCaseRow): LeaseCase {
  const tenant = row.tenant_user_id
    ? {
        userId: row.tenant_user_id,
        role: "tenant" as const,
        displayName: row.tenant_display_name ?? "Tenant",
        email: row.tenant_email ?? undefined,
      }
    : {
        userId: "pending",
        role: "tenant" as const,
        displayName:
          row.tenant_display_name?.trim() || "Tenant (invite pending)",
        email: row.tenant_email ?? undefined,
      };

  return {
    leaseId: row.lease_id,
    propertyRef: row.property_ref,
    leaseRef: row.lease_ref,
    landlord: {
      userId: row.landlord_user_id,
      role: "landlord",
      displayName: row.landlord_display_name,
      email: row.landlord_email ?? undefined,
    },
    tenant,
    depositCents: Number(row.deposit_cents),
    lease: {
      start: isoDate(row.lease_start),
      end: isoDate(row.lease_end),
    },
    status: row.status as LeaseCaseStatus,
    hederaTopicId: row.hedera_topic_id,
    hederaRefundScheduleId: row.hedera_refund_schedule_id,
    nextAction: row.next_action,
  };
}

/** @deprecated Use listLeaseCasesForUser for authenticated views when DATABASE_URL is set. */
export async function listLeaseCases(): Promise<readonly LeaseCase[]> {
  const db = getDb();
  if (!db) return listCasesMock();

  const rows = await db<LeaseCaseRow[]>`
    SELECT
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
      next_action
    FROM lease_cases
    ORDER BY lease_id ASC
  `;
  return rows.map(mapRow);
}

export async function listLeaseCasesForUser(
  userId: string,
): Promise<readonly LeaseCase[]> {
  const db = getDb();
  if (!db) return listCasesMock();

  const rows = await db<LeaseCaseRow[]>`
    SELECT
      lc.lease_id,
      lc.property_ref,
      lc.lease_ref,
      lc.landlord_user_id,
      lc.landlord_display_name,
      lc.landlord_email,
      lc.tenant_user_id,
      lc.tenant_display_name,
      lc.tenant_email,
      lc.deposit_cents,
      lc.lease_start,
      lc.lease_end,
      lc.status,
      lc.hedera_topic_id,
      lc.hedera_refund_schedule_id,
      lc.next_action
    FROM lease_cases lc
    WHERE EXISTS (
        SELECT 1 FROM case_memberships m
        WHERE m.lease_id = lc.lease_id AND m.user_id = ${userId}::uuid
      )
      OR lc.landlord_user_id = ${userId}
      OR (
        lc.tenant_user_id IS NOT NULL
        AND lc.tenant_user_id = ${userId}
      )
    ORDER BY lc.created_at DESC
  `;
  return rows.map(mapRow);
}

export async function getLeaseCaseById(
  leaseId: string,
  options?: { viewerId?: string | null },
): Promise<LeaseCase | undefined> {
  const db = getDb();
  if (!db) return findCaseByIdMock(leaseId);

  const rows = await db<LeaseCaseRow[]>`
    SELECT
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
      next_action
    FROM lease_cases
    WHERE lease_id = ${leaseId}
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) return undefined;
  if (options?.viewerId) {
    const ok = await hasCaseAccess(leaseId, options.viewerId);
    if (!ok) return undefined;
  }
  return mapRow(row);
}
