import { describe, expect, it, beforeAll } from "vitest";
import { envelopeDecrypt, envelopeEncrypt } from "./envelope-encrypt";

beforeAll(() => {
  process.env.EVIDENCE_ENCRYPTION_KEY = Buffer.alloc(32, 9).toString("base64");
});

describe("envelopeEncrypt", () => {
  it("produces ciphertext longer than plaintext (iv + tag + data)", () => {
    const plain = Buffer.from("lease-ledger evidence");
    const enc = envelopeEncrypt(plain);
    expect(enc.length).toBeGreaterThan(plain.length);
  });

  it("rejects invalid key length", () => {
    const prev = process.env.EVIDENCE_ENCRYPTION_KEY;
    process.env.EVIDENCE_ENCRYPTION_KEY = Buffer.alloc(16).toString("base64");
    expect(() => envelopeEncrypt(Buffer.from("x"))).toThrow(/32 bytes/);
    process.env.EVIDENCE_ENCRYPTION_KEY = prev;
  });

  it("round-trips plaintext", () => {
    const plain = Buffer.from("lease-ledger evidence bytes");
    const enc = envelopeEncrypt(plain);
    expect(envelopeDecrypt(enc).equals(plain)).toBe(true);
  });
});
