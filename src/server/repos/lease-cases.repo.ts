import "server-only";

import type { LeaseCase, LeaseCaseStatus } from "@/domain";
import { findCaseById as findCaseByIdMock, listCases as listCasesMock } from "@/data/mock/cases";
import { getDb } from "@/server/db/client";

type LeaseCaseRow = {
  lease_id: string;
  property_ref: string;
  lease_ref: string;
  landlord_user_id: string;
  landlord_display_name: string;
  landlord_email: string | null;
  tenant_user_id: string;
  tenant_display_name: string;
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
    tenant: {
      userId: row.tenant_user_id,
      role: "tenant",
      displayName: row.tenant_display_name,
      email: row.tenant_email ?? undefined,
    },
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

export async function getLeaseCaseById(
  leaseId: string,
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
  return row ? mapRow(row) : undefined;
}
