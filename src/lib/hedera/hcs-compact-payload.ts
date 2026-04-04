/** Default HCS chunk size limit (bytes). */
export const HCS_DEFAULT_MAX_MESSAGE_BYTES = 1024;

export type HcsCaseEventV1 = {
  v: 1;
  leaseId: string;
  eventType: string;
  actorRole: string;
  eventId: string;
  /** Small primitives only — keep Mirror-friendly and under size cap. */
  body: Record<string, string | number | boolean | null>;
};

export function serializeHcsCaseEventV1(payload: HcsCaseEventV1): Uint8Array {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  if (bytes.length > HCS_DEFAULT_MAX_MESSAGE_BYTES) {
    throw new Error(
      `HCS payload ${bytes.length} bytes exceeds ${HCS_DEFAULT_MAX_MESSAGE_BYTES}`,
    );
  }
  return bytes;
}
