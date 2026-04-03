import type { TimelineEvent } from "@/domain";

const EVENTS_LEASE_001: TimelineEvent[] = [
  {
    id: "tl-1",
    caseId: "lease-001",
    title: "Lease created",
    actorLabel: "You",
    timestampLabel: "Apr 1, 2026 · 9:12 AM",
    detail: "Case opened and parties recorded.",
    tone: "neutral",
    eventType: "LEASE_CREATED",
  },
  {
    id: "tl-2",
    caseId: "lease-001",
    title: "Move-in evidence submitted",
    actorLabel: "Jordan Lee",
    timestampLabel: "Apr 2, 2026 · 2:04 PM",
    detail: "12 files · move-in set",
    tone: "neutral",
    eventType: "EVIDENCE_SUBMITTED",
  },
  {
    id: "tl-3",
    caseId: "lease-001",
    title: "AI review note",
    actorLabel: "LeaseLedger",
    timestampLabel: "Apr 2, 2026 · 2:06 PM",
    detail: "Possible wall damage flagged · medium confidence",
    tone: "ai",
    eventType: "AI_REVIEW_COMPLETED",
  },
  {
    id: "tl-4",
    caseId: "lease-001",
    title: "Damage disputed",
    actorLabel: "Jordan Lee",
    timestampLabel: "Apr 3, 2026 · 11:20 AM",
    detail: "Tenant disagrees with scratch assessment",
    tone: "risk",
    eventType: "EVIDENCE_DISPUTED",
  },
  {
    id: "tl-5",
    caseId: "lease-001",
    title: "Deduction proposed",
    actorLabel: "You",
    timestampLabel: "Apr 3, 2026 · 3:00 PM",
    detail: "Landlord linked move-out and damage evidence",
    tone: "neutral",
    eventType: "DEDUCTION_PROPOSED",
  },
  {
    id: "tl-6",
    caseId: "lease-001",
    title: "Awaiting settlement response",
    actorLabel: "Jordan Lee",
    timestampLabel: "Apr 4, 2026 · 4:00 PM",
    detail: "Proposed deduction is open for tenant review.",
    tone: "neutral",
  },
];

const EVENTS_LEASE_002: TimelineEvent[] = [
  {
    id: "tl-o1",
    caseId: "lease-002",
    title: "Lease created",
    actorLabel: "You",
    timestampLabel: "Jan 10, 2026",
    detail: "Case opened.",
    tone: "neutral",
    eventType: "LEASE_CREATED",
  },
  {
    id: "tl-o2",
    caseId: "lease-002",
    title: "Evidence uploaded",
    actorLabel: "Sam Rivera",
    timestampLabel: "Feb 2, 2026",
    detail: "Move-in documentation.",
    tone: "neutral",
    eventType: "EVIDENCE_SUBMITTED",
  },
];

const BY_CASE: Record<string, TimelineEvent[]> = {
  "lease-001": EVENTS_LEASE_001,
  "lease-002": EVENTS_LEASE_002,
};

export function listTimelineEvents(caseId: string): TimelineEvent[] {
  return BY_CASE[caseId] ?? [];
}
