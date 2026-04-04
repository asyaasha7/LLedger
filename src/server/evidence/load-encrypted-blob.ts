import "server-only";

import { readFile } from "fs/promises";
import path from "path";
import { createServiceRoleClient } from "@/utils/supabase/service";

export async function loadEncryptedEvidenceBlob(
  encryptedStorageRef: string,
): Promise<Buffer> {
  if (encryptedStorageRef.startsWith("supabase:evidence:")) {
    const objectPath = encryptedStorageRef.slice("supabase:evidence:".length);
    const admin = createServiceRoleClient();
    if (!admin) {
      throw new Error("Supabase storage is not configured.");
    }
    const { data, error } = await admin.storage
      .from("evidence")
      .download(objectPath);
    if (error || !data) {
      throw new Error(error?.message ?? "Storage download failed.");
    }
    return Buffer.from(await data.arrayBuffer());
  }

  if (encryptedStorageRef.startsWith("local:")) {
    const rel = encryptedStorageRef.slice("local:".length);
    const fp = path.join(process.cwd(), "data", "encrypted-evidence", rel);
    return readFile(fp);
  }

  throw new Error("Unknown encrypted storage reference.");
}

/** Best-effort MIME from decrypted file magic (upload did not persist original type). */
export function sniffContentTypeFromBytes(buf: Buffer): string {
  if (buf.length >= 12) {
    if (
      buf[4] === 0x66 &&
      buf[5] === 0x74 &&
      buf[6] === 0x79 &&
      buf[7] === 0x70
    ) {
      return "video/mp4";
    }
  }
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  ) {
    return "image/png";
  }
  if (buf.length >= 6 && buf.subarray(0, 6).toString("ascii") === "GIF87a") {
    return "image/gif";
  }
  if (buf.length >= 6 && buf.subarray(0, 6).toString("ascii") === "GIF89a") {
    return "image/gif";
  }
  if (
    buf.length >= 12 &&
    buf.subarray(0, 4).toString("ascii") === "RIFF" &&
    buf.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }
  if (buf.length >= 5 && buf.subarray(0, 5).toString("ascii") === "%PDF-") {
    return "application/pdf";
  }
  return "application/octet-stream";
}
