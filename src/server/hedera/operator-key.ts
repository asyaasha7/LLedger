import "server-only";

import { PrivateKey } from "@hashgraph/sdk";

/**
 * Parses operator key from env: `0x` + 32-byte hex → ECDSA (EVM-style);
 * otherwise Hedera DER / mnemonic forms via `fromString`.
 */
export function parseOperatorPrivateKey(raw: string): PrivateKey {
  const s = raw.trim();
  if (/^0x[0-9a-fA-F]{64}$/.test(s)) {
    return PrivateKey.fromStringECDSA(s);
  }
  return PrivateKey.fromString(s);
}
