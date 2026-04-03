/**
 * Resolve `/cases/:caseId/...` segments from the pathname (client or server).
 */
export function extractCaseIdFromPath(pathname: string): string | undefined {
  const match = pathname.match(/^\/cases\/([^/]+)/);
  const id = match?.[1];
  if (!id || id === "new") return undefined;
  return id;
}
