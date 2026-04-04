/**
 * Deduction shown in previews: active landlord proposal wins, else persisted
 * settlement snapshot, else zero (no invented defaults).
 */
export function resolvedDeductionAmountCents(input: {
  activeDeductionProposal?: { amountCents: number } | null;
  settlement?: { deductionAmountCents: number } | null;
}): number {
  const fromProposal = input.activeDeductionProposal?.amountCents;
  if (typeof fromProposal === "number" && Number.isFinite(fromProposal)) {
    return fromProposal;
  }
  const fromSettlement = input.settlement?.deductionAmountCents;
  if (typeof fromSettlement === "number" && Number.isFinite(fromSettlement)) {
    return fromSettlement;
  }
  return 0;
}
