import "server-only";

import { getSessionUser } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { getLeaseCaseById } from "@/server/repos/lease-cases.repo";

/** Resolves a case for UI: no access check without DB; with DB requires session + membership. */
export async function getLeaseCaseForRequest(caseId: string) {
  const db = getDb();
  if (!db) {
    return getLeaseCaseById(caseId);
  }
  const user = await getSessionUser();
  if (!user) return undefined;
  return getLeaseCaseById(caseId, { viewerId: user.id });
}
