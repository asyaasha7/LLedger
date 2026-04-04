import { parseDepositDollarsToCents } from "./parse-deposit-cents";

/** Fields parsed from POST /api/lease-cases JSON (session fills landlord user id). */
export type CreateLeaseBodyFields = {
  propertyRef: string;
  landlordDisplayName: string;
  tenantDisplayName: string;
  tenantEmail: string | null;
  leaseStart: string;
  leaseEnd: string;
  notes: string;
  depositCents: number;
};

export type ParseCreateLeaseBodyResult =
  | { ok: true; data: CreateLeaseBodyFields }
  | { ok: false; error: string; status: number };

export function parseCreateLeaseBody(
  body: Record<string, unknown>,
): ParseCreateLeaseBodyResult {
  const propertyRef = String(body.propertyRef ?? "").trim();
  const landlordDisplayName = String(body.landlordDisplayName ?? "").trim();
  const tenantDisplayName = String(body.tenantDisplayName ?? "").trim();
  const tenantEmail = body.tenantEmail
    ? String(body.tenantEmail).trim()
    : null;
  const leaseStart = String(body.leaseStart ?? "").trim();
  const leaseEnd = String(body.leaseEnd ?? "").trim();
  const notes = String(body.notes ?? "").trim();
  const depositCents =
    typeof body.depositCents === "number" && Number.isFinite(body.depositCents)
      ? Math.round(body.depositCents)
      : parseDepositDollarsToCents(String(body.depositDollars ?? ""));

  if (!propertyRef || !landlordDisplayName || !tenantDisplayName) {
    return {
      ok: false,
      error:
        "propertyRef, landlordDisplayName, and tenantDisplayName are required",
      status: 400,
    };
  }
  if (depositCents === null || depositCents < 0) {
    return {
      ok: false,
      error: "Valid depositDollars or depositCents is required",
      status: 400,
    };
  }
  if (!leaseStart || !leaseEnd) {
    return {
      ok: false,
      error: "leaseStart and leaseEnd are required (YYYY-MM-DD)",
      status: 400,
    };
  }

  return {
    ok: true,
    data: {
      propertyRef,
      landlordDisplayName,
      tenantDisplayName,
      tenantEmail,
      leaseStart,
      leaseEnd,
      notes,
      depositCents,
    },
  };
}
