import "server-only";

import { AccountId, Client } from "@hashgraph/sdk";
import { hederaConfig, isHederaOperational } from "@/config/hedera";
import { parseOperatorPrivateKey } from "@/server/hedera/operator-key";

export function getHederaOperatorClient(): Client | null {
  if (!isHederaOperational()) return null;

  const operatorId = process.env.HEDERA_OPERATOR_ID?.trim();
  const operatorKey = process.env.HEDERA_OPERATOR_KEY?.trim();
  if (!operatorId || !operatorKey) return null;

  const client =
    hederaConfig.network === "mainnet"
      ? Client.forMainnet()
      : hederaConfig.network === "previewnet"
        ? Client.forPreviewnet()
        : Client.forTestnet();

  client.setOperator(
    AccountId.fromString(operatorId),
    parseOperatorPrivateKey(operatorKey),
  );

  return client;
}
