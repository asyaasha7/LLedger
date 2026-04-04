"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formInputClassName } from "@/components/ui/form-styles";

export function InviteTenantForm({ leaseId }: { leaseId: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [magicLink, setMagicLink] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);
    setMagicLink(null);
    const res = await fetch(`/api/lease-cases/${leaseId}/invites`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      message?: string;
      magicLink?: string;
      detail?: string;
    };
    if (!res.ok) {
      setStatus("error");
      setMessage(data.error ?? `Failed (${res.status})`);
      return;
    }
    setStatus("done");
    setMessage(data.message ?? "Invite sent.");
    if (data.magicLink) setMagicLink(data.magicLink);
    setEmail("");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-ink">
          Tenant email
        </label>
        <p className="mt-1 text-xs text-ink-muted">
          Sends a Supabase magic link that attaches them to this case after
          sign-in. The tenant must use the <strong>same email</strong> you enter
          here. In Supabase Auth, allow your app&apos;s{" "}
          <code className="font-mono text-[10px]">/auth/callback</code> URL as a
          redirect.
        </p>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`${formInputClassName} mt-2`}
          placeholder="tenant@example.com"
        />
      </div>
      <Button type="submit" variant="primary" disabled={status === "loading"}>
        {status === "loading" ? "Sending…" : "Invite tenant"}
      </Button>
      {message ? (
        <p className="text-sm text-ink-secondary">{message}</p>
      ) : null}
      {magicLink ? (
        <div className="rounded border border-outline-variant/20 bg-surface-low p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">
            Fallback link (share if email did not arrive)
          </p>
          <p className="mt-2 break-all font-mono text-xs text-accent-ledger">
            {magicLink}
          </p>
        </div>
      ) : null}
    </form>
  );
}
