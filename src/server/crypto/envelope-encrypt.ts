import "server-only";

import { createCipheriv, randomBytes } from "crypto";

function getKey(): Buffer {
  const raw = process.env.EVIDENCE_ENCRYPTION_KEY?.trim();
  if (!raw) {
    throw new Error(
      "EVIDENCE_ENCRYPTION_KEY is required for evidence uploads (32-byte key, base64-encoded).",
    );
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("EVIDENCE_ENCRYPTION_KEY must decode to 32 bytes (AES-256).");
  }
  return key;
}

/** AES-256-GCM envelope; prepends iv + auth tag with ciphertext. */
export function envelopeEncrypt(plaintext: Buffer): Buffer {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]);
}
