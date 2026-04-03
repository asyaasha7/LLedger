import type { MoneyCents } from "@/domain";

export function refundAmountCents(
  depositCents: MoneyCents,
  deductionCents: MoneyCents,
): MoneyCents {
  return Math.max(0, depositCents - deductionCents);
}
