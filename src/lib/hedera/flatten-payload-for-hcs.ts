/** Reduce JSONB payload to HCS-safe primitives (compact mirror messages). */
export function flattenPayloadForHcs(
  payload: unknown,
): Record<string, string | number | boolean | null> {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {};
  }
  const out: Record<string, string | number | boolean | null> = {};
  for (const [k, v] of Object.entries(payload as Record<string, unknown>)) {
    if (
      v === null ||
      typeof v === "string" ||
      typeof v === "number" ||
      typeof v === "boolean"
    ) {
      out[k] = v;
    } else if (typeof v === "bigint") {
      out[k] = Number(v);
    }
  }
  return out;
}
