/**
 * Hedera integration placeholders (spec §11).
 * Next step: wire HCS topic messages, scheduled transactions, and Mirror Node reads.
 *
 * Persistence (Supabase Postgres): set `DATABASE_URL` (server-only). Repos fall back to
 * mock data when it is unset — see `src/server/db/client.ts`.
 *
 * Environment (suggested):
 * - NEXT_PUBLIC_HEDERA_NETWORK=testnet|mainnet|previewnet
 * - NEXT_PUBLIC_HEDERA_MIRROR_BASE=…
 * - HEDERA_OPERATOR_ID / HEDERA_OPERATOR_KEY (server-only for tx submission)
 */

export type HederaNetworkName = "testnet" | "mainnet" | "previewnet";

function readEnv(key: string): string | undefined {
  if (typeof process === "undefined" || !process.env) return undefined;
  return process.env[key];
}

export const hederaConfig = {
  /** Feature gate until operator credentials and topics are wired. */
  enabled: readEnv("NEXT_PUBLIC_HEDERA_ENABLED") === "true",
  network: (readEnv("NEXT_PUBLIC_HEDERA_NETWORK") ?? "testnet") as HederaNetworkName,
  /** Base URL for Mirror Node REST (no trailing slash). */
  mirrorRestBase:
    readEnv("NEXT_PUBLIC_HEDERA_MIRROR_BASE") ??
    "https://testnet.mirrornode.hedera.com",
} as const;

export const HEDERA_PRIVACY_NOTE =
  "Raw evidence is never published on Hedera — only hashes, private storage refs, and workflow events.";
