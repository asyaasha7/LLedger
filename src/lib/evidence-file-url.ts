/** Authenticated GET; session cookie is sent when used from same-origin <img> / fetch. */
export function evidenceFileUrl(leaseId: string, evidenceId: string): string {
  return `/api/lease-cases/${encodeURIComponent(leaseId)}/evidence/${encodeURIComponent(evidenceId)}/file`;
}
