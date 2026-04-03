import type { MoneyCents } from "@/domain";

export function formatMoney(cents: MoneyCents): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
