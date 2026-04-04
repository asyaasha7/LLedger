import { describe, expect, it } from "vitest";
import {
  HCS_DEFAULT_MAX_MESSAGE_BYTES,
  serializeHcsCaseEventV1,
} from "./hcs-compact-payload";

describe("serializeHcsCaseEventV1", () => {
  it("serializes a small LEASE_CREATED-style payload under the cap", () => {
    const bytes = serializeHcsCaseEventV1({
      v: 1,
      leaseId: "lease-abc",
      eventType: "LEASE_CREATED",
      actorRole: "landlord",
      eventId: "evt_1",
      body: { leaseRef: "LL-X", depositCents: 240000 },
    });
    expect(bytes.length).toBeLessThanOrEqual(HCS_DEFAULT_MAX_MESSAGE_BYTES);
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    expect(parsed.v).toBe(1);
    expect(parsed.eventType).toBe("LEASE_CREATED");
    expect(parsed.body.depositCents).toBe(240000);
  });

  it("throws when payload is too large", () => {
    const huge = "x".repeat(HCS_DEFAULT_MAX_MESSAGE_BYTES);
    expect(() =>
      serializeHcsCaseEventV1({
        v: 1,
        leaseId: "lease-1",
        eventType: "X",
        actorRole: "system",
        eventId: "evt_2",
        body: { blob: huge },
      }),
    ).toThrow(/exceeds/);
  });
});
