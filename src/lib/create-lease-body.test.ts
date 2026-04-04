import { describe, expect, it } from "vitest";
import { parseCreateLeaseBody } from "./create-lease-body";

describe("parseCreateLeaseBody", () => {
  it("parses a valid payload", () => {
    const r = parseCreateLeaseBody({
      propertyRef: "  Unit 4B ",
      landlordDisplayName: "Alex",
      tenantDisplayName: "Jordan",
      tenantEmail: "j@example.com",
      depositDollars: "2400",
      leaseStart: "2024-01-01",
      leaseEnd: "2025-01-01",
      notes: " hi ",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.propertyRef).toBe("Unit 4B");
      expect(r.data.depositCents).toBe(240_000);
      expect(r.data.tenantEmail).toBe("j@example.com");
      expect(r.data.notes).toBe("hi");
    }
  });

  it("accepts depositCents number", () => {
    const r = parseCreateLeaseBody({
      propertyRef: "A",
      landlordDisplayName: "L",
      tenantDisplayName: "T",
      depositCents: 5000,
      leaseStart: "2024-01-01",
      leaseEnd: "2025-01-01",
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.depositCents).toBe(5000);
  });

  it("rejects missing required strings", () => {
    const r = parseCreateLeaseBody({
      propertyRef: "",
      landlordDisplayName: "L",
      tenantDisplayName: "T",
      depositDollars: "100",
      leaseStart: "2024-01-01",
      leaseEnd: "2025-01-01",
    });
    expect(r.ok).toBe(false);
  });

  it("rejects bad deposit", () => {
    const r = parseCreateLeaseBody({
      propertyRef: "A",
      landlordDisplayName: "L",
      tenantDisplayName: "T",
      depositDollars: "nope",
      leaseStart: "2024-01-01",
      leaseEnd: "2025-01-01",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(400);
  });
});
