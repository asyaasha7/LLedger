"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formInputClassName } from "@/components/ui/form-styles";

type Props = {
  leaseId: string;
  canPropose: boolean;
  canRespond: boolean;
  canScheduleRefund: boolean;
  canCompleteRefund: boolean;
};

export function SettlementActions({
  leaseId,
  canPropose,
  canRespond,
  canScheduleRefund,
  canCompleteRefund,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [scheduleId, setScheduleId] = useState("");
  const [executionTxId, setExecutionTxId] = useState("");

  async function postJson(url: string, body?: object) {
    setError(null);
    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : "{}",
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? `Request failed (${res.status})`);
      return false;
    }
    router.refresh();
    return true;
  }

  return (
    <div className="mt-12 space-y-4 border-t border-outline-variant/20 pt-10">
      {canPropose ? (
        <div className="flex flex-wrap items-center gap-4">
          <Button
            variant="secondary"
            type="button"
            disabled={pending !== null}
            onClick={async () => {
              setPending("propose");
              await postJson(
                `/api/lease-cases/${encodeURIComponent(leaseId)}/settlement/propose`,
              );
              setPending(null);
            }}
          >
            {pending === "propose" ? "Publishing…" : "Publish deduction proposal"}
          </Button>
          <p className="text-xs text-ink-muted">
            Writes settlement from the active deduction proposal and emits{" "}
            <code className="font-mono text-[10px]">DEDUCTION_PROPOSED</code> to
            HCS.
          </p>
        </div>
      ) : null}

      {canRespond ? (
        <div className="flex flex-wrap gap-4">
          <Button
            variant="primary"
            type="button"
            disabled={pending !== null}
            onClick={async () => {
              setPending("approve");
              await postJson(
                `/api/lease-cases/${encodeURIComponent(leaseId)}/settlement/respond`,
                { decision: "approve" },
              );
              setPending(null);
            }}
          >
            {pending === "approve" ? "Saving…" : "Approve settlement"}
          </Button>
          <Button
            variant="destructive"
            type="button"
            disabled={pending !== null}
            onClick={async () => {
              setPending("reject");
              await postJson(
                `/api/lease-cases/${encodeURIComponent(leaseId)}/settlement/respond`,
                { decision: "reject" },
              );
              setPending(null);
            }}
          >
            {pending === "reject" ? "Saving…" : "Reject"}
          </Button>
        </div>
      ) : null}

      {canScheduleRefund ? (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-ink">
            Hedera schedule ID
          </label>
          <input
            className={formInputClassName}
            placeholder="e.g. 0.0.1234567"
            value={scheduleId}
            onChange={(e) => setScheduleId(e.target.value)}
          />
          <Button
            variant="secondary"
            type="button"
            disabled={pending !== null || !scheduleId.trim()}
            onClick={async () => {
              setPending("schedule");
              await postJson(
                `/api/lease-cases/${encodeURIComponent(leaseId)}/settlement/schedule-refund`,
                { scheduleId: scheduleId.trim() },
              );
              setPending(null);
            }}
          >
            {pending === "schedule" ? "Recording…" : "Record refund schedule"}
          </Button>
          <p className="text-xs text-ink-muted">
            Stores the schedule reference and emits{" "}
            <code className="font-mono text-[10px]">REFUND_SCHEDULED</code>. Use
            the ID from your Hedera scheduled transaction.
          </p>
        </div>
      ) : null}

      {canCompleteRefund ? (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-ink">
            Execution transaction ID (optional)
          </label>
          <input
            className={formInputClassName}
            placeholder="Hedera transaction id, if available"
            value={executionTxId}
            onChange={(e) => setExecutionTxId(e.target.value)}
          />
          <Button
            variant="primary"
            type="button"
            disabled={pending !== null}
            onClick={async () => {
              setPending("complete");
              await postJson(
                `/api/lease-cases/${encodeURIComponent(leaseId)}/settlement/complete-refund`,
                {
                  executionTxId: executionTxId.trim() || undefined,
                },
              );
              setPending(null);
            }}
          >
            {pending === "complete" ? "Recording…" : "Mark refund executed"}
          </Button>
          <p className="text-xs text-ink-muted">
            Sets case to <code className="font-mono text-[10px]">REFUND_COMPLETE</code>, settlement to{" "}
            <code className="font-mono text-[10px]">EXECUTED</code>, and emits{" "}
            <code className="font-mono text-[10px]">REFUND_EXECUTED</code> to HCS.
          </p>
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-accent-magenta" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
