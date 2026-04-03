/** Short display for proof / content hashes (not security truncation). */
export function truncateProofDisplay(hash: string, head = 6, tail = 4): string {
  const clean = hash.replace(/^sha256:/i, "").replace(/^0x/i, "");
  if (clean.length <= head + tail + 1) return clean;
  return `${clean.slice(0, head)}…${clean.slice(-tail)}`;
}
