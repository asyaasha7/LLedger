"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  formInputClassName,
  formTextareaClassName,
} from "@/components/ui/form-styles";

const EVIDENCE_TYPES = [
  { value: "MOVE_IN_PHOTO", label: "Move-in photo" },
  { value: "MOVE_OUT_PHOTO", label: "Move-out photo" },
  { value: "DAMAGE_PHOTO", label: "Damage photo" },
  { value: "VIDEO", label: "Video" },
  { value: "INVOICE", label: "Invoice" },
  { value: "REPAIR_RECEIPT", label: "Repair / receipt" },
  { value: "NOTE", label: "Note" },
  { value: "DOCUMENT", label: "Document / PDF" },
  { value: "OTHER", label: "Other" },
] as const;

const CATEGORIES = [
  "Move-In",
  "Move-Out",
  "Damage",
  "Receipts",
] as const;

export function EvidenceUploadForm({
  leaseId,
  evidenceListHref,
}: {
  leaseId: string;
  evidenceListHref: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const file = fd.get("file");
    if (!(file instanceof File) || file.size === 0) {
      setError("Choose a file to upload.");
      setPending(false);
      return;
    }

    const res = await fetch(`/api/lease-cases/${leaseId}/evidence`, {
      method: "POST",
      credentials: "include",
      body: fd,
    });

    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      detail?: string;
    };

    if (!res.ok) {
      setError(data.detail ?? data.error ?? `Upload failed (${res.status})`);
      setPending(false);
      return;
    }

    form.reset();
    router.push(evidenceListHref);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-ink">File</label>
        <input
          name="file"
          type="file"
          required
          className={`${formInputClassName} mt-2 py-2 file:mr-4 file:bg-surface-card file:font-headline file:text-xs file:font-bold file:uppercase`}
        />
        <p className="mt-1 text-xs text-ink-muted">
          JPG, PNG, PDF, etc. — encrypted server-side before storage (max 25 MB).
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-ink">Type</label>
          <select
            name="evidenceType"
            className={`${formInputClassName} mt-2`}
            defaultValue="MOVE_IN_PHOTO"
          >
            {EVIDENCE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink">Category</label>
          <select
            name="category"
            className={`${formInputClassName} mt-2`}
            defaultValue="Move-In"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-ink">Title</label>
        <input
          name="title"
          className={`${formInputClassName} mt-2`}
          placeholder="Short label"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink">
          Description
        </label>
        <textarea
          name="description"
          rows={3}
          className={formTextareaClassName}
          placeholder="What this file shows"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink">
          Room / area (optional)
        </label>
        <input
          name="roomTag"
          className={`${formInputClassName} mt-2`}
          placeholder="Kitchen, hall…"
        />
      </div>

      {error ? (
        <p className="text-sm text-accent-magenta" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3 border-t border-outline-variant/15 pt-6">
        <Link href={evidenceListHref}>
          <Button type="button" variant="secondary">
            Cancel
          </Button>
        </Link>
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Uploading…" : "Upload evidence"}
        </Button>
      </div>
    </form>
  );
}
