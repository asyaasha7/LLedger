"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import type { EvidenceItem, EvidenceType } from "@/domain";
import { evidenceFileUrl } from "@/lib/evidence-file-url";
import { EvidenceReviewActions } from "@/components/case/evidence-review-actions";

function previewKind(t: EvidenceType): "image" | "video" | "pdf" | "other" {
  if (
    t === "MOVE_IN_PHOTO" ||
    t === "MOVE_OUT_PHOTO" ||
    t === "DAMAGE_PHOTO"
  ) {
    return "image";
  }
  if (t === "VIDEO") return "video";
  if (t === "INVOICE" || t === "REPAIR_RECEIPT" || t === "DOCUMENT") {
    return "pdf";
  }
  return "other";
}

type Props = {
  leaseId: string;
  items: EvidenceItem[];
  canReview: boolean;
  landlordDisplayName: string;
  tenantDisplayName: string;
  linkedContext?: ReactNode;
};

export function EvidenceReviewWorkspace({
  leaseId,
  items,
  canReview,
  landlordDisplayName,
  tenantDisplayName,
  linkedContext,
}: Props) {
  const [selectedId, setSelectedId] = useState(items[0]?.evidenceId ?? "");

  useEffect(() => {
    if (items.length === 0) {
      setSelectedId("");
      return;
    }
    if (!items.some((e) => e.evidenceId === selectedId)) {
      setSelectedId(items[0]!.evidenceId);
    }
  }, [items, selectedId]);

  const selected = items.find((e) => e.evidenceId === selectedId);
  const fileUrl =
    selectedId && leaseId ? evidenceFileUrl(leaseId, selectedId) : "";
  const kind = selected ? previewKind(selected.evidenceType) : "other";

  const submitterLabel =
    selected?.submitterRole === "landlord"
      ? landlordDisplayName
      : tenantDisplayName;

  return (
    <div className="grid min-h-[60vh] gap-4 lg:grid-cols-2">
      <div className="flex flex-col border border-outline-variant/15 bg-surface-low p-4 lg:p-6">
        <div className="relative flex min-h-[280px] flex-1 items-center justify-center overflow-hidden bg-surface-highest/50">
          {!selected || !fileUrl ? (
            <p className="text-sm text-ink-muted">No evidence selected</p>
          ) : kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element -- authenticated same-origin API
            <img
              src={fileUrl}
              alt={selected.title}
              className="max-h-[min(70vh,520px)] w-full object-contain"
            />
          ) : kind === "video" ? (
            <video
              src={fileUrl}
              controls
              className="max-h-[min(70vh,520px)] w-full"
            />
          ) : kind === "pdf" ? (
            <iframe
              title={selected.title}
              src={fileUrl}
              className="h-[min(70vh,520px)] w-full border-0 bg-surface-card"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 p-6 text-center">
              <p className="text-sm text-ink-secondary">
                Preview is not available for this type. Open the decrypted file
                in a new tab.
              </p>
              <a
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                className="font-headline text-[10px] font-bold uppercase tracking-widest text-accent-ledger underline"
              >
                Open file
              </a>
            </div>
          )}
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar">
          {items.map((e) => {
            const active = e.evidenceId === selectedId;
            const thumbKind = previewKind(e.evidenceType);
            return (
              <button
                key={e.evidenceId}
                type="button"
                onClick={() => setSelectedId(e.evidenceId)}
                className={`relative h-14 w-20 shrink-0 overflow-hidden bg-surface-highest ring-2 transition-shadow ${
                  active ? "ring-accent-ledger" : "ring-transparent"
                }`}
                aria-label={`Show ${e.title}`}
              >
                {thumbKind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={evidenceFileUrl(leaseId, e.evidenceId)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center font-sans text-[9px] uppercase tracking-wider text-ink-muted">
                    {e.evidenceType.replaceAll("_", " ").slice(0, 8)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="border border-outline-variant/15 bg-surface-card p-6">
          <dl className="grid gap-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Type</dt>
              <dd className="font-headline font-medium text-ink">
                {selected?.evidenceType.replaceAll("_", " ") ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Submitted by</dt>
              <dd className="font-headline font-medium text-ink">
                {selected ? submitterLabel : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Content hash</dt>
              <dd className="max-w-[14rem] truncate font-mono text-xs text-ink">
                {selected?.fileHash ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Encrypted storage</dt>
              <dd className="max-w-[14rem] truncate font-mono text-xs text-ink-muted">
                {selected?.encryptedStorageRef ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Room</dt>
              <dd className="font-headline font-medium text-ink">
                {selected?.roomTag ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Review status</dt>
              <dd className="font-headline font-medium text-ink">
                {selected?.reviewStatus ?? "—"}
              </dd>
            </div>
          </dl>
          <div className="mt-6 border-t border-outline-variant/15 pt-6">
            <p className="font-headline text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted">
              Description
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
              {selected?.description ??
                "Select an evidence item from the strip to review."}
            </p>
          </div>
          <div className="mt-6 border-t border-outline-variant/15 pt-6">
            <EvidenceReviewActions
              leaseId={leaseId}
              items={items}
              canReview={canReview}
              selectedId={selectedId}
              onSelectedIdChange={setSelectedId}
            />
          </div>
        </div>

        {linkedContext}
      </div>
    </div>
  );
}
