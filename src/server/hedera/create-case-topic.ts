import "server-only";

import type { Client } from "@hashgraph/sdk";
import { TopicCreateTransaction } from "@hashgraph/sdk";
import { parseOperatorPrivateKey } from "@/server/hedera/operator-key";

/**
 * Creates an HCS topic for one lease case. Submit key = operator key so only
 * this backend can publish (MVP).
 */
export async function createLeaseCaseTopic(
  client: Client,
  leaseId: string,
): Promise<string> {
  const operatorKey = parseOperatorPrivateKey(
    process.env.HEDERA_OPERATOR_KEY!.trim(),
  );
  const memo = `LeaseLedger:${leaseId}`.slice(0, 100);

  const tx = await new TopicCreateTransaction()
    .setTopicMemo(memo)
    .setSubmitKey(operatorKey.publicKey)
    .execute(client);

  const receipt = await tx.getReceipt(client);
  const topicId = receipt.topicId?.toString();
  if (!topicId) {
    throw new Error("TopicCreateTransaction did not return topicId");
  }
  return topicId;
}
