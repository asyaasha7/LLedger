import "server-only";

import type { CaseEventType, TimelineEvent, TimelineTone } from "@/domain";
import { listTimelineEvents as listTimelineEventsMock } from "@/data/mock/timeline";
import { getDb } from "@/server/db/client";
import { fetchTopicMessagesMirror } from "@/server/hedera/mirror";
import {
  listCaseEventsForLeaseTimeline,
  type CaseEventTimelineRow,
} from "@/server/repos/case-events.repo";

const EVENT_TITLE: Record<string, string> = {
  LEASE_CREATED: "Lease case created",
  TENANT_JOINED: "Tenant joined the case",
  EVIDENCE_SUBMITTED: "Evidence submitted",
  EVIDENCE_ACKNOWLEDGED: "Evidence acknowledged",
  EVIDENCE_DISPUTED: "Evidence disputed",
  COMMENT_ADDED: "Comment added",
  MORE_INFO_REQUESTED: "More information requested",
  DEDUCTION_PROPOSED: "Deduction proposed",
  SETTLEMENT_APPROVED: "Settlement approved",
  SETTLEMENT_REJECTED: "Settlement rejected",
  REFUND_SCHEDULED: "Refund scheduled",
  REFUND_EXECUTED: "Refund executed",
  AI_REVIEW_COMPLETED: "AI review note",
};

function actorLabel(role: string): string {
  if (role === "landlord") return "Landlord";
  if (role === "tenant") return "Tenant";
  if (role === "system") return "System";
  return role;
}

function toneForEventType(eventType: string): TimelineTone {
  if (
    eventType === "EVIDENCE_DISPUTED" ||
    eventType === "SETTLEMENT_REJECTED"
  ) {
    return "risk";
  }
  if (eventType === "AI_REVIEW_COMPLETED") return "ai";
  if (
    eventType === "SETTLEMENT_APPROVED" ||
    eventType === "REFUND_EXECUTED"
  ) {
    return "success";
  }
  return "neutral";
}

function formatTs(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function detailFromPayload(row: CaseEventTimelineRow): string {
  const p = row.payload;
  if (!p || typeof p !== "object" || Array.isArray(p)) {
    return "Workflow event recorded.";
  }
  const o = p as Record<string, unknown>;
  switch (row.event_type) {
    case "EVIDENCE_SUBMITTED":
      return [
        o.title ? String(o.title) : null,
        o.evidenceType ? String(o.evidenceType).replaceAll("_", " ") : null,
        o.fileHash ? `Hash ${String(o.fileHash).slice(0, 24)}…` : null,
      ]
        .filter(Boolean)
        .join(" · ");
    case "LEASE_CREATED":
      return o.propertyRef
        ? `Property ${o.propertyRef}${o.leaseRef ? ` · ${o.leaseRef}` : ""}`
        : "Case opened.";
    case "TENANT_JOINED":
      return o.displayName
        ? `${o.displayName} accepted the invite.`
        : "Tenant accepted the invite.";
    case "EVIDENCE_ACKNOWLEDGED":
      return o.title
        ? `Acknowledged · ${String(o.title)}`
        : "Evidence acknowledged.";
    case "EVIDENCE_DISPUTED": {
      const title = o.title ? String(o.title) : "item";
      const reason = o.reason ? String(o.reason) : null;
      return reason ? `Disputed · ${title}: ${reason}` : `Disputed · ${title}`;
    }
    case "DEDUCTION_PROPOSED":
      return [
        o.reason ? String(o.reason).slice(0, 120) : null,
        o.deductionCents != null
          ? `Deduction ${String(o.deductionCents)}¢`
          : null,
        o.refundCents != null ? `Refund ${String(o.refundCents)}¢` : null,
      ]
        .filter(Boolean)
        .join(" · ");
    case "SETTLEMENT_APPROVED":
      return o.refundCents != null
        ? `Approved · refund ${String(o.refundCents)}¢`
        : "Settlement approved.";
    case "SETTLEMENT_REJECTED":
      return "Settlement rejected.";
    case "REFUND_SCHEDULED":
      return o.scheduleId
        ? `Schedule ${String(o.scheduleId)}`
        : "Refund scheduled.";
    case "REFUND_EXECUTED": {
      const tx = o.executionTxId ? String(o.executionTxId) : "";
      const txLabel =
        tx.length > 32 ? `${tx.slice(0, 28)}…` : tx || null;
      if (txLabel) return `Executed · ${txLabel}`;
      if (o.refundCents != null) return `Refund ${String(o.refundCents)}¢ sent`;
      return "Refund executed.";
    }
    default:
      return "Workflow event recorded.";
  }
}

type MirrorMsg = {
  sequence_number?: number;
  message?: string;
};

function mirrorEventIdBySequence(
  mirrorJson: unknown,
): Map<number, string | undefined> {
  const map = new Map<number, string | undefined>();
  const root = mirrorJson as { messages?: MirrorMsg[] };
  for (const m of root.messages ?? []) {
    const seq = m.sequence_number;
    if (typeof seq !== "number") continue;
    try {
      const raw = Buffer.from(String(m.message ?? ""), "base64").toString(
        "utf8",
      );
      const j = JSON.parse(raw) as { eventId?: string };
      map.set(seq, j.eventId);
    } catch {
      map.set(seq, undefined);
    }
  }
  return map;
}

function hederaLabelForRow(
  row: CaseEventTimelineRow,
  mirrorIndex: Map<number, string | undefined> | null,
): string | undefined {
  if (row.hedera_sync_status === "pending") {
    return "Pending Hedera publish";
  }
  if (row.hedera_sync_status === "publishing") {
    return "Publishing to Hedera…";
  }
  if (row.hedera_sync_status === "failed") {
    return "Hedera publish failed";
  }
  if (row.hedera_sync_status !== "published") return undefined;

  const seq = row.topic_sequence ? Number(row.topic_sequence) : NaN;
  if (
    mirrorIndex &&
    Number.isFinite(seq) &&
    mirrorIndex.get(seq) === row.event_id
  ) {
    return "Mirror verified";
  }
  return "Recorded on Hedera";
}

function rowToTimelineEvent(
  row: CaseEventTimelineRow,
  caseId: string,
  mirrorIndex: Map<number, string | undefined> | null,
): TimelineEvent {
  const title =
    EVENT_TITLE[row.event_type] ?? row.event_type.replaceAll("_", " ");
  return {
    id: row.id,
    caseId,
    title,
    actorLabel: actorLabel(row.actor_role),
    timestampLabel: formatTs(row.created_at),
    detail: detailFromPayload(row),
    tone: toneForEventType(row.event_type),
    eventType: row.event_type as CaseEventType,
    hederaLabel: hederaLabelForRow(row, mirrorIndex),
  };
}

/**
 * DB-backed timeline with optional Mirror cross-check when a topic exists.
 */
export async function listUiTimelineEventsForLease(
  leaseId: string,
): Promise<TimelineEvent[]> {
  const db = getDb();
  if (!db) {
    return listTimelineEventsMock(leaseId);
  }

  const rows = await listCaseEventsForLeaseTimeline(leaseId);
  if (rows.length === 0) {
    return [];
  }

  const topicRows = await db<{ hedera_topic_id: string | null }[]>`
    SELECT hedera_topic_id FROM lease_cases WHERE lease_id = ${leaseId} LIMIT 1
  `;
  const topicId =
    topicRows[0]?.hedera_topic_id?.trim() ||
    rows.find((r) => r.topic_id)?.topic_id ||
    null;
  let mirrorIndex: Map<number, string | undefined> | null = null;
  if (topicId) {
    try {
      const json = await fetchTopicMessagesMirror(topicId, 200);
      mirrorIndex = mirrorEventIdBySequence(json);
    } catch {
      mirrorIndex = null;
    }
  }

  return rows.map((r) => rowToTimelineEvent(r, leaseId, mirrorIndex));
}
