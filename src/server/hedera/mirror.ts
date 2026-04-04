import "server-only";

import { hederaConfig } from "@/config/hedera";

/** List topic messages from Mirror REST (used by timeline hydration later). */
export async function fetchTopicMessagesMirror(
  topicId: string,
  limit = 100,
): Promise<unknown> {
  const base = hederaConfig.mirrorRestBase.replace(/\/$/, "");
  const url = `${base}/api/v1/topics/${topicId}/messages?limit=${limit}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) {
    throw new Error(`Mirror request failed: ${res.status} ${url}`);
  }
  return res.json();
}
