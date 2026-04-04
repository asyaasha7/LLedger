/** Parse user-entered dollar amount to integer cents. */
export function parseDepositDollarsToCents(raw: string | number): number | null {
  const s = String(raw).replace(/[$,\s]/g, "");
  if (s === "") return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}
