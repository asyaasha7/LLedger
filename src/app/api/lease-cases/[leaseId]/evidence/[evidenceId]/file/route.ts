import { NextResponse } from "next/server";
import { envelopeDecrypt } from "@/server/crypto/envelope-encrypt";
import { getSessionUser } from "@/server/auth/session";
import { hasCaseAccess } from "@/server/repos/case-memberships.repo";
import { getEvidenceItemByIds } from "@/server/repos/evidence.repo";
import {
  loadEncryptedEvidenceBlob,
  sniffContentTypeFromBytes,
} from "@/server/evidence/load-encrypted-blob";
import { isDatabaseConfigured } from "@/server/db/client";

export async function GET(
  _request: Request,
  context: { params: Promise<{ leaseId: string; evidenceId: string }> },
) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "DATABASE_URL is not configured" },
      { status: 503 },
    );
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { leaseId, evidenceId } = await context.params;
  if (!(await hasCaseAccess(leaseId, user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const row = await getEvidenceItemByIds(leaseId, evidenceId);
  if (!row) {
    return NextResponse.json({ error: "Evidence not found" }, { status: 404 });
  }

  let ciphertext: Buffer;
  try {
    ciphertext = await loadEncryptedEvidenceBlob(row.encryptedStorageRef);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Could not load encrypted file" },
      { status: 502 },
    );
  }

  let plaintext: Buffer;
  try {
    plaintext = envelopeDecrypt(ciphertext);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Could not decrypt file (check EVIDENCE_ENCRYPTION_KEY)" },
      { status: 500 },
    );
  }

  const contentType = sniffContentTypeFromBytes(plaintext);

  return new NextResponse(new Uint8Array(plaintext), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, no-store",
    },
  });
}
