import "server-only";

import type { Settlement, SettlementStatus } from "@/domain";
import { getSettlementForLease as getSettlementForLeaseMock } from "@/data/mock/settlements";
import { getDb } from "@/server/db/client";

type SettlementRow = {
  settlement_id: string;
  lease_id: string;
  deposit_amount_cents: string | bigint;
  deduction_amount_cents: string | bigint;
  refund_amount_cents: string | bigint;
  status: string;
  approved_by_tenant: boolean;
  approved_by_landlord: boolean;
  hedera_schedule_id: string | null;
  created_at: Date | string;
};

function isoTimestamp(v: Date | string): string {
  if (v instanceof Date) return v.toISOString();
  return new Date(v).toISOString();
}

function mapRow(row: SettlementRow): Settlement {
  return {
    settlementId: row.settlement_id,
    leaseId: row.lease_id,
    depositAmountCents: Number(row.deposit_amount_cents),
    deductionAmountCents: Number(row.deduction_amount_cents),
    refundAmountCents: Number(row.refund_amount_cents),
    status: row.status as SettlementStatus,
    approvedByTenant: row.approved_by_tenant,
    approvedByLandlord: row.approved_by_landlord,
    hederaScheduleId: row.hedera_schedule_id,
    createdAt: isoTimestamp(row.created_at),
  };
}

export async function getSettlementForLease(
  leaseId: string,
): Promise<Settlement | undefined> {
  const db = getDb();
  if (!db) return getSettlementForLeaseMock(leaseId);

  const rows = await db<SettlementRow[]>`
    SELECT
      settlement_id,
      lease_id,
      deposit_amount_cents,
      deduction_amount_cents,
      refund_amount_cents,
      status,
      approved_by_tenant,
      approved_by_landlord,
      hedera_schedule_id,
      created_at
    FROM settlements
    WHERE lease_id = ${leaseId}
    LIMIT 1
  `;
  const row = rows[0];
  return row ? mapRow(row) : undefined;
}
