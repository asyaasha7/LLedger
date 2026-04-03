import { createHash, randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { envelopeEncrypt } from "@/server/crypto/envelope-encrypt";
import { getSessionUser } from "@/server/auth/session";
import { hasCaseAccess, getMembershipRole } from "@/server/repos/case-memberships.repo";
import { insertEvidenceItem } from "@/server/repos/evidence.repo";
import { publishCaseEventToHedera } from "@/server/services/publish-case-event-hedera";
import { isDatabaseConfigured } from "@/server/db/client";
import { createServiceRoleClient } from "@/utils/supabase/service";
import type { EvidenceCategory, EvidenceType } from "@/domain";

const MAX_BYTES = 25 * 1024 * 1024;

const EVIDENCE_TYPES = new Set<string>([
  "MOVE_IN_PHOTO",
  "MOVE_OUT_PHOTO",
  "DAMAGE_PHOTO",
  "VIDEO",
  "INVOICE",
  "REPAIR_RECEIPT",
  "NOTE",
  "DOCUMENT",
  "OTHER",
]);

const CATEGORIES = new Set<string>([
  "Move-In",
  "Move-Out",
  "Damage",
  "Receipts",
]);

export async function POST(
  request: Request,
  context: { params: Promise<{ leaseId: string }> },
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

  const { leaseId } = await context.params;
  if (!(await hasCaseAccess(leaseId, user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const role = await getMembershipRole(leaseId, user.id);
  if (role !== "landlord" && role !== "tenant") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ct = request.headers.get("content-type") ?? "";
  if (!ct.includes("multipart/form-data")) {
    return NextResponse.json(
      { error: "Expected multipart/form-data" },
      { status: 400 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large" }, { status: 413 });
  }

  const evidenceType = String(form.get("evidenceType") ?? "OTHER");
  const category = String(form.get("category") ?? "Move-In");
  const title = String(form.get("title") ?? "").trim() || file.name;
  const description = String(form.get("description") ?? "").trim() || "—";
  const roomTag = form.get("roomTag")
    ? String(form.get("roomTag")).trim()
    : null;

  if (!EVIDENCE_TYPES.has(evidenceType)) {
    return NextResponse.json({ error: "Invalid evidenceType" }, { status: 400 });
  }
  if (!CATEGORIES.has(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const fileHash = `sha256:${createHash("sha256").update(buf).digest("hex")}`;
  let ciphertext: Buffer;
  try {
    ciphertext = envelopeEncrypt(buf);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Encryption failed";
    return NextResponse.json({ error: msg }, { status: 503 });
  }

  const evidenceId = `ev-${randomBytes(8).toString("hex")}`;
  const objectPath = `${leaseId}/${evidenceId}.enc`;

  const admin = createServiceRoleClient();
  let encryptedStorageRef: string;

  if (admin) {
    const { error: upErr } = await admin.storage
      .from("evidence")
      .upload(objectPath, ciphertext, {
        contentType: "application/octet-stream",
        upsert: false,
      });
    if (upErr) {
      console.error(upErr);
      return NextResponse.json(
        {
          error: "Storage upload failed",
          detail: upErr.message,
        },
        { status: 502 },
      );
    }
    encryptedStorageRef = `supabase:evidence:${objectPath}`;
  } else {
    const dir = path.join(process.cwd(), "data", "encrypted-evidence", leaseId);
    await mkdir(dir, { recursive: true });
    const fp = path.join(dir, `${evidenceId}.enc`);
    await writeFile(fp, ciphertext);
    encryptedStorageRef = `local:${leaseId}/${evidenceId}.enc`;
  }

  let caseEventId = "";
  try {
    const inserted = await insertEvidenceItem({
      leaseId,
      evidenceId,
      submittedByUserId: user.id,
      submitterRole: role,
      evidenceType: evidenceType as EvidenceType,
      category: category as EvidenceCategory,
      title,
      description,
      roomTag,
      fileHash,
      encryptedStorageRef,
    });
    caseEventId = inserted.caseEventId;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Database write failed" }, { status: 500 });
  }

  const hedera = await publishCaseEventToHedera(caseEventId);

  return NextResponse.json({
    evidenceId,
    fileHash,
    encryptedStorageRef,
    hedera: hedera.ok
      ? { published: !hedera.skipped }
      : { error: hedera.reason },
  });
}
