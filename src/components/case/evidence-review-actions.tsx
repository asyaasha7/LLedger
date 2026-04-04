"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { EvidenceItem } from "@/domain";
import { Button } from "@/components/ui/button";
import { formTextareaClassName } from "@/components/ui/form-styles";

type Props = {
  leaseId: string;
  items: EvidenceItem[];
  canReview: boolean;
  /** When set with {@link onSelectedIdChange}, selection is controlled by the parent (e.g. preview pane). */
  selectedId?: string;
  onSelectedIdChange?: (evidenceId: string) => void;
};

export function EvidenceReviewActions({
  leaseId,
  items,
  canReview,
  selectedId: controlledSelectedId,
  onSelectedIdChange,
}: Props) {
  const router = useRouter();
  const [uncontrolledId, setUncontrolledId] = useState(
    items[0]?.evidenceId ?? "",
  );
  const selectedId = controlledSelectedId ?? uncontrolledId;
  const setSelectedId = onSelectedIdChange ?? setUncontrolledId;
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"acknowledge" | "dispute" | null>(
    null,
  );

  const selected = items.find((e) => e.evidenceId === selectedId);

  async function submit(action: "acknowledge" | "dispute") {
    if (!selectedId) return;
    setError(null);
    setPending(action);
    const res = await fetch(
      `/api/lease-cases/${encodeURIComponent(leaseId)}/evidence/${encodeURIComponent(selectedId)}`,
      {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          note: action === "dispute" ? note || undefined : undefined,
        }),
      },
    );
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setPending(null);
    if (!res.ok) {
      setError(data.error ?? `Request failed (${res.status})`);
      return;
    }
    setNote("");
    router.refresh();
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-ink-muted">
        No evidence items yet. Upload files from the evidence library first.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-ink">Item</label>
        <select
          className="mt-1 w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm text-ink"
          value={selectedId}
          onChange={(e) => {
            setSelectedId(e.target.value);
            setError(null);
          }}
        >
          {items.map((e) => (
            <option key={e.evidenceId} value={e.evidenceId}>
              {e.title} · {e.reviewStatus}
            </option>
          ))}
        </select>
      </div>

      {selected ? (
        <dl className="grid gap-2 text-sm text-ink-secondary">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Review status</dt>
            <dd className="font-medium text-ink">{selected.reviewStatus}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Hash</dt>
            <dd className="max-w-[14rem] truncate font-mono text-xs">
              {selected.fileHash}
            </dd>
          </div>
        </dl>
      ) : null}

      {canReview && selected?.reviewStatus === "SUBMITTED" ? (
        <>
          <div>
            <label className="block text-sm font-medium text-ink">
              Dispute reason (optional)
            </label>
            <p className="mt-1 text-xs text-ink-muted">
              Sent with the dispute event on Hedera (plain text).
            </p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className={`${formTextareaClassName} mt-2`}
              placeholder="Why this evidence is contested…"
            />
          </div>
          {error ? (
            <p className="text-sm text-accent-magenta" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button
              variant="primary"
              type="button"
              className="flex-1 sm:flex-none"
              disabled={pending !== null}
              onClick={() => submit("acknowledge")}
            >
              {pending === "acknowledge" ? "Saving…" : "Acknowledge"}
            </Button>
            <Button
              variant="secondary"
              type="button"
              className="flex-1 sm:flex-none"
              disabled={pending !== null}
              onClick={() => submit("dispute")}
            >
              {pending === "dispute" ? "Saving…" : "Dispute"}
            </Button>
          </div>
        </>
      ) : canReview ? (
        <p className="text-sm text-ink-muted">
          This item is not in <strong>SUBMITTED</strong> status; review actions
          are disabled.
        </p>
      ) : (
        <p className="text-sm text-ink-muted">
          Only the counterparty can acknowledge or dispute submitted evidence.
        </p>
      )}
    </div>
  );
}
