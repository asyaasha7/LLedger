import "server-only";

import type postgres from "postgres";
import type { SettlementStatus, UserRole } from "@/domain";
import { refundAmountCents } from "@/lib/money";
import {
  applySettlementResponse,
  leaseStatusAfterSettlementOutcome,
} from "@/lib/settlement-workflow";
import { appendCaseEvent } from "@/server/repos/case-events.repo";
import { getDb } from "@/server/db/client";

type Sql = postgres.Sql;

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
};

export async function proposeDeductionSettlement(input: {
  leaseId: string;
  proposalId: string;
  depositCents: number;
  deductionCents: number;
  reason: string;
  linkedEvidenceIds: string[];
}): Promise<
  | { ok: true; caseEventId: string }
  | { ok: false; code: "no_database" | "lease_not_found" }
> {
  const db = getDb();
  if (!db) return { ok: false, code: "no_database" };

  const refund = refundAmountCents(input.depositCents, input.deductionCents);
  const settlementId = `set-${input.leaseId}`;

  type ProposeTxResult =
    | { err: "lease_not_found" }
    | { ok: true; caseEventId: string };

  const result = await db.begin(async (t): Promise<ProposeTxResult> => {
    const sql = t as unknown as Sql;
    const leaseRows = await sql<{ lease_id: string }[]>`
      SELECT lease_id FROM lease_cases
      WHERE lease_id = ${input.leaseId}
      FOR UPDATE
      LIMIT 1
    `;
    if (!leaseRows[0]) {
      return { err: "lease_not_found" as const };
    }

    await sql`
      INSERT INTO settlements (
        settlement_id,
        lease_id,
        deposit_amount_cents,
        deduction_amount_cents,
        refund_amount_cents,
        status,
        approved_by_tenant,
        approved_by_landlord,
        hedera_schedule_id
      )
      VALUES (
        ${settlementId},
        ${input.leaseId},
        ${input.depositCents},
        ${input.deductionCents},
        ${refund},
        'PROPOSED',
        false,
        true,
        NULL
      )
      ON CONFLICT (lease_id) DO UPDATE SET
        deposit_amount_cents = EXCLUDED.deposit_amount_cents,
        deduction_amount_cents = EXCLUDED.deduction_amount_cents,
        refund_amount_cents = EXCLUDED.refund_amount_cents,
        status = 'PROPOSED',
        approved_by_tenant = false,
        approved_by_landlord = true,
        hedera_schedule_id = NULL
    `;

    await sql`
      UPDATE lease_cases
      SET
        status = 'SETTLEMENT_PENDING',
        next_action = 'Review settlement proposal',
        updated_at = now()
      WHERE lease_id = ${input.leaseId}
    `;

    const ev = await appendCaseEvent(
      {
        leaseId: input.leaseId,
        eventType: "DEDUCTION_PROPOSED",
        actorRole: "landlord",
        payload: {
          proposalId: input.proposalId,
          depositCents: input.depositCents,
          deductionCents: input.deductionCents,
          refundCents: refund,
          reason: input.reason,
          linkedEvidenceIds: input.linkedEvidenceIds.join(","),
        },
      },
      sql,
    );
    return { ok: true as const, caseEventId: ev.caseEventId };
  });

  if ("err" in result) {
    return { ok: false, code: result.err };
  }
  return { ok: true, caseEventId: result.caseEventId };
}

export async function respondToSettlement(input: {
  leaseId: string;
  role: UserRole;
  decision: "approve" | "reject";
}): Promise<
  | {
      ok: true;
      caseEventId: string | null;
      eventType: "SETTLEMENT_APPROVED" | "SETTLEMENT_REJECTED" | null;
    }
  | {
      ok: false;
      code: "no_database" | "not_found" | "not_open" | "wrong_role";
    }
> {
  if (input.role !== "landlord" && input.role !== "tenant") {
    return { ok: false, code: "wrong_role" };
  }

  const db = getDb();
  if (!db) return { ok: false, code: "no_database" };

  type RespondTxResult =
    | { err: "not_found" | "not_open" }
    | {
        ok: true;
        caseEventId: string | null;
        eventType: "SETTLEMENT_APPROVED" | "SETTLEMENT_REJECTED" | null;
      };

  const result = await db.begin(async (t): Promise<RespondTxResult> => {
    const sql = t as unknown as Sql;
    const leaseLock = await sql<{ lease_id: string }[]>`
      SELECT lease_id FROM lease_cases
      WHERE lease_id = ${input.leaseId}
      FOR UPDATE
      LIMIT 1
    `;
    if (!leaseLock[0]) {
      return { err: "not_found" };
    }

    const rows = await sql<SettlementRow[]>`
      SELECT
        settlement_id,
        lease_id,
        deposit_amount_cents,
        deduction_amount_cents,
        refund_amount_cents,
        status,
        approved_by_tenant,
        approved_by_landlord,
        hedera_schedule_id
      FROM settlements
      WHERE lease_id = ${input.leaseId}
      FOR UPDATE
      LIMIT 1
    `;
    const row = rows[0];
    if (!row) {
      return { err: "not_found" as const };
    }

    const reduced = applySettlementResponse(
      {
        status: row.status as SettlementStatus,
        approvedByTenant: row.approved_by_tenant,
        approvedByLandlord: row.approved_by_landlord,
      },
      { role: input.role, decision: input.decision },
    );

    if (!reduced.ok) {
      return { err: "not_open" as const };
    }

    await sql`
      UPDATE settlements
      SET
        status = ${reduced.next.status},
        approved_by_tenant = ${reduced.next.approvedByTenant},
        approved_by_landlord = ${reduced.next.approvedByLandlord}
      WHERE lease_id = ${input.leaseId}
    `;

    const leaseDelta = leaseStatusAfterSettlementOutcome(reduced.outcome);
    if (leaseDelta) {
      const nextAction =
        leaseDelta === "DISPUTED"
          ? "Settlement rejected — update proposal or evidence"
          : "Schedule refund on Hedera";
      await sql`
        UPDATE lease_cases
        SET
          status = ${leaseDelta},
          next_action = ${nextAction},
          updated_at = now()
        WHERE lease_id = ${input.leaseId}
      `;
    }

    if (reduced.outcome.kind === "partial_approve") {
      return {
        ok: true as const,
        caseEventId: null,
        eventType: null,
      };
    }

    const et =
      reduced.outcome.kind === "reject"
        ? ("SETTLEMENT_REJECTED" as const)
        : ("SETTLEMENT_APPROVED" as const);

    const ev = await appendCaseEvent(
      {
        leaseId: input.leaseId,
        eventType: et,
        actorRole: input.role,
        payload: {
          settlementId: row.settlement_id,
          depositCents: Number(row.deposit_amount_cents),
          deductionCents: Number(row.deduction_amount_cents),
          refundCents: Number(row.refund_amount_cents),
        },
      },
      sql,
    );
    return {
      ok: true as const,
      caseEventId: ev.caseEventId,
      eventType: et,
    };
  });

  if ("err" in result) {
    return { ok: false, code: result.err };
  }
  return {
    ok: true,
    caseEventId: result.caseEventId,
    eventType: result.eventType,
  };
}

export async function recordRefundScheduled(input: {
  leaseId: string;
  scheduleId: string;
}): Promise<
  | { ok: true; caseEventId: string }
  | {
      ok: false;
      code:
        | "no_database"
        | "not_found"
        | "not_approved"
        | "already_scheduled"
        | "lease_not_ready"
        | "invalid_schedule";
    }
> {
  const db = getDb();
  if (!db) return { ok: false, code: "no_database" };

  const sid = input.scheduleId.trim();
  if (!sid) {
    return { ok: false, code: "invalid_schedule" };
  }

  type ScheduleTxResult =
    | { err: "not_found" | "not_approved" | "lease_not_ready" | "already_scheduled" }
    | { ok: true; caseEventId: string };

  const result = await db.begin(async (t): Promise<ScheduleTxResult> => {
    const sql = t as unknown as Sql;
    const leaseLock = await sql<{ lease_id: string; status: string }[]>`
      SELECT lease_id, status FROM lease_cases
      WHERE lease_id = ${input.leaseId}
      FOR UPDATE
      LIMIT 1
    `;
    const leaseRow = leaseLock[0];
    if (!leaseRow) {
      return { err: "not_found" };
    }

    const rows = await sql<SettlementRow[]>`
      SELECT
        settlement_id,
        lease_id,
        deposit_amount_cents,
        deduction_amount_cents,
        refund_amount_cents,
        status,
        approved_by_tenant,
        approved_by_landlord,
        hedera_schedule_id
      FROM settlements
      WHERE lease_id = ${input.leaseId}
      FOR UPDATE
      LIMIT 1
    `;
    const row = rows[0];
    if (!row) {
      return { err: "not_found" as const };
    }
    if (row.status !== "APPROVED") {
      return { err: "not_approved" as const };
    }

    if (leaseRow.status !== "APPROVED_FOR_REFUND") {
      return { err: "lease_not_ready" as const };
    }
    if (row.hedera_schedule_id) {
      return { err: "already_scheduled" as const };
    }

    await sql`
      UPDATE settlements
      SET hedera_schedule_id = ${sid}
      WHERE lease_id = ${input.leaseId}
    `;
    await sql`
      UPDATE lease_cases
      SET
        hedera_refund_schedule_id = ${sid},
        status = 'REFUND_SCHEDULED',
        next_action = 'Refund scheduled — awaiting execution',
        updated_at = now()
      WHERE lease_id = ${input.leaseId}
    `;

    const ev = await appendCaseEvent(
      {
        leaseId: input.leaseId,
        eventType: "REFUND_SCHEDULED",
        actorRole: "landlord",
        payload: {
          scheduleId: sid,
          refundCents: Number(row.refund_amount_cents),
          settlementId: row.settlement_id,
        },
      },
      sql,
    );
    return { ok: true as const, caseEventId: ev.caseEventId };
  });

  if ("err" in result) {
    return { ok: false, code: result.err };
  }
  return { ok: true, caseEventId: result.caseEventId };
}

export async function recordRefundExecuted(input: {
  leaseId: string;
  executionTxId?: string | null;
}): Promise<
  | { ok: true; caseEventId: string }
  | {
      ok: false;
      code:
        | "no_database"
        | "not_found"
        | "lease_not_scheduled"
        | "no_schedule_on_settlement"
        | "already_executed"
        | "settlement_not_approved";
    }
> {
  const db = getDb();
  if (!db) return { ok: false, code: "no_database" };

  const txId = input.executionTxId?.trim() || null;

  type ExecTxResult =
    | {
        err:
          | "not_found"
          | "lease_not_scheduled"
          | "no_schedule_on_settlement"
          | "already_executed"
          | "settlement_not_approved";
      }
    | { ok: true; caseEventId: string };

  const result = await db.begin(async (t): Promise<ExecTxResult> => {
    const sql = t as unknown as Sql;
    const leaseLock = await sql<{ lease_id: string; status: string }[]>`
      SELECT lease_id, status FROM lease_cases
      WHERE lease_id = ${input.leaseId}
      FOR UPDATE
      LIMIT 1
    `;
    const leaseRow = leaseLock[0];
    if (!leaseRow) {
      return { err: "not_found" };
    }
    if (leaseRow.status !== "REFUND_SCHEDULED") {
      return { err: "lease_not_scheduled" };
    }

    const rows = await sql<SettlementRow[]>`
      SELECT
        settlement_id,
        lease_id,
        deposit_amount_cents,
        deduction_amount_cents,
        refund_amount_cents,
        status,
        approved_by_tenant,
        approved_by_landlord,
        hedera_schedule_id
      FROM settlements
      WHERE lease_id = ${input.leaseId}
      FOR UPDATE
      LIMIT 1
    `;
    const row = rows[0];
    if (!row) {
      return { err: "not_found" };
    }
    if (row.status === "EXECUTED") {
      return { err: "already_executed" };
    }
    if (row.status !== "APPROVED") {
      return { err: "settlement_not_approved" };
    }
    const scheduleId = row.hedera_schedule_id?.trim() ?? "";
    if (!scheduleId) {
      return { err: "no_schedule_on_settlement" };
    }

    await sql`
      UPDATE settlements
      SET status = 'EXECUTED'
      WHERE lease_id = ${input.leaseId}
    `;
    await sql`
      UPDATE lease_cases
      SET
        status = 'REFUND_COMPLETE',
        next_action = 'Refund complete',
        updated_at = now()
      WHERE lease_id = ${input.leaseId}
    `;

    const payload: Record<string, string> = {
      scheduleId,
      refundCents: String(Number(row.refund_amount_cents)),
      settlementId: row.settlement_id,
    };
    if (txId) {
      payload.executionTxId = txId;
    }

    const ev = await appendCaseEvent(
      {
        leaseId: input.leaseId,
        eventType: "REFUND_EXECUTED",
        actorRole: "landlord",
        payload,
      },
      sql,
    );
    return { ok: true as const, caseEventId: ev.caseEventId };
  });

  if ("err" in result) {
    return { ok: false, code: result.err };
  }
  return { ok: true, caseEventId: result.caseEventId };
}
