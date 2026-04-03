import "server-only";

import type { TimelineEvent } from "@/domain";
import { listTimelineEvents as listTimelineEventsMock } from "@/data/mock/timeline";

/**
 * UI timeline rows for `/cases/[id]/timeline`.
 * Still sourced from mock until case_events + Mirror hydration land (unified timeline).
 */
export async function listUiTimelineEventsForLease(
  leaseId: string,
): Promise<TimelineEvent[]> {
  return listTimelineEventsMock(leaseId);
}
