"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  formInputClassName,
  formTextareaClassName,
} from "@/components/ui/form-styles";

function dollarsFromCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

type DepositFormProps = {
  leaseId: string;
  depositCents: number;
  disabled: boolean;
};

export function DepositAdjustForm({
  leaseId,
  depositCents,
  disabled,
}: DepositFormProps) {
  const router = useRouter();
  const [value, setValue] = useState(dollarsFromCents(depositCents));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setValue(dollarsFromCents(depositCents));
  }, [depositCents]);

  if (disabled) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const res = await fetch(`/api/lease-cases/${encodeURIComponent(leaseId)}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ depositDollars: value.trim() }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setPending(false);
    if (!res.ok) {
      setError(data.error ?? `Failed (${res.status})`);
      return;
    }
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded border border-outline-variant/20 bg-surface-low/80 p-4"
    >
      <p className="font-headline text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted">
        Security deposit (held)
      </p>
      <p className="mt-1 text-xs text-ink-secondary">
        Update the recorded deposit before you publish a settlement. Not a bank
        transfer — this value drives refund math.
      </p>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="sr-only" htmlFor="deposit-dollars">
            Deposit USD
          </label>
          <input
            id="deposit-dollars"
            className={formInputClassName}
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Saving…" : "Save deposit"}
        </Button>
      </div>
      {error ? (
        <p className="mt-2 text-sm text-accent-magenta" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}

type DeductionFormProps = {
  leaseId: string;
  disabled: boolean;
};

export function DeductionProposalForm({ leaseId, disabled }: DeductionFormProps) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (disabled) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const res = await fetch(
      `/api/lease-cases/${encodeURIComponent(leaseId)}/deduction-proposal`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deductionDollars: amount.trim(),
          reason: reason.trim(),
          linkedEvidenceIds: [],
        }),
      },
    );
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setPending(false);
    if (!res.ok) {
      setError(data.error ?? `Failed (${res.status})`);
      return;
    }
    setAmount("");
    setReason("");
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded border border-outline-variant/20 bg-surface-low/80 p-4"
    >
      <p className="font-headline text-[10px] font-bold uppercase tracking-[0.2em] text-accent-ledger">
        Deduction proposal
      </p>
      <p className="mt-1 text-xs text-ink-secondary">
        Required before &quot;Publish deduction proposal&quot;. Sets the active
        deduction used for settlement and HCS.
      </p>
      <div className="mt-3 space-y-3">
        <div>
          <label className="block text-sm font-medium text-ink">
            Deduction (USD)
          </label>
          <input
            className={formInputClassName}
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink">Reason</label>
          <textarea
            className={formTextareaClassName}
            rows={3}
            placeholder="Wall repair, cleaning, etc."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            minLength={3}
          />
        </div>
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Saving…" : "Save deduction proposal"}
        </Button>
      </div>
      {error ? (
        <p className="mt-2 text-sm text-accent-magenta" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
