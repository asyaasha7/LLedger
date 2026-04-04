/**
 * Canonical public origin for OAuth / invite redirects (emails must hit the real host).
 *
 * - Local requests (localhost) use the request origin or explicit env.
 * - On Vercel, if NEXT_PUBLIC_SITE_URL is missing or still localhost, use VERCEL_URL
 *   so preview/production links are not generated as http://localhost:3000.
 */
export function getSiteOrigin(request: Request): string {
  const req = new URL(request.url);
  const reqOrigin = req.origin;
  const host = req.hostname;
  const isLocalRequest =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.endsWith(".local");

  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") ?? "";
  const explicitIsLocal =
    !explicit ||
    explicit.includes("127.0.0.1") ||
    explicit.includes("localhost");

  const vercel = process.env.VERCEL_URL?.trim();
  const vercelOrigin =
    vercel && !vercel.startsWith("http")
      ? `https://${vercel}`
      : vercel || "";

  if (isLocalRequest) {
    if (explicit) return explicit;
    return reqOrigin;
  }

  if (explicit && !explicitIsLocal) {
    return explicit;
  }
  if (vercelOrigin) {
    return vercelOrigin;
  }
  if (explicit) {
    return explicit;
  }
  return reqOrigin;
}
