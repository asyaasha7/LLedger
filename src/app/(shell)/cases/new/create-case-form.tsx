"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { routes } from "@/config/routes";
import { Button } from "@/components/ui/button";
import {
  formInputClassName,
  formTextareaClassName,
} from "@/components/ui/form-styles";

export function CreateCaseForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const propertyRef = String(fd.get("propertyRef") ?? "").trim();
    const landlordDisplayName = String(fd.get("landlordDisplayName") ?? "").trim();
    const tenantDisplayName = String(fd.get("tenantDisplayName") ?? "").trim();
    const tenantEmail = String(fd.get("tenantEmail") ?? "").trim();
    const depositDollars = String(fd.get("depositDollars") ?? "").trim();
    const leaseStart = String(fd.get("leaseStart") ?? "").trim();
    const leaseEnd = String(fd.get("leaseEnd") ?? "").trim();
    const notes = String(fd.get("notes") ?? "").trim();

    const idempotencyKey =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;

    const res = await fetch("/api/lease-cases", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({
        propertyRef,
        landlordDisplayName,
        tenantDisplayName,
        tenantEmail: tenantEmail || null,
        depositDollars,
        leaseStart,
        leaseEnd,
        notes,
      }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      leaseId?: string;
    };

    if (!res.ok) {
      setError(data.error ?? `Request failed (${res.status})`);
      setPending(false);
      return;
    }
    if (data.leaseId) {
      router.push(routes.case(data.leaseId).overview);
      router.refresh();
      return;
    }
    setError("Unexpected response");
    setPending(false);
  }

  return (
    <div className="border border-outline-variant/20 bg-surface-card p-6 sm:p-8">
      <form className="space-y-6" onSubmit={onSubmit}>
        <Field label="Property / unit" name="propertyRef" placeholder="e.g. Unit 4B" required />
        <Field
          label="Landlord name"
          name="landlordDisplayName"
          placeholder="Your name or organization"
          required
        />
        <Field
          label="Tenant name"
          name="tenantDisplayName"
          placeholder="Full name"
          required
        />
        <Field
          label="Tenant email"
          name="tenantEmail"
          placeholder="email@example.com"
          type="email"
        />
        <Field
          label="Deposit (USD)"
          name="depositDollars"
          placeholder="2400.00"
          inputMode="decimal"
          required
        />
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Lease start" name="leaseStart" type="date" required />
          <Field label="Lease end" name="leaseEnd" type="date" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink">
            Optional notes
          </label>
          <p className="mt-1 text-xs text-ink-muted">
            Short context for your team (optional)
          </p>
          <textarea
            name="notes"
            rows={3}
            className={formTextareaClassName}
            placeholder="Anything helpful for later review…"
          />
        </div>

        {error ? (
          <p className="text-sm text-accent-magenta" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-3 border-t border-outline-variant/15 pt-6 sm:flex-row sm:justify-between">
          <Link href={routes.dashboard}>
            <Button variant="secondary" type="button" className="w-full sm:w-auto">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            variant="primary"
            className="w-full sm:w-auto"
            disabled={pending}
          >
            {pending ? "Creating…" : "Create case"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  placeholder,
  type = "text",
  inputMode,
  required,
}: {
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        inputMode={inputMode}
        placeholder={placeholder}
        className={formInputClassName}
      />
    </div>
  );
}
