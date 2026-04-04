import "server-only";

import type { Client } from "@hashgraph/sdk";
import { TopicId, TopicMessageSubmitTransaction } from "@hashgraph/sdk";
import { serializeHcsCaseEventV1 } from "@/lib/hedera/hcs-compact-payload";

export type SubmitCaseEventResult = {
  topicSequenceNumber: string;
  runningHashHex: string;
  transactionId: string;
};

export async function submitCaseEventHcsMessage(
  client: Client,
  topicId: string,
  envelope: Parameters<typeof serializeHcsCaseEventV1>[0],
): Promise<SubmitCaseEventResult> {
  const message = serializeHcsCaseEventV1(envelope);

  const tx = await new TopicMessageSubmitTransaction()
    .setTopicId(TopicId.fromString(topicId))
    .setMessage(message)
    .execute(client);

  const receipt = await tx.getReceipt(client);
  const seq = receipt.topicSequenceNumber?.toString();
  const rh = receipt.topicRunningHash;
  if (!seq || !rh) {
    throw new Error("Topic message receipt missing sequence or running hash");
  }

  const runningHashHex = Buffer.from(rh).toString("hex");

  return {
    topicSequenceNumber: seq,
    runningHashHex,
    transactionId: tx.transactionId.toString(),
  };
}
